import { useAgentStore } from "../../stores/agentStore";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface Props {
  onSelectPrompt: (prompt: string) => void;
}

export default function EmptyState({ onSelectPrompt }: Props) {
  const { selectedAgent } = useAgentStore();

  if (!selectedAgent) return null;

  const suggestions: string[] = [
    `What can you help me with?`,
    `Give me a quick ${selectedAgent.category ?? "productivity"} tip`,
    `Help me get started`,
    `Show me what you can do`,
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <div className="text-center mb-8">
        <span className="text-5xl mb-4 block">{selectedAgent.icon}</span>
        <h2 className="text-xl font-semibold mt-4">{selectedAgent.name}</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          {selectedAgent.description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
        {suggestions.slice(0, 4).map((prompt) => (
          <Card
            key={prompt}
            className="cursor-pointer transition-colors hover:bg-accent group"
            onClick={() => onSelectPrompt(prompt)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-sm text-muted-foreground group-hover:text-accent-foreground flex-1">
                {prompt}
              </span>
              <ArrowRight
                size={14}
                className="text-muted-foreground/40 group-hover:text-accent-foreground transition-colors shrink-0"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
