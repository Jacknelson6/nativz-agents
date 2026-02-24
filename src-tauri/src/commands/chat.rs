use crate::sidecar::SidecarManager;
use serde::Serialize;
use serde_json::json;
use std::sync::Mutex;

#[derive(Debug, Serialize, Clone)]
pub struct Message {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: u64,
}

#[tauri::command]
pub async fn send_message(
    agent_id: String,
    message: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<String, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("send_message", json!({
            "agentId": agent_id,
            "message": message,
        }))?
    };

    let result = rx.await.map_err(|_| "Channel closed".to_string())??;

    // Extract the response text from the JSON-RPC result
    let response = result
        .get("response")
        .and_then(|v| v.as_str())
        .unwrap_or("No response")
        .to_string();

    Ok(response)
}

#[tauri::command]
pub async fn get_history(
    _agent_id: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<Vec<Message>, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("get_history", json!({}))?
    };

    let result = rx.await.map_err(|_| "Channel closed".to_string())??;

    let messages = result
        .get("messages")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .map(|m| Message {
                    id: m.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    role: m.get("role").and_then(|v| v.as_str()).unwrap_or("assistant").to_string(),
                    content: m.get("content").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    timestamp: m.get("timestamp").and_then(|v| v.as_u64()).unwrap_or(0),
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(messages)
}
