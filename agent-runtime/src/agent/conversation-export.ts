/**
 * Generate shareable HTML reports from conversations.
 * Single-file, zero-dependency HTML with dark theme.
 */

export interface ExportMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  toolCalls?: Array<{ name: string; input: Record<string, unknown>; result?: string }>;
}

export interface ExportOptions {
  agentName: string;
  agentIcon?: string;
  model?: string;
  conversationId?: string;
  title?: string;
  messages: ExportMessage[];
  artifacts?: Array<{ name: string; content: string; language?: string }>;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTimestamp(ts?: number): string {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function generateConversationHtml(options: ExportOptions): string {
  const { agentName, agentIcon, model, title, messages, artifacts } = options;
  const displayTitle = title ?? `Conversation with ${agentName}`;
  const exportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const messagesHtml = messages.map(msg => {
    const isUser = msg.role === 'user';
    const roleLabel = isUser ? 'You' : agentName;
    const roleClass = isUser ? 'user' : 'assistant';
    const time = formatTimestamp(msg.timestamp);

    let toolCallsHtml = '';
    if (msg.toolCalls?.length) {
      toolCallsHtml = msg.toolCalls.map(tc => `
        <div class="tool-call">
          <div class="tool-name">🔧 ${escapeHtml(tc.name)}</div>
          <pre class="tool-input">${escapeHtml(JSON.stringify(tc.input, null, 2))}</pre>
          ${tc.result ? `<pre class="tool-result">${escapeHtml(tc.result.slice(0, 2000))}</pre>` : ''}
        </div>
      `).join('');
    }

    return `
      <div class="message ${roleClass}">
        <div class="message-header">
          <span class="role">${escapeHtml(roleLabel)}</span>
          ${time ? `<span class="time">${time}</span>` : ''}
        </div>
        <div class="message-content">${escapeHtml(msg.content)}</div>
        ${toolCallsHtml}
      </div>
    `;
  }).join('');

  const artifactsHtml = artifacts?.length ? `
    <div class="artifacts-section">
      <h2>Artifacts</h2>
      ${artifacts.map(a => `
        <div class="artifact">
          <div class="artifact-name">${escapeHtml(a.name)}${a.language ? ` (${escapeHtml(a.language)})` : ''}</div>
          <pre class="artifact-content">${escapeHtml(a.content)}</pre>
        </div>
      `).join('')}
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(displayTitle)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; }
  .header { border-bottom: 1px solid #21262d; padding-bottom: 1.5rem; margin-bottom: 2rem; }
  .header h1 { font-size: 1.5rem; color: #f0f6fc; margin-bottom: 0.5rem; }
  .header .meta { font-size: 0.85rem; color: #8b949e; display: flex; gap: 1rem; flex-wrap: wrap; }
  .message { padding: 1rem; margin-bottom: 1rem; border-radius: 8px; }
  .message.user { background: #161b22; border-left: 3px solid #58a6ff; }
  .message.assistant { background: #161b22; border-left: 3px solid #3fb950; }
  .message-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
  .role { font-weight: 600; font-size: 0.9rem; }
  .user .role { color: #58a6ff; }
  .assistant .role { color: #3fb950; }
  .time { font-size: 0.8rem; color: #8b949e; }
  .message-content { white-space: pre-wrap; word-break: break-word; }
  .tool-call { background: #0d1117; border: 1px solid #21262d; border-radius: 6px; padding: 0.75rem; margin-top: 0.75rem; }
  .tool-name { font-weight: 600; color: #d2a8ff; margin-bottom: 0.5rem; font-size: 0.85rem; }
  .tool-input, .tool-result { background: #161b22; padding: 0.5rem; border-radius: 4px; font-size: 0.8rem; overflow-x: auto; margin-top: 0.25rem; }
  .tool-result { border-left: 2px solid #3fb950; }
  .artifacts-section { margin-top: 2rem; border-top: 1px solid #21262d; padding-top: 1.5rem; }
  .artifacts-section h2 { font-size: 1.2rem; color: #f0f6fc; margin-bottom: 1rem; }
  .artifact { margin-bottom: 1rem; }
  .artifact-name { font-weight: 600; color: #d2a8ff; margin-bottom: 0.5rem; }
  .artifact-content { background: #161b22; padding: 1rem; border-radius: 6px; font-size: 0.85rem; overflow-x: auto; }
  .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #21262d; font-size: 0.8rem; color: #8b949e; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <h1>${agentIcon ? agentIcon + ' ' : ''}${escapeHtml(displayTitle)}</h1>
    <div class="meta">
      <span>Agent: ${escapeHtml(agentName)}</span>
      ${model ? `<span>Model: ${escapeHtml(model)}</span>` : ''}
      <span>Messages: ${messages.length}</span>
      <span>Exported: ${exportDate}</span>
    </div>
  </div>
  ${messagesHtml}
  ${artifactsHtml}
  <div class="footer">Generated by Nativz Agents</div>
</body>
</html>`;
}
