import React from 'react';

export default function AgentDashboard({ messages, sentiment, onResolve }) {
  // Derive context briefing from the conversation
  const userMessages = messages.filter(m => m.role === 'user');
  const allUserText = userMessages.map(m => m.content).join(' ').toLowerCase();

  let issue = 'Customer inquiry requiring human assistance';
  let blocker = 'AI unable to resolve — manual review needed';

  if (allUserText.includes('refund')) {
    const match = allUserText.match(/(?:order\s*#?\s*|#)(\d+)/i);
    issue = `Refund request${match ? ` for Order #${match[1]}` : ''}`;
  } else if (
    allUserText.includes('track') ||
    allUserText.includes('where') ||
    allUserText.includes('deliver')
  ) {
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
    sentiment > 0.6
      ? 'Calm'
      : sentiment < 0.3
        ? 'Highly Frustrated'
        : sentiment < 0.5
          ? 'Frustrated'
          : 'Neutral';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <h2 className="text-[10px] font-semibold tracking-wider uppercase text-red-400">
          Escalated — Agent View
        </h2>
      </div>

      {/* Context Briefing */}
      <div className="glass-card p-3 mb-3 border-red-500/20">
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          Context Briefing
        </h3>
        <div className="flex flex-col gap-2.5 text-xs">
          <div>
            <span className="text-slate-600 text-[9px] uppercase tracking-wider">Issue</span>
            <p className="text-slate-200 font-medium mt-0.5">{issue}</p>
          </div>
          <div>
            <span className="text-slate-600 text-[9px] uppercase tracking-wider">Blocker</span>
            <p className="text-amber-300/90 font-medium mt-0.5">{blocker}</p>
          </div>
          <div>
            <span className="text-slate-600 text-[9px] uppercase tracking-wider">Sentiment</span>
            <p
              className={`font-medium mt-0.5 ${
                sentiment < 0.4 ? 'text-red-400' : 'text-slate-300'
              }`}
            >
              {sentimentLabel} ({(sentiment * 10).toFixed(1)}/10)
            </p>
          </div>
        </div>
      </div>

      {/* Conversation transcript */}
      <div className="flex-1 min-h-0 flex flex-col">
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Conversation Log ({messages.length})
        </h3>
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-[11px] px-2.5 py-1.5 rounded-md ${
                msg.role === 'user'
                  ? 'bg-indigo-500/8 text-slate-300 border-l-2 border-indigo-500/40'
                  : 'bg-slate-800/30 text-slate-400 border-l-2 border-slate-600/30'
              }`}
            >
              <span className="text-[9px] text-slate-600 font-semibold uppercase">
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
        className="mt-3 w-full bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold py-2.5 rounded-lg border border-emerald-500/20 transition-colors cursor-pointer"
      >
        Mark as Resolved
      </button>
    </div>
  );
}
