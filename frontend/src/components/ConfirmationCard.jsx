import React from 'react';

export default function ConfirmationCard({ order, onConfirm, onCancel }) {
  return (
    <div className="flex justify-start animate-fade-in-up mb-6">
      <div className="p-4 max-w-sm w-full rounded-2xl border border-amber-400/30 bg-[var(--bg-card)] shadow-md">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-base">
            ⚠️
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-300">Confirm Refund</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Please review before proceeding</p>
          </div>
        </div>

        {/* Order details */}
        <div className="bg-[var(--bg-primary)] rounded-xl p-3 flex flex-col gap-1.5 text-xs mb-3 border border-[var(--border-light)]">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Order</span>
            <span className="text-[var(--text-primary)] font-medium font-mono">#{order.order_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Item</span>
            <span className="text-[var(--text-primary)]">{order.item}</span>
          </div>
          <div className="flex justify-between border-t border-[var(--border-light)] pt-1.5 mt-0.5">
            <span className="text-[var(--text-primary)] font-medium">Refund Amount</span>
            <span className="text-amber-600 dark:text-amber-300 font-bold">${order.price}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
          >
            ✓ Confirm Refund
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-transparent hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium py-2.5 rounded-xl border border-[var(--border-light)] transition-all duration-200 cursor-pointer active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
