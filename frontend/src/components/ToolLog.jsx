import React from 'react';

export default function ToolLog({ log }) {
  return (
    <div className="p-2.5 rounded-xl claude-card flex flex-col gap-1 message-in">
      <div className="flex justify-between items-start gap-2">
        <span className="code-accent font-semibold break-all leading-tight" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
          {log.tool}()
        </span>
        <span
          className="shrink-0 px-1.5 py-0.5 rounded font-medium"
          style={{
            fontSize: '10px',
            background: log.status === 'Success' ? 'var(--success-bg)' : 'var(--error-bg)',
            color: log.status === 'Success' ? 'var(--success-txt)' : 'var(--error-txt)',
          }}
        >
          {log.status}
        </span>
      </div>
      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{log.timestamp}</span>
    </div>
  );
}
