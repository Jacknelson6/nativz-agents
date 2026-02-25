mod commands;
mod sidecar;

use commands::agents::list_agents;
use commands::chat::{delete_conversation, delete_memory, get_cost_stats, get_history, get_memories, get_system_prompt, get_usage_stats, get_working_memory, list_conversations, list_knowledge_files, list_providers, load_conversation, ping_sidecar, read_knowledge_file, rename_conversation, send_message, set_provider, set_system_prompt, update_memory};
use commands::settings::{get_settings, save_settings};
use sidecar::SidecarManager;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Placeholder — real path is resolved in setup() where resource_dir is available
    let manager = SidecarManager::new(String::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(manager))
        .setup(|app| {
            let dev_root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .parent()
                .unwrap()
                .to_path_buf();
            let resource_base = app.path().resource_dir().ok();

            // Dev mode: run TypeScript source with `npx tsx`
            let dev_runtime_path = dev_root
                .join("agent-runtime")
                .join("src")
                .join("index.ts");

            // Production: run esbuild bundle with `node`
            // Try multiple resource paths (Tauri may add _up_ prefix)
            let prod_bundle = resource_base.as_ref()
                .map(|d| d.join("agent-runtime").join("dist").join("index.mjs"))
                .filter(|p| p.exists())
                .or_else(|| resource_base.as_ref()
                    .map(|d| d.join("_up_").join("agent-runtime").join("dist").join("index.mjs"))
                    .filter(|p| p.exists()));

            // Also check for unbundled TS source in resources as fallback
            let prod_ts = resource_base.as_ref()
                .map(|d| d.join("agent-runtime").join("src").join("index.ts"))
                .filter(|p| p.exists())
                .or_else(|| resource_base.as_ref()
                    .map(|d| d.join("_up_").join("agent-runtime").join("src").join("index.ts"))
                    .filter(|p| p.exists()));

            // Determine mode: dev (tsx), prod-bundled (node), or prod-ts (tsx)
            let (runtime_path, use_node) = if dev_runtime_path.exists() {
                // Dev mode: use tsx to run TypeScript source
                (dev_runtime_path, false)
            } else if let Some(bundle_path) = prod_bundle {
                // Production with esbuild bundle: use node directly
                (bundle_path, true)
            } else if let Some(ts_path) = prod_ts {
                // Production with TS source: use tsx (fallback)
                (ts_path, false)
            } else {
                // Nothing found — will fail on start, but log the path for debugging
                eprintln!("[lib] WARNING: No runtime found in dev or resources!");
                (dev_runtime_path, false)
            };

            eprintln!("[lib] Runtime path: {}", runtime_path.display());
            eprintln!("[lib] Runtime exists: {}", runtime_path.exists());
            eprintln!("[lib] Use node (bundled): {}", use_node);

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

            // Configure and start sidecar
            let state = app.state::<Mutex<SidecarManager>>();
            let mut mgr = state.lock().unwrap();
            mgr.set_runtime_path(runtime_path.to_string_lossy().to_string());
            mgr.set_use_node(use_node);

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
                if !settings.api_keys.is_empty() {
                    init_params["apiKeys"] = serde_json::json!(settings.api_keys);
                }
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
            rename_conversation,
            get_memories,
            get_working_memory,
            get_cost_stats,
            update_memory,
            delete_memory,
            list_knowledge_files,
            read_knowledge_file,
            get_system_prompt,
            set_system_prompt,
            ping_sidecar,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
