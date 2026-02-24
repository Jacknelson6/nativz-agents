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
    <div className="flex flex-col items-center justify-center h-screen bg-black px-6">
      <h2 className="text-2xl font-bold mb-2">What's your role?</h2>
      <p className="text-muted text-sm mb-8">This determines which agents you'll see.</p>
      <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
        {ROLES.map((r) => (
          <button
            key={r.role}
            onClick={() => onSelect(r.role)}
            className="text-left p-4 rounded-xl bg-surface border border-border hover:border-accent/30 transition-all"
          >
            <div className="text-2xl mb-2">{r.icon}</div>
            <p className="font-semibold text-sm">{r.label}</p>
            <p className="text-xs text-muted mt-1">{r.agents}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
