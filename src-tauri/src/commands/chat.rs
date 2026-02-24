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

// ─── New v2 IPC commands ───

#[derive(Debug, Serialize, Clone)]
pub struct ConversationSummary {
    pub id: String,
    pub agent_id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub message_count: u64,
}

#[tauri::command]
pub async fn list_conversations(
    agent_id: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<Vec<ConversationSummary>, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("list_conversations", json!({
            "agentId": agent_id,
        }))?
    };

    let result = rx.await.map_err(|_| "Channel closed".to_string())??;

    let conversations = result
        .get("conversations")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .map(|c| ConversationSummary {
                    id: c.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    agent_id: c.get("agentId").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    title: c.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    created_at: c.get("createdAt").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    updated_at: c.get("updatedAt").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    message_count: c.get("messageCount").and_then(|v| v.as_u64()).unwrap_or(0),
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(conversations)
}

#[tauri::command]
pub async fn load_conversation(
    conversation_id: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<serde_json::Value, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("load_conversation", json!({
            "conversationId": conversation_id,
        }))?
    };

    let result = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(result.get("conversation").cloned().unwrap_or(serde_json::Value::Null))
}

#[tauri::command]
pub async fn set_provider(
    agent_id: String,
    provider_id: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<String, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("set_provider", json!({
            "agentId": agent_id,
            "providerId": provider_id,
        }))?
    };

    let result = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(result.get("status").and_then(|v| v.as_str()).unwrap_or("ok").to_string())
}

#[derive(Debug, Serialize, Clone)]
pub struct ProviderInfo {
    pub name: String,
    pub display_name: String,
    pub available: bool,
}

#[tauri::command]
pub async fn list_providers(
    agent_id: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<Vec<ProviderInfo>, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("list_providers", json!({
            "agentId": agent_id,
        }))?
    };

    let result = rx.await.map_err(|_| "Channel closed".to_string())??;

    let providers = result
        .get("providers")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .map(|p| ProviderInfo {
                    name: p.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    display_name: p.get("displayName").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    available: p.get("available").and_then(|v| v.as_bool()).unwrap_or(false),
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(providers)
}

#[tauri::command]
pub async fn get_usage_stats(
    agent_id: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<serde_json::Value, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("get_usage_stats", json!({
            "agentId": agent_id,
        }))?
    };

    let result = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(result)
}
