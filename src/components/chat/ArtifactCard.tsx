import { FileText, Download } from 'lucide-react';

interface Props {
  fileName: string;
  preview?: string;
}

export default function ArtifactCard({ fileName, preview }: Props) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-border">
      <div className="p-2 rounded-lg bg-accent/10">
        <FileText size={18} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        {preview && <p className="text-xs text-muted truncate">{preview}</p>}
      </div>
      <button className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-white transition-colors">
        <Download size={16} />
      </button>
    </div>
  );
}
