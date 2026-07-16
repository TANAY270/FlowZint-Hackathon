import React from 'react';

export default function RefundCard({ order }) {
  return (
    <div className="claude-card p-5 mt-2 max-w-[300px] animate-fade-in-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-secondary)]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">
            Refund Initiated
          </div>
          <div className="text-lg font-bold text-[var(--text-primary)]">
            ${order.price}
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-primary)] rounded-lg p-3 flex flex-col gap-2.5 border border-[var(--border-light)]">
        {[
          { label: 'Order ID', value: '#' + order.order_id },
          { label: 'Item', value: order.item },
          { label: 'Timeline', value: '3–5 Business Days' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center text-xs">
            <span className="text-[var(--text-secondary)] font-medium">{label}</span>
            <span className="font-bold text-[var(--text-primary)] max-w-[150px] truncate">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-3 border-t border-[var(--border-light)] text-center">
        <span className="text-[11px] text-[var(--text-secondary)]">
          You'll receive an email confirmation shortly.
        </span>
      </div>
    </div>
  );
}
