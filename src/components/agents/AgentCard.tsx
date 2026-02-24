import type { Agent } from "../../lib/types";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  agent: Agent;
  onSelect: (agent: Agent) => void;
}

export default function AgentCard({ agent, onSelect }: Props) {
  return (
    <Card
      className="cursor-pointer transition-all hover:ring-1 hover:ring-primary group"
      onClick={() => onSelect(agent)}
    >
      <CardHeader className="pb-2">
        <span className="text-2xl mb-1">{agent.icon}</span>
        <CardTitle className="text-sm">{agent.name}</CardTitle>
        <CardDescription className="line-clamp-2 text-xs">
          {agent.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1.5 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Start Chat <ArrowRight size={12} />
        </div>
      </CardContent>
    </Card>
  );
}
