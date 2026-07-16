import React from 'react';
import OrderCard from './OrderCard';
import RefundCard from './RefundCard';

function renderText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-[var(--text-primary)]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-[#FDFCFB] border border-[#E5E3D8] overflow-hidden">
      <img src="/logo.png" alt="FlowBot" className="w-6 h-6 object-contain" />
    </div>
  );
}

export default function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="message-in flex justify-end mb-6">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-2xl rounded-tr-sm px-4 py-3 text-[15px] leading-relaxed text-[var(--text-primary)] font-medium">
            {msg.content}
          </div>
        </div>
      </div>
    );
  }

  // System/Bot message
  return (
    <div className="message-in flex items-start gap-4 mb-8">
      <BotAvatar />
      <div className="flex-1 max-w-[85%] sm:max-w-[80%] pt-1">
        {msg.type === 'system' ? (
          <span className="inline-block text-[11px] text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-light)] px-2 py-1 font-semibold tracking-wider uppercase rounded">
            {msg.content}
          </span>
        ) : (
          <div className={`text-[15px] leading-relaxed text-[var(--text-primary)] ${msg.error ? 'text-[#D92D20]' : ''}`}>
            {renderText(msg.content)}
          </div>
        )}
        
        {msg.toolData && msg.tool === 'track_order' && (
          <div className="mt-4">
            <OrderCard order={msg.toolData} />
          </div>
        )}
        {msg.toolData && msg.tool === 'process_refund' && (
          <div className="mt-4">
            <RefundCard order={msg.toolData} />
          </div>
        )}
      </div>
    </div>
  );
}

