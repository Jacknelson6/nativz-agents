import type { Message } from './types';

export function exportToMarkdown(messages: Message[]): string {
  const lines: string[] = [];
  lines.push('# Conversation Export');
  lines.push(`*Exported on ${new Date().toLocaleString()}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const msg of messages) {
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (msg.role === 'user') {
      lines.push(`## User (${time})`);
      lines.push('');
      lines.push(msg.content);
    } else if (msg.role === 'assistant') {
      lines.push(`## Assistant (${time})`);
      lines.push('');
      lines.push(msg.content);

      if (msg.toolCalls && msg.toolCalls.length > 0) {
        lines.push('');
        lines.push('### Tool Calls');
        for (const tc of msg.toolCalls) {
          lines.push(`\n**${tc.name}** (${tc.status})`);
          if (tc.output) {
            lines.push('```');
            lines.push(tc.output.slice(0, 2000));
            lines.push('```');
          }
        }
      }
    } else if (msg.role === 'system') {
      lines.push(`## System (${time})`);
      lines.push('');
      lines.push(msg.content);
    }

    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}
