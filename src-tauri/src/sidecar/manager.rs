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

    pub fn start(&mut self, app_handle: AppHandle) -> Result<(), String> {
        if self.process.is_some() {
            return Ok(());
        }

        let mut child = Command::new("npx")
            .arg("tsx")
            .arg(&self.runtime_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .current_dir(std::path::Path::new(&self.runtime_path).parent().unwrap().parent().unwrap())
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

                // Try to parse as JSON-RPC response
                if let Ok(resp) = serde_json::from_str::<JsonRpcResponse>(&line) {
                    let mut pending = pending.lock().unwrap();
                    if let Some(tx) = pending.remove(&resp.id) {
                        if let Some(err) = resp.error {
                            let _ = tx.send(Err(err.to_string()));
                        } else {
                            let _ = tx.send(Ok(resp.result.unwrap_or(Value::Null)));
                        }
                    }
                } else {
                    // Might be a streaming event or log line — emit as event
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
