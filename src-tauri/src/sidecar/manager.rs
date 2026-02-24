use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Serialize, Deserialize)]
struct JsonRpcRequest {
    jsonrpc: String,
    id: u64,
    method: String,
    params: Value,
}

#[derive(Debug, Serialize, Deserialize)]
struct JsonRpcResponse {
    jsonrpc: String,
    id: u64,
    result: Option<Value>,
    error: Option<Value>,
}

struct SidecarProcess {
    child: Child,
}

pub struct SidecarManager {
    process: Option<SidecarProcess>,
    next_id: AtomicU64,
    pending: Arc<Mutex<HashMap<u64, tokio::sync::oneshot::Sender<Result<Value, String>>>>>,
    runtime_path: String,
    use_node: bool, // true = run with `node` (bundled .mjs), false = `npx tsx` (dev .ts)
}

impl SidecarManager {
    pub fn new(runtime_path: String) -> Self {
        Self {
            process: None,
            next_id: AtomicU64::new(1),
            pending: Arc::new(Mutex::new(HashMap::new())),
            runtime_path,
            use_node: false,
        }
    }

    pub fn set_runtime_path(&mut self, path: String) {
        self.runtime_path = path;
    }

    pub fn set_use_node(&mut self, use_node: bool) {
        self.use_node = use_node;
    }

    /// Discover node/npx binary paths for macOS .app bundles
    /// (which don't inherit user PATH from shell profiles)
    fn discover_node_paths() -> (String, String, String) {
        let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/unknown".to_string());

        let mut candidates: Vec<String> = vec![
            "/opt/homebrew/bin".to_string(),
            "/usr/local/bin".to_string(),
        ];

        // Discover nvm versions dynamically
        let nvm_dir = format!("{}/.nvm/versions/node", home);
        if let Ok(entries) = std::fs::read_dir(&nvm_dir) {
            let mut versions: Vec<_> = entries
                .filter_map(|e| e.ok())
                .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
                .collect();
            versions.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
            for entry in versions {
                let bin = entry.path().join("bin");
                if bin.join("node").exists() {
                    candidates.push(bin.to_string_lossy().to_string());
                    break;
                }
            }
        }

        // fnm
        let fnm_bin = format!("{}/.local/share/fnm/aliases/default/bin", home);
        if std::path::Path::new(&fnm_bin).join("node").exists() {
            candidates.push(fnm_bin);
        }

        // volta
        let volta_bin = format!("{}/.volta/bin", home);
        if std::path::Path::new(&volta_bin).join("node").exists() {
            candidates.push(volta_bin);
        }

        // Find first existing node and npx
        let node_path = candidates.iter()
            .map(|d| format!("{}/node", d))
            .find(|p| std::path::Path::new(p).exists())
            .unwrap_or_else(|| "node".to_string());

        let npx_path = candidates.iter()
            .map(|d| format!("{}/npx", d))
            .find(|p| std::path::Path::new(p).exists())
            .unwrap_or_else(|| "npx".to_string());

        // Build PATH including all discovered bin dirs
        let extra_paths: Vec<String> = candidates.iter()
            .filter(|d| std::path::Path::new(d.as_str()).exists())
            .cloned()
            .collect();
        let path_env = format!(
            "{}:{}",
            extra_paths.join(":"),
            std::env::var("PATH").unwrap_or_default()
        );

        (node_path, npx_path, path_env)
    }

