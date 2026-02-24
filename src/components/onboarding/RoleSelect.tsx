import { ChevronRight } from 'lucide-react';
import type { AppSettings } from '../../lib/types';

type Role = AppSettings['role'];

const ROLES: { role: Role; label: string; icon: string; agents: string }[] = [
  { role: 'admin', label: 'Admin', icon: '👑', agents: 'All agents' },
  { role: 'editor', label: 'Editor', icon: '✏️', agents: 'Content Editor, SEO' },
  { role: 'paid-media', label: 'Paid Media', icon: '📢', agents: 'Paid Media, SEO' },
  { role: 'account-manager', label: 'Account Manager', icon: '📋', agents: 'Account Manager, DIY' },
  { role: 'developer', label: 'Developer', icon: '💻', agents: 'All agents + Dev tools' },
];

interface Props {
  onSelect: (role: Role) => void;
}

export default function RoleSelect({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 px-6">
      <h2 className="text-xl font-semibold text-zinc-100 mb-2">What's your role?</h2>
      <p className="text-[13px] text-zinc-500 mb-8">This determines which agents you'll see.</p>
      <div className="grid grid-cols-1 gap-2 max-w-sm w-full">
        {ROLES.map((r) => (
          <button
            key={r.role}
            onClick={() => onSelect(r.role)}
            className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-150 text-left group"
          >
            <span className="text-xl">{r.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-[13px] text-zinc-100">{r.label}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{r.agents}</p>
            </div>
            <ChevronRight size={15} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
