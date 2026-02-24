mod commands;
mod sidecar;

use commands::agents::list_agents;
use commands::chat::{get_history, send_message};
use commands::settings::{get_settings, save_settings};
use sidecar::SidecarManager;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // In dev mode, resolve agent-runtime relative to the Cargo manifest dir
    // The src-tauri dir is at <project>/src-tauri, so parent is <project>
    let project_root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .to_path_buf();
    let runtime_path = project_root
        .join("agent-runtime")
        .join("src")
        .join("index.ts")
        .to_string_lossy()
        .to_string();

    let manager = SidecarManager::new(runtime_path);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(manager))
        .setup(|app| {
            // Start the sidecar on app launch
            let state = app.state::<Mutex<SidecarManager>>();
            let mut mgr = state.lock().unwrap();
            if let Err(e) = mgr.start(app.handle().clone()) {
                eprintln!("Failed to start sidecar: {}", e);
            } else {
                // Read API key from settings
                let settings = commands::settings::get_settings(app.handle().clone());
                let agents_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                    .parent()
                    .unwrap()
                    .join("agents")
                    .to_string_lossy()
                    .to_string();
                let mut init_params = serde_json::json!({
                    "agentsDir": agents_dir
                });
                if !settings.api_key.is_empty() {
                    init_params["apiKey"] = serde_json::json!(settings.api_key);
                }
                if let Err(e) = mgr.send_request("initialize", init_params) {
                    eprintln!("Failed to send initialize: {}", e);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            list_agents,
            send_message,
            get_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
