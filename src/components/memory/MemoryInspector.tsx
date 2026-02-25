import { useState, useEffect, useCallback } from 'react';
import { X, Search, Trash2, Edit3, Check, Brain } from 'lucide-react';
import { getMemories, updateMemory, deleteMemory } from '../../lib/tauri';
import { emitNotification } from '../layout/NotificationCenter';
import { useAgentStore } from '../../stores/agentStore';
import type { StructuredMemory, MemoryCategory, MemoryEntityType } from '../../lib/types';

const CATEGORIES: MemoryCategory[] = [
  'preference',
  'decision',
  'fact',
  'relationship',
  'goal',
  'feedback',
  'context',
];

const ENTITY_TYPES: MemoryEntityType[] = ['client', 'brand', 'user'];

interface Props {
  onClose: () => void;
}

export default function MemoryInspector({ onClose }: Props) {
  const [memories, setMemories] = useState<StructuredMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEntity, setFilterEntity] = useState<MemoryEntityType | ''>('');
  const [filterCategory, setFilterCategory] = useState<MemoryCategory | ''>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { selectedAgent } = useAgentStore();

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    try {
      const agentId = selectedAgent?.id ?? '';
      // Fetch ALL memories for the agent (no entityId filter)
      const result = await getMemories(agentId);
      // Client-side filtering for entity type, category, and search
      let filtered = result;
      if (filterEntity) {
        filtered = filtered.filter((m) => m.entityType === filterEntity);
      }
      if (filterCategory) {
        filtered = filtered.filter((m) => m.category === filterCategory);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((m) => m.content.toLowerCase().includes(q));
      }
      setMemories(filtered);
    } catch {
      setMemories([]);
    }
    setLoading(false);
  }, [selectedAgent, filterEntity, filterCategory, search]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const entityCounts = memories.reduce<Record<string, number>>((acc, m) => {
    acc[m.entityId] = (acc[m.entityId] || 0) + 1;
    return acc;
  }, {});

  const handleEdit = (memory: StructuredMemory) => {
    setEditingId(memory.id);
    setEditContent(memory.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !selectedAgent) return;
    try {
      await updateMemory(selectedAgent.id, editingId, editContent);
      setMemories((prev) =>
        prev.map((m) => (m.id === editingId ? { ...m, content: editContent } : m))
      );
      emitNotification({ type: 'success', title: 'Memory Updated', message: 'The memory has been updated successfully.' });
    } catch (err) {
      emitNotification({ type: 'error', title: 'Update Failed', message: err instanceof Error ? err.message : 'Unknown error' });
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!selectedAgent) return;
    try {
      await deleteMemory(selectedAgent.id, id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
      emitNotification({ type: 'success', title: 'Memory Deleted', message: 'The memory has been removed.' });
    } catch (err) {
      emitNotification({ type: 'error', title: 'Delete Failed', message: err instanceof Error ? err.message : 'Unknown error' });
    }
    setDeleteConfirm(null);
  };

  const confidenceBar = (confidence: number) => (
    <div className="w-12 h-1 bg-muted/50 rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full"
        style={{ width: `${confidence * 100}%` }}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-background/70" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-card border-l border-border h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-primary" />
            <h2 className="font-semibold">Memory Inspector</h2>
            <span className="text-xs text-muted-foreground ml-2">{memories.length} memories</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border space-y-3 shrink-0">
          <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value as MemoryEntityType | '')}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none"
            >
              <option value="">All Entities</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as MemoryCategory | '')}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {Object.entries(entityCounts).length > 0 && (
              <div className="flex items-center gap-2 ml-auto text-[10px] text-muted">
                {Object.entries(entityCounts)
                  .slice(0, 5)
                  .map(([entity, count]) => (
                    <span key={entity} className="bg-muted/30 px-2 py-1 rounded">
                      {entity}: {count}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Memory List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading memories...</p>
          ) : memories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No memories found</p>
          ) : (
            memories.map((memory) => (
              <div
                key={memory.id}
                className="bg-background border border-border rounded-xl p-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider font-medium text-primary">
                        {memory.entityType}
                      </span>
                      <span className="text-[10px] text-muted">·</span>
                      <span className="text-[10px] text-muted">{memory.entityId}</span>
                      <span className="text-[10px] text-muted">·</span>
                      <span className="text-[10px] bg-muted/30 px-1.5 py-0.5 rounded text-muted">
                        {memory.category}
                      </span>
                      <div className="ml-auto flex items-center gap-1.5">
                        {confidenceBar(memory.confidence)}
                      </div>
                    </div>
                    {editingId === memory.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 bg-card border border-border rounded-lg px-2 py-1 text-sm outline-none focus:border-primary/50"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-emerald-400 hover:bg-success/10 rounded"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{memory.content}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {new Date(memory.updatedAt ?? memory.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleEdit(memory)}
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded"
                    >
                      <Edit3 size={12} />
                    </button>
                    {deleteConfirm === memory.id ? (
                      <button
                        onClick={() => handleDelete(memory.id)}
                        className="p-1 text-error hover:bg-error/10 rounded text-[10px] font-medium"
                      >
                        confirm
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(memory.id)}
                        className="p-1 text-muted-foreground hover:text-error hover:bg-error/10 rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
