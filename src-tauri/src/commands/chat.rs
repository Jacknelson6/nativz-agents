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
    app: tauri::AppHandle,
) -> Result<String, String> {
    eprintln!("[chat] send_message called: agent={}, msg={}", agent_id, &message[..message.len().min(50)]);
    
    // Ensure sidecar has current API keys
    let settings = crate::commands::settings::get_settings(app);
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        
        // Push keys if they exist, to ensure runtime has them
        if !settings.api_keys.is_empty() {
             let _ = mgr.send_request("set_api_keys", json!({ "apiKeys": settings.api_keys }));
        }

        mgr.send_request("send_message", json!({
            "agentId": agent_id,
            "message": message,
        })).map_err(|e| {
            eprintln!("[chat] send_request failed: {}", e);
            e
        })?
    };

    eprintln!("[chat] Waiting for response...");
    let result = rx.await.map_err(|e| {
        eprintln!("[chat] Channel error: {}", e);
        "Channel closed - sidecar may have crashed".to_string()
    })?.map_err(|e| {
        eprintln!("[chat] Sidecar error: {}", e);
        e
    })?;

    eprintln!("[chat] Got result: {:?}", &format!("{}", result)[..100.min(format!("{}", result).len())]);

    // Check if the result contains an error field
    if let Some(error) = result.get("error").and_then(|v| v.as_str()) {
        eprintln!("[chat] Result contains error: {}", error);
        return Err(error.to_string());
    }

    let response = result
        .get("response")
        .and_then(|v| v.as_str())
        .unwrap_or_else(|| {
            eprintln!("[chat] No 'response' key in result, returning raw result");
            "No response from agent"
        })
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
#[serde(rename_all = "camelCase")]
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

#[tauri::command]
pub async fn list_providers(
    agent_id: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<serde_json::Value, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("list_providers", json!({
            "agentId": agent_id,
        }))?
    };

    let result = rx.await.map_err(|_| "Channel closed".to_string())??;

    // Pass through the full response including the providers array
    Ok(result)
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

#[tauri::command]
pub async fn delete_conversation(
    conversation_id: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<(), String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("delete_conversation", json!({
            "conversationId": conversation_id,
        }))?
    };

    let _ = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(())
}

#[tauri::command]
pub async fn rename_conversation(
    conversation_id: String,
    title: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<(), String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("rename_conversation", json!({
            "conversationId": conversation_id,
            "title": title,
        }))?
    };
    let _ = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(())
}

#[tauri::command]
pub async fn get_memories(
    agent_id: String,
    entity_id: Option<String>,
    entity_type: Option<String>,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<serde_json::Value, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        let eid = entity_id.unwrap_or_default();
        let mut params = serde_json::Map::new();
        params.insert("agentId".to_string(), json!(agent_id));
        if !eid.is_empty() {
            params.insert("entityId".to_string(), json!(eid));
            params.insert("entityType".to_string(), json!(entity_type.unwrap_or_else(|| "user".to_string())));
        }
        mgr.send_request("get_memories", serde_json::Value::Object(params))?
    };

    let result = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(result.get("memories").cloned().unwrap_or(serde_json::Value::Array(vec![])))
}

#[tauri::command]
pub async fn get_working_memory(
    agent_id: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<serde_json::Value, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("get_working_memory", json!({
            "agentId": agent_id,
        }))?
    };

    let result = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(result.get("entries").cloned().unwrap_or(serde_json::Value::Object(serde_json::Map::new())))
}

#[tauri::command]
pub async fn get_cost_stats(
    agent_id: Option<String>,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<serde_json::Value, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        let mut params = serde_json::Map::new();
        if let Some(id) = agent_id {
            params.insert("agentId".to_string(), serde_json::Value::String(id));
        }
        mgr.send_request("get_cost_stats", serde_json::Value::Object(params))?
    };

    let result = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(result)
}

#[tauri::command]
pub async fn update_memory(
    agent_id: String,
    memory_id: String,
    content: String,
    confidence: Option<f64>,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<(), String> {
    let mut params = serde_json::Map::new();
    params.insert("agentId".to_string(), json!(agent_id));
    params.insert("memoryId".to_string(), json!(memory_id));
    params.insert("content".to_string(), json!(content));
    if let Some(c) = confidence {
        params.insert("confidence".to_string(), json!(c));
    }
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("update_memory", serde_json::Value::Object(params))?
    };
    let _ = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(())
}

#[tauri::command]
pub async fn delete_memory(
    agent_id: String,
    memory_id: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<(), String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("delete_memory", json!({
            "agentId": agent_id,
            "memoryId": memory_id,
        }))?
    };
    let _ = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(())
}

#[tauri::command]
pub async fn get_system_prompt(
    agent_id: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<serde_json::Value, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("get_system_prompt", json!({
            "agentId": agent_id,
        }))?
    };
    let result = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(result)
}

#[tauri::command]
pub async fn set_system_prompt(
    agent_id: String,
    prompt: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<(), String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("set_system_prompt", json!({
            "agentId": agent_id,
            "prompt": prompt,
        }))?
    };
    let _ = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(())
}

#[tauri::command]
pub async fn ping_sidecar(
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<serde_json::Value, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("ping", json!({}))?
    };
    let result = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(result)
}

#[tauri::command]
pub async fn list_knowledge_files(
    agent_id: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<serde_json::Value, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("list_knowledge_files", json!({
            "agentId": agent_id,
        }))?
    };
    let result = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(result.get("files").cloned().unwrap_or(serde_json::Value::Array(vec![])))
}

#[tauri::command]
pub async fn read_knowledge_file(
    agent_id: String,
    file_path: String,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<serde_json::Value, String> {
    let rx = {
        let mut mgr = sidecar.lock().map_err(|e| e.to_string())?;
        mgr.send_request("read_knowledge_file", json!({
            "agentId": agent_id,
            "filePath": file_path,
        }))?
    };
    let result = rx.await.map_err(|_| "Channel closed".to_string())??;
    Ok(result)
}
