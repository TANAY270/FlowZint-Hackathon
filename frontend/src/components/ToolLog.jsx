import React from 'react';

export default function ToolLog({ log }) {
  return (
    <div className="text-xs p-2.5 rounded-lg glass-card flex flex-col gap-1 animate-fade-in-up">
      <div className="flex justify-between items-center font-mono">
        <span className="text-indigo-400 font-semibold">{log.tool}()</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
            log.status === 'Success'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {log.status}
        </span>
      </div>
      <span className="text-[10px] text-slate-600">{log.timestamp}</span>
    </div>
  );
}
