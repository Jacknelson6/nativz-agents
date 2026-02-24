mod commands;

use commands::settings::{get_settings, save_settings};
use commands::agents::list_agents;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_settings, save_settings, list_agents])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
