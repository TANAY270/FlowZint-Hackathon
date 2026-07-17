import React from 'react';

export default function AgentDashboard({ messages, sentiment, onResolve }) {
  const userMessages = messages.filter(m => m.role === 'user');
  const allUserText = userMessages.map(m => m.content).join(' ').toLowerCase();

  let issue = 'Customer inquiry requiring human assistance';
  let blocker = 'AI unable to resolve — manual review needed';

  if (allUserText.includes('refund')) {
    const match = allUserText.match(/(?:order\s*#?\s*|#)(\d+)/i);
    issue = `Refund request${match ? ` for Order #${match[1]}` : ''}`;
  } else if (allUserText.includes('track') || allUserText.includes('where') || allUserText.includes('deliver')) {
    issue = 'Order tracking / delivery inquiry';
  }

  if (sentiment < 0.3) {
    blocker = 'Customer is highly frustrated — priority handling required';
  } else if (allUserText.includes('damaged') || allUserText.includes('broken')) {
    blocker = 'Product quality or fulfillment issue reported';
  } else if (allUserText.includes('manager') || allUserText.includes('supervisor')) {
    blocker = 'Customer explicitly demanded management escalation';
  }

  const sentimentLabel =
    sentiment > 0.6 ? 'Calm'
    : sentiment < 0.3 ? 'Highly Frustrated'
    : sentiment < 0.5 ? 'Frustrated'
    : 'Neutral';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <h2 className="text-xs font-semibold tracking-wider uppercase text-red-500">
          Escalated — Agent View
        </h2>
      </div>

      {/* Context Briefing */}
      <div className="claude-card p-3 mb-3 border-l-4 border-red-500">
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2.5">
          Context Briefing
        </h3>
        <div className="flex flex-col gap-2.5 text-sm">
          <div>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Issue</span>
            <p className="text-[var(--text-primary)] font-medium mt-0.5">{issue}</p>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Blocker</span>
            <p className="font-medium mt-0.5" style={{ color: 'var(--status-amber-txt)' }}>{blocker}</p>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Sentiment</span>
            <p
              className="font-medium mt-0.5"
              style={{ color: sentiment < 0.4 ? 'var(--status-red-txt)' : 'var(--text-primary)' }}
            >
              {sentimentLabel} ({(sentiment * 10).toFixed(1)}/10)
            </p>
          </div>
        </div>
      </div>

      {/* Conversation transcript */}
      <div className="flex-1 min-h-0 flex flex-col">
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
          Conversation Log ({messages.length})
        </h3>
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border-light)]"
              style={{
                background: msg.role === 'user' ? 'var(--status-blue-bg)' : 'var(--bg-primary)',
                color: 'var(--text-primary)',
                borderLeft: msg.role === 'user' ? '2px solid var(--status-blue-txt)' : '2px solid var(--border-light)'
              }}
            >
              <span className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase">
                {msg.role === 'user' ? 'Customer' : 'AI'}
              </span>
              <p className="mt-0.5 line-clamp-2">{msg.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resolve action */}
      <button
        onClick={onResolve}
        className="mt-3 w-full text-sm font-semibold py-2.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95"
        style={{
          background: 'var(--status-green-bg)',
          color: 'var(--status-green-txt)',
          borderColor: 'var(--status-green-txt)',
          opacity: 0.9
        }}
        onMouseOver={e => e.currentTarget.style.opacity = '1'}
        onMouseOut={e => e.currentTarget.style.opacity = '0.9'}
      >
        ✓ Mark as Resolved
      </button>
    </div>
  );
}
