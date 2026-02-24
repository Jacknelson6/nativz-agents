import { useState, useCallback } from 'react';
import { Bot, Save, Upload, Eye, X, Wrench, Brain, Sparkles } from 'lucide-react';

interface AgentBuilderProps {
  onClose: () => void;
  onSave: (config: AgentConfig) => void;
}

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  model: { primary: string; fast: string };
  skills: string[];
  knowledgeFiles: string[];
}

const AVAILABLE_SKILLS = [
  { id: 'web-search', label: 'Web Search', description: 'Search the internet' },
  { id: 'web-scrape', label: 'Web Scraping', description: 'Extract content from URLs' },
  { id: 'file-read', label: 'File Read', description: 'Read local files' },
  { id: 'file-write', label: 'File Write', description: 'Write/create files' },
  { id: 'code-exec', label: 'Code Execution', description: 'Run code snippets' },
  { id: 'image-gen', label: 'Image Generation', description: 'Generate images via AI' },
  { id: 'data-analysis', label: 'Data Analysis', description: 'Analyze datasets' },
  { id: 'email-send', label: 'Email', description: 'Send emails' },
  { id: 'calendar', label: 'Calendar', description: 'Calendar management' },
  { id: 'browser', label: 'Browser Control', description: 'Automate browser actions' },
];

const MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { id: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
  { id: 'claude-haiku-4-5-20241022', label: 'Claude Haiku 4.5' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
];

const ICONS = ['🤖', '🧠', '📊', '✍️', '🎯', '🔍', '💡', '🚀', '📝', '🎨'];

export default function AgentBuilder({ onClose, onSave }: AgentBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🤖');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant specialized in...');
  const [primaryModel, setPrimaryModel] = useState('claude-sonnet-4-20250514');
  const [fastModel, setFastModel] = useState('claude-haiku-4-5-20241022');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [knowledgeFiles, setKnowledgeFiles] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'skills' | 'model' | 'knowledge'>('prompt');

  const toggleSkill = useCallback((id: string) => {
    setSelectedSkills((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }, []);

  const handleFileUpload = useCallback(() => {
    // In a real Tauri app, this would open the native file dialog via Tauri API
    const mockFile = `knowledge-${Date.now()}.md`;
    setKnowledgeFiles((prev) => [...prev, mockFile]);
  }, []);

  const removeFile = useCallback((file: string) => {
    setKnowledgeFiles((prev) => prev.filter((f) => f !== file));
  }, []);

  const handleSave = useCallback(() => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom-agent';
    onSave({
      id,
      name: name || 'Custom Agent',
      description,
      icon,
      systemPrompt,
      model: { primary: primaryModel, fast: fastModel },
      skills: selectedSkills,
      knowledgeFiles,
    });
  }, [name, description, icon, systemPrompt, primaryModel, fastModel, selectedSkills, knowledgeFiles, onSave]);

  const tabs = [
    { key: 'prompt' as const, label: 'System Prompt', icon: Brain },
    { key: 'skills' as const, label: 'Skills', icon: Wrench },
    { key: 'model' as const, label: 'Model', icon: Sparkles },
    { key: 'knowledge' as const, label: 'Knowledge', icon: Upload },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-text">Create Custom Agent</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-text transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Agent Identity */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="relative">
              <button className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center text-2xl hover:border-accent transition group">
                {icon}
              </button>
              <div className="absolute top-full left-0 mt-1 hidden group-focus-within:flex flex-wrap gap-1 bg-surface border border-border rounded-lg p-2 w-40 z-10">
                {ICONS.map((i) => (
                  <button key={i} onClick={() => setIcon(i)} className="w-8 h-8 rounded hover:bg-border flex items-center justify-center">
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder="Agent Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:border-accent text-sm"
              />
              <input
                type="text"
                placeholder="Short description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:border-accent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'prompt' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text">System Prompt</label>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
              {showPreview ? (
                <div className="bg-surface border border-border rounded-lg p-4 text-sm text-text/80 whitespace-pre-wrap min-h-[300px]">
                  {systemPrompt}
                </div>
              ) : (
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={14}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-3 text-text text-sm font-mono placeholder:text-muted focus:outline-none focus:border-accent resize-none"
                  placeholder="Define your agent's personality, capabilities, and behavior..."
                />
              )}
              <p className="text-xs text-muted">{systemPrompt.length} characters</p>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_SKILLS.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                    selectedSkills.includes(skill.id)
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-surface hover:border-accent/50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      selectedSkills.includes(skill.id) ? 'border-accent bg-accent' : 'border-border'
                    }`}
                  >
                    {selectedSkills.includes(skill.id) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">{skill.label}</div>
                    <div className="text-xs text-muted">{skill.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'model' && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-text block mb-2">Primary Model</label>
                <p className="text-xs text-muted mb-3">Used for main reasoning and complex tasks.</p>
                <div className="space-y-2">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPrimaryModel(m.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                        primaryModel === m.id ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${primaryModel === m.id ? 'border-accent' : 'border-border'}`}>
                        {primaryModel === m.id && <div className="w-2 h-2 rounded-full bg-accent" />}
                      </div>
                      <span className="text-sm text-text">{m.label}</span>
                      <span className="text-xs text-muted ml-auto font-mono">{m.id}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-2">Fast Model</label>
                <p className="text-xs text-muted mb-3">Used for quick classifications, summaries, and tool selection.</p>
                <select
                  value={fastModel}
                  onChange={(e) => setFastModel(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent"
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-4">
              <p className="text-sm text-muted">Upload files your agent can reference during conversations.</p>
              <button
                onClick={handleFileUpload}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-accent/50 transition group"
              >
                <Upload className="w-8 h-8 text-muted group-hover:text-accent transition" />
                <span className="text-sm text-muted group-hover:text-text transition">
                  Click to upload or drag & drop
                </span>
                <span className="text-xs text-muted">.txt, .md, .pdf, .csv, .json</span>
              </button>
              {knowledgeFiles.length > 0 && (
                <div className="space-y-2">
                  {knowledgeFiles.map((file) => (
                    <div key={file} className="flex items-center justify-between bg-surface border border-border rounded-lg px-3 py-2">
                      <span className="text-sm text-text truncate">{file}</span>
                      <button onClick={() => removeFile(file)} className="text-muted hover:text-error transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="text-xs text-muted">
            {selectedSkills.length} skills · {knowledgeFiles.length} files
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-text transition">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Create Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
