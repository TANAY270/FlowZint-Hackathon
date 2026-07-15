import React from 'react';

export default function LoadingIndicator({ phase = '💬 Thinking...' }) {
  return (
    <div className="flex justify-start animate-fade-in-up">
      <div className="glass-card p-4 flex items-center gap-3">
        <div className="flex space-x-1">
          <span
            className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
        <span className="text-xs text-slate-400">{phase}</span>
      </div>
    </div>
  );
}
