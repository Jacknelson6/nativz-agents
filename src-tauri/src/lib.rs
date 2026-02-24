mod commands;
mod sidecar;

use commands::agents::list_agents;
use commands::chat::{delete_conversation, get_cost_stats, get_history, get_memories, get_usage_stats, get_working_memory, list_conversations, list_providers, load_conversation, send_message, set_provider};
use commands::settings::{get_settings, save_settings};
use sidecar::SidecarManager;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Resolve project root — works both in dev and production (.app)
    // CARGO_MANIFEST_DIR is baked at compile time, so it always points to the original source
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

    eprintln!("[lib] Project root: {:?}", project_root);
    eprintln!("[lib] Runtime path: {}", runtime_path);
    eprintln!("[lib] Runtime exists: {}", std::path::Path::new(&runtime_path).exists());

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
                // Try resource dir first (production DMG), fall back to dev path
                let resource_base = app.path().resource_dir().ok();
                let agents_dir = resource_base.as_ref()
                    .map(|d| d.join("_up_").join("agents"))
                    .filter(|d| d.exists())
                    .or_else(|| resource_base.as_ref()
                        .map(|d| d.join("agents"))
                        .filter(|d| d.exists()))
                    .unwrap_or_else(|| {
                        std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                            .parent()
                            .unwrap()
                            .join("agents")
                    })
                    .to_string_lossy()
                    .to_string();
                let mut init_params = serde_json::json!({
                    "agentsDir": agents_dir
                });
                if !settings.api_key.is_empty() {
                    init_params["apiKey"] = serde_json::json!(settings.api_key);
                }
                // Wait for sidecar to be ready
                std::thread::sleep(std::time::Duration::from_millis(500));
                eprintln!("[lib] Sending initialize with agentsDir: {}", agents_dir);
                if let Err(e) = mgr.send_request("initialize", init_params.clone()) {
                    eprintln!("[lib] Failed to send initialize: {}", e);
                } else {
                    eprintln!("[lib] Initialize sent successfully");
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
            list_conversations,
            load_conversation,
            set_provider,
            list_providers,
            get_usage_stats,
            delete_conversation,
            get_memories,
            get_working_memory,
            get_cost_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
