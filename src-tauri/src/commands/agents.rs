use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub category: String,
}

#[tauri::command]
pub fn list_agents() -> Vec<Agent> {
    vec![
        Agent { id: "content-editor".into(), name: "Content Editor".into(), description: "Edit and refine content for social media, blogs, and marketing materials.".into(), icon: "✏️".into(), category: "content".into() },
        Agent { id: "seo".into(), name: "SEO Strategist".into(), description: "Optimize content for search engines with keyword research and technical SEO.".into(), icon: "🔍".into(), category: "marketing".into() },
        Agent { id: "ads".into(), name: "Paid Media".into(), description: "Create and manage ad campaigns across Google, Meta, and TikTok.".into(), icon: "📢".into(), category: "marketing".into() },
        Agent { id: "account-manager".into(), name: "Account Manager".into(), description: "Track client deliverables, deadlines, and communication.".into(), icon: "📋".into(), category: "operations".into() },
        Agent { id: "diy".into(), name: "DIY Assistant".into(), description: "General-purpose agent for custom tasks and workflows.".into(), icon: "🛠️".into(), category: "utility".into() },
    ]
}
