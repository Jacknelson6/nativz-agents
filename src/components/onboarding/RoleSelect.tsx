import { ChevronRight } from "lucide-react";
import type { AppSettings } from "../../lib/types";
import { Card, CardContent } from "@/components/ui/card";

type Role = AppSettings["role"];

const ROLES: { role: Role; label: string; icon: string; agents: string }[] = [
  { role: "admin", label: "Admin", icon: "👑", agents: "All agents" },
  { role: "editor", label: "Editor", icon: "✏️", agents: "Content Editor, SEO" },
  { role: "paid-media", label: "Paid Media", icon: "📢", agents: "Paid Media, SEO" },
  { role: "account-manager", label: "Account Manager", icon: "📋", agents: "Account Manager, DIY" },
  { role: "developer", label: "Developer", icon: "💻", agents: "All agents + Dev tools" },
];

interface Props {
  onSelect: (role: Role) => void;
}

export default function RoleSelect({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-screen px-6">
      <h2 className="text-xl font-semibold mb-2">What&apos;s your role?</h2>
      <p className="text-sm text-muted-foreground mb-8">
        This determines which agents you&apos;ll see.
      </p>
      <div className="grid grid-cols-1 gap-2 max-w-sm w-full">
        {ROLES.map((r) => (
          <Card
            key={r.role}
            className="cursor-pointer hover:ring-1 hover:ring-primary transition-all group"
            onClick={() => onSelect(r.role)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <span className="text-xl">{r.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{r.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.agents}</p>
              </div>
              <ChevronRight
                size={15}
                className="text-muted-foreground group-hover:text-foreground transition-colors"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
