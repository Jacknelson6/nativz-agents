import { useState, useCallback } from 'react';
import {
  Search,
  FileText,
  Upload,
  Trash2,
  ChevronRight,
  Database,
  Loader2,
  X,
  File,
  CheckCircle,
} from 'lucide-react';

interface KnowledgeDocument {
  id: string;
  name: string;
  source: string;
  chunkCount: number;
  indexedAt: number;
  status: 'indexed' | 'indexing' | 'error';
  preview?: string;
  sizeBytes: number;
}

interface KnowledgeBrowserProps {
  agentId: string;
}

// Placeholder data — in production, this comes from Tauri invoke calls
const MOCK_DOCS: KnowledgeDocument[] = [];

export default function KnowledgeBrowser({ agentId }: KnowledgeBrowserProps) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(MOCK_DOCS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const filteredDocs = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalChunks = documents.reduce((sum, d) => sum + d.chunkCount, 0);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      setUploading(true);

      const files = Array.from(e.dataTransfer.files);
      const newDocs: KnowledgeDocument[] = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        source: file.name,
        chunkCount: 0,
        indexedAt: Date.now(),
        status: 'indexing' as const,
        sizeBytes: file.size,
      }));

      setDocuments((prev) => [...prev, ...newDocs]);

      // Simulate indexing completion
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setDocuments((prev) =>
        prev.map((doc) =>
          newDocs.some((nd) => nd.id === doc.id)
            ? { ...doc, status: 'indexed' as const, chunkCount: Math.ceil(doc.sizeBytes / 1000) }
            : doc
        )
      );

      setUploading(false);
    },
    []
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDelete = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (selectedDoc?.id === docId) setSelectedDoc(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusIcon = (status: KnowledgeDocument['status']) => {
    switch (status) {
      case 'indexed':
        return <CheckCircle size={12} className="text-green-400" />;
      case 'indexing':
        return <Loader2 size={12} className="animate-spin text-yellow-400" />;
      case 'error':
        return <X size={12} className="text-red-400" />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Document List */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} />
            <h3 className="font-semibold text-sm">Knowledge Base</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span>{documents.length} documents</span>
            <span>·</span>
            <span>{totalChunks} chunks</span>
            <span>·</span>
            <span>{agentId}</span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={(e) => void handleDrop(e)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mx-4 mt-3 border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border/50 hover:border-border'
          }`}
        >
          <Upload size={18} className="mx-auto mb-1 text-muted" />
          <p className="text-xs text-muted">
            {uploading ? 'Indexing...' : 'Drop files to add to knowledge base'}
          </p>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 mt-2">
          {filteredDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className={`w-full text-left p-3 rounded-lg transition-colors group flex items-start gap-2.5 ${
                selectedDoc?.id === doc.id
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted/30 border border-transparent'
              }`}
            >
              <File size={14} className="shrink-0 mt-0.5 text-muted" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{doc.name}</span>
                  {statusIcon(doc.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{doc.chunkCount} chunks</span>
                  <span>·</span>
                  <span>{formatSize(doc.sizeBytes)}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(doc.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 hover:text-red-400 transition-all shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </button>
          ))}

          {filteredDocs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              {searchQuery ? 'No documents match your search.' : 'No documents indexed yet.'}
            </div>
          )}
        </div>
      </div>

      {/* Document Preview */}
      <div className="flex-1 flex flex-col">
        {selectedDoc ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <h3 className="font-medium text-sm">{selectedDoc.name}</h3>
                {statusIcon(selectedDoc.status)}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted">
                <span>{selectedDoc.chunkCount} chunks</span>
                <span>{formatSize(selectedDoc.sizeBytes)}</span>
                <span>Indexed {formatDate(selectedDoc.indexedAt)}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {selectedDoc.preview ? (
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {selectedDoc.preview}
                </pre>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <FileText size={32} className="mx-auto mb-3 opacity-30" />
                  Preview not available for this document.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted">
            <div className="text-center">
              <ChevronRight size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a document to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
