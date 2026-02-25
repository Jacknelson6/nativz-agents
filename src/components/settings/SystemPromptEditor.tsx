import { useState, useEffect } from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { getSystemPrompt, setSystemPrompt } from '../../lib/tauri';
import { emitNotification } from '../layout/NotificationCenter';
import { AlertTriangle, RotateCcw, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SystemPromptEditor() {
  const { selectedAgent } = useAgentStore();
  const [prompt, setPrompt] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedAgent) return;
    setLoading(true);
    getSystemPrompt(selectedAgent.id)
      .then((result) => {
        setPrompt(result.prompt);
        setDefaultPrompt(result.defaultPrompt);
        setIsCustom(result.isCustom);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedAgent?.id]);

  const handleSave = async () => {
    if (!selectedAgent) return;
    setSaving(true);
    try {
      await setSystemPrompt(selectedAgent.id, prompt);
      setIsCustom(true);
      emitNotification({ type: 'success', title: 'Prompt Saved', message: 'System prompt updated successfully.' });
    } catch {
      emitNotification({ type: 'error', title: 'Save Failed', message: 'Could not save system prompt.' });
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if (!selectedAgent) return;
    setPrompt(defaultPrompt);
    setSaving(true);
    try {
      await setSystemPrompt(selectedAgent.id, defaultPrompt);
      setIsCustom(false);
      emitNotification({ type: 'success', title: 'Prompt Reset', message: 'System prompt restored to default.' });
    } catch {
      emitNotification({ type: 'error', title: 'Reset Failed', message: 'Could not reset system prompt.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        <Loader2 size={16} className="animate-spin mr-2" />
        Loading prompt...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">System Prompt</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Customize how the agent behaves and responds.
        </p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-200/80">
          Changing the system prompt may affect agent behavior and quality. Use with caution.
        </p>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={12}
        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm font-mono leading-relaxed outline-none focus:border-primary/50 resize-y min-h-[200px]"
        placeholder="Enter system prompt..."
      />

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Save
        </Button>
        {isCustom && (
          <Button onClick={handleReset} disabled={saving} variant="outline" size="sm" className="gap-1.5">
            <RotateCcw size={12} />
            Reset to Default
          </Button>
        )}
        {isCustom && (
          <span className="text-xs text-amber-400 ml-2">Custom prompt active</span>
        )}
      </div>
    </div>
  );
}