    pub fn start(&mut self, app_handle: AppHandle) -> Result<(), String> {
        if self.process.is_some() {
            return Ok(());
        }

        let runtime_dir = std::path::Path::new(&self.runtime_path)
            .parent().unwrap()
            .parent().unwrap();

        let (node_path, npx_path, path_env) = Self::discover_node_paths();

        let mut child = if self.use_node {
            // Production: run bundled .mjs with node directly
            eprintln!("[sidecar] Using node at: {}", node_path);
            eprintln!("[sidecar] Spawning: {} {} in {:?}", node_path, &self.runtime_path, runtime_dir);

            Command::new(&node_path)
                .arg(&self.runtime_path)
                .env("PATH", &path_env)
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .current_dir(runtime_dir)
                .spawn()
                .map_err(|e| format!("Failed to spawn sidecar (node): {}", e))?
        } else {
            // Dev: run TypeScript source with npx tsx
            eprintln!("[sidecar] Using npx at: {}", npx_path);
            eprintln!("[sidecar] Spawning: {} tsx {} in {:?}", npx_path, &self.runtime_path, runtime_dir);

            Command::new(&npx_path)
                .arg("tsx")
                .arg(&self.runtime_path)
                .env("PATH", &path_env)
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .current_dir(runtime_dir)
                .spawn()
                .map_err(|e| format!("Failed to spawn sidecar (tsx): {}", e))?
        };

        let stdout = child.stdout.take().ok_or("No stdout")?;
        let pending = self.pending.clone();
        let app = app_handle.clone();

        // Reader thread for stdout
        std::thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                let line = match line {
                    Ok(l) => l,
                    Err(_) => break,
                };
                if line.trim().is_empty() {
                    continue;
                }

                if let Ok(parsed) = serde_json::from_str::<Value>(&line) {
                    if parsed.get("method").and_then(|m| m.as_str()) == Some("stream_chunk")
                        && parsed.get("id").is_none()
                    {
                        if let Some(params) = parsed.get("params") {
                            let _ = app.emit("agent-stream", params.clone());
                        }
                    } else if let Ok(resp) = serde_json::from_value::<JsonRpcResponse>(parsed.clone()) {
                        let mut pending = pending.lock().unwrap();
                        if let Some(tx) = pending.remove(&resp.id) {
                            if let Some(err) = resp.error {
                                let _ = tx.send(Err(err.to_string()));
                            } else {
                                let _ = tx.send(Ok(resp.result.unwrap_or(Value::Null)));
                            }
                        }
                    } else {
                        let _ = app.emit("sidecar-output", &line);
                    }
                } else {
                    let _ = app.emit("sidecar-output", &line);
                }
            }
        });

        // Stderr reader
        let stderr = child.stderr.take();
        if let Some(stderr) = stderr {
            let app2 = app_handle.clone();
            std::thread::spawn(move || {
                let reader = BufReader::new(stderr);
                for line in reader.lines() {
                    if let Ok(l) = line {
                        eprintln!("[sidecar stderr] {}", l);
                        let _ = app2.emit("sidecar-error", &l);
                    }
                }
            });
        }

        self.process = Some(SidecarProcess { child });
        Ok(())
    }

    pub fn send_request(&mut self, method: &str, params: Value) -> Result<tokio::sync::oneshot::Receiver<Result<Value, String>>, String> {
        let process = self.process.as_mut().ok_or("Sidecar not running")?;
        let stdin = process.child.stdin.as_mut().ok_or("No stdin")?;

        let id = self.next_id.fetch_add(1, Ordering::SeqCst);
        let req = JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            id,
            method: method.to_string(),
            params,
        };

        let mut data = serde_json::to_string(&req).map_err(|e| e.to_string())?;
        data.push('\n');
        stdin.write_all(data.as_bytes()).map_err(|e| format!("Write failed: {}", e))?;
        stdin.flush().map_err(|e| format!("Flush failed: {}", e))?;

        let (tx, rx) = tokio::sync::oneshot::channel();
        self.pending.lock().unwrap().insert(id, tx);

        Ok(rx)
    }

    #[allow(dead_code)]
    pub fn is_running(&self) -> bool {
        self.process.is_some()
    }

    pub fn kill(&mut self) {
        if let Some(mut p) = self.process.take() {
            let _ = p.child.kill();
        }
    }
}

impl Drop for SidecarManager {
    fn drop(&mut self) {
        self.kill();
    }
}
