import { useState, useCallback, useEffect } from 'react';
import {
  Search,
  FileText,
  Upload,
  Trash2,
  Database,
  Loader2,
  X,
  File,
  CheckCircle,
  BookOpen,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { listKnowledgeFiles, readKnowledgeFile } from '../../lib/tauri';
import { emitNotification } from '../layout/NotificationCenter';

interface KnowledgeDocument {
  id: string;
  name: string;
  source: string;
  chunkCount: number;
  indexedAt: number;
  status: 'indexed' | 'indexing' | 'error';
  preview?: string;
  sizeBytes: number;
  description?: string;
}

interface KnowledgeBrowserProps {
  agentId: string;
}

// SEO agent knowledge files — loaded from the agent manifest
const SEO_KNOWLEDGE_DOCS: KnowledgeDocument[] = [
  {
    id: 'technical-seo',
    name: 'Technical SEO',
    source: 'knowledge/technical-seo.md',
    chunkCount: 17,
    indexedAt: Date.now(),
    status: 'indexed',
    sizeBytes: 16947,
    description: 'Crawlability, indexing, site speed, Core Web Vitals, schema markup, XML sitemaps, robots.txt',
  },
  {
    id: 'on-page-optimization',
    name: 'On-Page Optimization',
    source: 'knowledge/on-page-optimization.md',
    chunkCount: 16,
    indexedAt: Date.now(),
    status: 'indexed',
    sizeBytes: 16190,
    description: 'Title tags, meta descriptions, headings, content optimization, internal linking, image SEO',
  },
  {
    id: 'link-building',
    name: 'Link Building',
    source: 'knowledge/link-building.md',
    chunkCount: 14,
    indexedAt: Date.now(),
    status: 'indexed',
    sizeBytes: 13522,
    description: 'Backlink strategies, outreach, guest posting, broken link building, competitor analysis',
  },
  {
    id: 'content-strategy',
    name: 'Content Strategy',
    source: 'knowledge/content-strategy.md',
    chunkCount: 15,
    indexedAt: Date.now(),
    status: 'indexed',
    sizeBytes: 14576,
    description: 'Content planning, keyword mapping, topic clusters, editorial calendars, E-E-A-T',
  },
  {
    id: 'local-seo',
    name: 'Local SEO',
    source: 'knowledge/local-seo.md',
    chunkCount: 17,
    indexedAt: Date.now(),
    status: 'indexed',
    sizeBytes: 16687,
    description: 'Google Business Profile, local citations, NAP consistency, review management, local keywords',
  },
  {
    id: 'seo-tools-reference',
    name: 'SEO Tools Reference',
    source: 'knowledge/seo-tools-reference.md',
    chunkCount: 16,
    indexedAt: Date.now(),
    status: 'indexed',
    sizeBytes: 16199,
    description: 'Tool comparisons: Ahrefs, SEMrush, Screaming Frog, Google Search Console, PageSpeed Insights',
  },
];

export default function KnowledgeBrowser({ agentId }: KnowledgeBrowserProps) {
  const initialDocs = agentId === 'seo' || agentId === 'global' ? SEO_KNOWLEDGE_DOCS : [];
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(initialDocs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const files = await listKnowledgeFiles(agentId);
        if (files.length > 0) {
          const realDocs: KnowledgeDocument[] = files.map((f) => ({
            id: f.path,
            name: f.name,
            source: `knowledge/${f.path}`,
            chunkCount: Math.ceil(f.sizeBytes / 1000),
            indexedAt: new Date(f.modifiedAt).getTime(),
            status: 'indexed' as const,
            sizeBytes: f.sizeBytes,
            description: '',
          }));
          setDocuments(realDocs);
        }
      } catch {
        // Keep hardcoded fallback
      }
    };
    fetchFiles();
  }, [agentId]);

  useEffect(() => {
    if (!selectedDoc) {
      setFileContent(null);
      return;
    }
    setLoadingContent(true);
    readKnowledgeFile(agentId, selectedDoc.id)
      .then((result) => setFileContent(result.content))
      .catch(() => setFileContent(null))
      .finally(() => setLoadingContent(false));
  }, [selectedDoc, agentId]);

  const filteredDocs = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const totalChunks = documents.reduce((sum, d) => sum + d.chunkCount, 0);
  const totalSize = documents.reduce((sum, d) => sum + d.sizeBytes, 0);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      setUploading(true);

      const files = Array.from(e.dataTransfer.files);
      const newDocs: KnowledgeDocument[] = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        source: file.name,
        chunkCount: 0,
        indexedAt: Date.now(),
        status: 'indexing' as const,
        sizeBytes: file.size,
      }));

      setDocuments((prev) => [...prev, ...newDocs]);

      // Simulate indexing — in production this calls the backend
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setDocuments((prev) =>
        prev.map((doc) =>
          newDocs.some((nd) => nd.id === doc.id)
            ? { ...doc, status: 'indexed' as const, chunkCount: Math.ceil(doc.sizeBytes / 1000) }
            : doc
        )
      );

      setUploading(false);

      emitNotification({
        type: 'success',
        title: 'Knowledge Indexed',
        message: `${files.length} file${files.length > 1 ? 's' : ''} indexed successfully.`,
      });
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

  const statusIcon = (status: KnowledgeDocument['status']) => {
    switch (status) {
      case 'indexed':
        return <CheckCircle size={12} className="text-emerald-400" />;
      case 'indexing':
        return <Loader2 size={12} className="animate-spin text-amber-400" />;
      case 'error':
        return <X size={12} className="text-red-400" />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Document List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border/50 flex flex-col bg-card/30 max-h-[350px] md:max-h-none">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Knowledge Base</h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70 mb-3">
            <span>{documents.length} files</span>
            <span className="text-muted-foreground/30">·</span>
            <span>{totalChunks} chunks</span>
            <span className="text-muted-foreground/30">·</span>
            <span>{formatSize(totalSize)}</span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge..."
              aria-label="Search knowledge files"
              className="w-full bg-background border border-border/60 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={(e) => void handleDrop(e)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mx-4 mt-3 border-2 border-dashed rounded-xl p-3.5 text-center transition-all duration-200 ${
            isDragOver
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-border/40 hover:border-border/70'
          }`}
        >
          <Upload size={16} className="mx-auto mb-1 text-muted-foreground/60" />
          <p className="text-[11px] text-muted-foreground/60">
            {uploading ? 'Indexing...' : 'Drop files to add knowledge'}
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
              <File size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
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
              {!SEO_KNOWLEDGE_DOCS.some((d) => d.id === doc.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </button>
          ))}

          {filteredDocs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              {searchQuery ? 'No documents match your search.' : 'No documents indexed yet.'}
            </div>
          )}
        </div>
      </div>

      {/* Document Detail */}
      <div className="flex-1 flex flex-col">
        {selectedDoc ? (
          <>
            <div className="p-5 border-b border-border/50">
              <div className="flex items-center gap-2.5 mb-2">
                <FileText size={16} className="text-primary" />
                <h3 className="font-semibold text-sm flex-1">{selectedDoc.name}</h3>
                {statusIcon(selectedDoc.status)}
                <button
                  onClick={() => fileContent && navigator.clipboard.writeText(fileContent)}
                  className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  Copy
                </button>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                <span>{selectedDoc.chunkCount} chunks</span>
                <span>{formatSize(selectedDoc.sizeBytes)}</span>
                <span className="font-mono text-[10px] text-muted-foreground/50">{selectedDoc.source}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-muted-foreground" />
                </div>
              ) : fileContent ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{fileContent}</ReactMarkdown>
                </div>
              ) : selectedDoc.description ? (
                <div className="space-y-5 max-w-lg">
                  <div className="bg-muted/20 border border-border/50 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2.5">
                      <BookOpen size={12} />
                      Topics Covered
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80">{selectedDoc.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/15 border border-border/40 rounded-lg p-3.5">
                      <div className="text-[11px] text-muted-foreground/60 mb-1">File Size</div>
                      <div className="text-sm font-semibold">{formatSize(selectedDoc.sizeBytes)}</div>
                    </div>
                    <div className="bg-muted/15 border border-border/40 rounded-lg p-3.5">
                      <div className="text-[11px] text-muted-foreground/60 mb-1">Chunks</div>
                      <div className="text-sm font-semibold">{selectedDoc.chunkCount}</div>
                    </div>
                    <div className="bg-muted/15 border border-border/40 rounded-lg p-3.5">
                      <div className="text-[11px] text-muted-foreground/60 mb-1">Source</div>
                      <div className="text-xs font-mono truncate text-foreground/70">{selectedDoc.source}</div>
                    </div>
                    <div className="bg-muted/15 border border-border/40 rounded-lg p-3.5">
                      <div className="text-[11px] text-muted-foreground/60 mb-1">Status</div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold capitalize">
                        {statusIcon(selectedDoc.status)}
                        {selectedDoc.status}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground/40 text-center mt-8">
                    This knowledge is automatically loaded into the agent's context during conversations.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <FileText size={32} className="mx-auto mb-3 opacity-20" />
                  No preview available for this document.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Database size={36} className="mx-auto mb-4 opacity-15" />
              <p className="text-sm font-medium text-foreground/60">Select a document</p>
              <p className="text-xs text-muted-foreground/50 mt-1.5">
                {documents.length} knowledge files loaded for the SEO agent
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
