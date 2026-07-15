import React from 'react';
import OrderCard from './OrderCard';
import RefundCard from './RefundCard';

export default function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';

  // Decide whether to render a rich card alongside the text response
  const renderContent = () => {
    // Tool executed with structured data → show card below the text bubble
    if (msg.toolData && msg.tool === 'track_order') {
      return (
        <div className="flex flex-col gap-2.5">
          <TextBubble msg={msg} isUser={isUser} />
          <OrderCard order={msg.toolData} />
        </div>
      );
    }

    if (msg.toolData && msg.tool === 'process_refund') {
      return (
        <div className="flex flex-col gap-2.5">
          <TextBubble msg={msg} isUser={isUser} />
          <RefundCard order={msg.toolData} />
        </div>
      );
    }

    // Default: plain text bubble
    return <TextBubble msg={msg} isUser={isUser} />;
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
    >
      <div className="max-w-2xl flex flex-col gap-1">
        {renderContent()}

        {/* Tool indicator (when no rich card is shown) */}
        {msg.tool && !msg.toolData && (
          <div className="flex items-center gap-1.5 px-2 text-[11px] text-indigo-400/80 font-mono mt-0.5">
            <span>
              ⚡ Executed: <strong>{msg.tool}</strong>
            </span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                msg.toolStatus === 'Success' ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
          </div>
        )}

        {/* Timestamp */}
        <span
          className={`text-[10px] text-slate-600 px-2 ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {msg.timestamp}
        </span>
      </div>
    </div>
  );
}

/** Plain text message bubble */
function TextBubble({ msg, isUser }) {
  return (
    <div
      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed border ${
        isUser
          ? 'bg-indigo-600/90 text-white border-indigo-500/50'
          : msg.error
            ? 'bg-red-500/10 border-red-500/30 text-red-200'
            : 'bg-[#111827]/70 border-[#1e293b]/50 text-slate-100'
      }`}
    >
      {msg.content}
    </div>
  );
}
