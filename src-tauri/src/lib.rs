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
    // We pass a placeholder path here; the real path is resolved in setup()
    // where we have access to the app's resource directory for production builds.
    let manager = SidecarManager::new(String::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(manager))
        .setup(|app| {
            // Resolve runtime path: try dev source first, then bundled resources
            let dev_root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .parent()
                .unwrap()
                .to_path_buf();
            let dev_runtime_path = dev_root
                .join("agent-runtime")
                .join("src")
                .join("index.ts");

            let resource_base = app.path().resource_dir().ok();

            // In production .app, resources are under the resource dir
            let prod_runtime_path = resource_base.as_ref()
                .map(|d| d.join("agent-runtime").join("src").join("index.ts"))
                .filter(|p| p.exists());

            let runtime_path = if dev_runtime_path.exists() {
                dev_runtime_path.clone()
            } else if let Some(ref prod_path) = prod_runtime_path {
                prod_path.clone()
            } else {
                // Last resort: try _up_ prefix (Tauri resource bundling)
                resource_base.as_ref()
                    .map(|d| d.join("_up_").join("agent-runtime").join("src").join("index.ts"))
                    .filter(|p| p.exists())
                    .unwrap_or(dev_runtime_path)
            };

            let is_dev = dev_runtime_path.exists() && runtime_path == dev_runtime_path;

            eprintln!("[lib] Runtime path: {}", runtime_path.display());
            eprintln!("[lib] Runtime exists: {}", runtime_path.exists());
            eprintln!("[lib] Is dev mode: {}", is_dev);

            // Resolve agents directory
            let agents_dir = resource_base.as_ref()
                .map(|d| d.join("_up_").join("agents"))
                .filter(|d| d.exists())
                .or_else(|| resource_base.as_ref()
                    .map(|d| d.join("agents"))
                    .filter(|d| d.exists()))
                .unwrap_or_else(|| dev_root.join("agents"))
                .to_string_lossy()
                .to_string();

            // Update the sidecar manager with the resolved path and start it
            let state = app.state::<Mutex<SidecarManager>>();
            let mut mgr = state.lock().unwrap();
            mgr.set_runtime_path(runtime_path.to_string_lossy().to_string());

            if let Err(e) = mgr.start(app.handle().clone()) {
                eprintln!("Failed to start sidecar: {}", e);
            } else {
                let settings = commands::settings::get_settings(app.handle().clone());
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
