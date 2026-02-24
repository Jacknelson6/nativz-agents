use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Clone)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub category: String,
}

fn agents_dir_dev() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("agents")
}

#[tauri::command]
pub fn list_agents(app: tauri::AppHandle) -> Vec<Agent> {
    let resource_base = app.path().resource_dir().ok();
    let dir = resource_base.as_ref()
        .map(|d| d.join("_up_").join("agents"))
        .filter(|d| d.exists())
        .or_else(|| resource_base.as_ref()
            .map(|d| d.join("agents"))
            .filter(|d| d.exists()))
        .unwrap_or_else(agents_dir_dev);
    let mut agents = Vec::new();

    let entries = match fs::read_dir(&dir) {
        Ok(e) => e,
        Err(_) => return fallback_agents(),
    };

    for entry in entries.flatten() {
        let manifest_path = entry.path().join("manifest.json");
        if manifest_path.exists() {
            if let Ok(data) = fs::read_to_string(&manifest_path) {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&data) {
                    agents.push(Agent {
                        id: val.get("id").and_then(|v| v.as_str()).unwrap_or("unknown").to_string(),
                        name: val.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string(),
                        description: val.get("description").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                        icon: val.get("icon").and_then(|v| v.as_str()).unwrap_or("🤖").to_string(),
                        category: val.get("category").and_then(|v| v.as_str()).unwrap_or("general").to_string(),
                    });
                }
            }
        }
    }

    if agents.is_empty() {
        return fallback_agents();
    }

    agents.sort_by(|a, b| a.name.cmp(&b.name));
    agents
}

fn fallback_agents() -> Vec<Agent> {
    vec![
        Agent { id: "content-editor".into(), name: "Content Editor".into(), description: "Edit and refine content for social media, blogs, and marketing materials.".into(), icon: "✏️".into(), category: "content".into() },
        Agent { id: "seo".into(), name: "SEO Strategist".into(), description: "Optimize content for search engines with keyword research and technical SEO.".into(), icon: "🔍".into(), category: "marketing".into() },
        Agent { id: "ads".into(), name: "Paid Media".into(), description: "Create and manage ad campaigns across Google, Meta, and TikTok.".into(), icon: "📢".into(), category: "marketing".into() },
        Agent { id: "account-manager".into(), name: "Account Manager".into(), description: "Track client deliverables, deadlines, and communication.".into(), icon: "📋".into(), category: "operations".into() },
        Agent { id: "diy".into(), name: "DIY Assistant".into(), description: "General-purpose agent for custom tasks and workflows.".into(), icon: "🛠️".into(), category: "utility".into() },
    ]
}
