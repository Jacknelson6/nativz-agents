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
}

impl SidecarManager {
    pub fn new(runtime_path: String) -> Self {
        Self {
            process: None,
            next_id: AtomicU64::new(1),
            pending: Arc::new(Mutex::new(HashMap::new())),
            runtime_path,
        }
    }

    pub fn set_runtime_path(&mut self, path: String) {
        self.runtime_path = path;
    }

    pub fn start(&mut self, app_handle: AppHandle) -> Result<(), String> {
        if self.process.is_some() {
            return Ok(());
        }

        let runtime_dir = std::path::Path::new(&self.runtime_path)
            .parent().unwrap()
            .parent().unwrap();

        // Use npx tsx to run the TypeScript runtime
        // macOS .app bundles don't inherit user PATH, so discover node/npx dynamically
        let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/unknown".to_string());

        // Build candidate list: check common nvm/fnm/homebrew/volta paths
        let mut npx_candidates: Vec<String> = vec![
            "/opt/homebrew/bin/npx".to_string(),        // Apple Silicon homebrew
            "/usr/local/bin/npx".to_string(),           // Intel homebrew
        ];

        // Discover nvm versions dynamically (instead of hardcoding)
        let nvm_dir = format!("{}/.nvm/versions/node", home);
        if let Ok(entries) = std::fs::read_dir(&nvm_dir) {
            let mut versions: Vec<_> = entries
                .filter_map(|e| e.ok())
                .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
                .collect();
            // Sort by name descending to prefer latest version
            versions.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
            for entry in versions {
                let npx = entry.path().join("bin").join("npx");
                if npx.exists() {
                    npx_candidates.push(npx.to_string_lossy().to_string());
                    break; // use the latest version
                }
            }
        }

        // Check fnm and volta too
        let fnm_path = format!("{}/.local/share/fnm/node-versions", home);
        if std::path::Path::new(&fnm_path).exists() {
            npx_candidates.push(format!("{}/.local/share/fnm/aliases/default/bin/npx", home));
        }
        let volta_path = format!("{}/.volta/bin/npx", home);
        if std::path::Path::new(&volta_path).exists() {
            npx_candidates.push(volta_path);
        }

        npx_candidates.push("npx".to_string()); // fallback to PATH

        let npx_path = npx_candidates.iter()
            .find(|p| std::path::Path::new(p.as_str()).exists() || p.as_str() == "npx")
            .cloned()
            .unwrap_or_else(|| "npx".to_string());

        eprintln!("[sidecar] Using npx at: {}", npx_path);
        eprintln!("[sidecar] Spawning: {} tsx {} in {:?}", npx_path, &self.runtime_path, runtime_dir);

        // Build PATH that includes the discovered node bin directory
        let npx_dir = std::path::Path::new(&npx_path)
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
        let path_env = format!(
            "{}:/opt/homebrew/bin:/usr/local/bin:{}",
            npx_dir,
            std::env::var("PATH").unwrap_or_default()
        );

        let mut child = Command::new(npx_path)
            .arg("tsx")
            .arg(&self.runtime_path)
            .env("PATH", &path_env)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .current_dir(runtime_dir)
            .spawn()
            .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

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

                // Try to parse as JSON
                if let Ok(parsed) = serde_json::from_str::<Value>(&line) {
                    // Check if it's a JSON-RPC notification (no "id" field = notification)
                    if parsed.get("method").and_then(|m| m.as_str()) == Some("stream_chunk")
                        && parsed.get("id").is_none()
                    {
                        // Emit as Tauri event for the frontend
                        if let Some(params) = parsed.get("params") {
                            let _ = app.emit("agent-stream", params.clone());
                        }
                    } else if let Ok(resp) = serde_json::from_value::<JsonRpcResponse>(parsed.clone()) {
                        // It's a JSON-RPC response with an id
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
                    // Not JSON — log line
                    let _ = app.emit("sidecar-output", &line);
                }
            }
        });

        // Stderr reader (just log it)
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
