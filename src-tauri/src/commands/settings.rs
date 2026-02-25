use crate::sidecar::SidecarManager;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub api_key: String,                   // Legacy/Anthropic
    pub api_keys: HashMap<String, String>, // Multi-provider
    pub role: String,
    pub theme: String,
    pub onboarding_complete: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            api_keys: HashMap::new(),
            role: "admin".into(),
            theme: "dark".into(),
            onboarding_complete: false,
        }
    }
}

fn settings_path(app: &tauri::AppHandle) -> PathBuf {
    let dir = app.path().app_data_dir().unwrap();
    fs::create_dir_all(&dir).ok();
    dir.join("settings.json")
}

#[tauri::command]
pub fn get_settings(app: tauri::AppHandle) -> AppSettings {
    let path = settings_path(&app);
    if path.exists() {
        let data = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        AppSettings::default()
    }
}

#[tauri::command]
pub fn save_settings(
    app: tauri::AppHandle,
    settings: AppSettings,
    sidecar: tauri::State<'_, Mutex<SidecarManager>>,
) -> Result<(), String> {
    let path = settings_path(&app);
    let data = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())?;

    // Push API keys to sidecar
    if let Ok(mut mgr) = sidecar.lock() {
        let _ = mgr.send_request(
            "set_api_keys",
            serde_json::json!({
                "apiKeys": settings.api_keys
            }),
        );

        // Also support legacy set_api_key for backward compat if needed
        if !settings.api_key.is_empty() {
            let _ = mgr.send_request(
                "set_api_key",
                serde_json::json!({
                    "apiKey": settings.api_key
                }),
            );
        }
    }

    Ok(())
}
