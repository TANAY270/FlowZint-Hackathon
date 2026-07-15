import React from 'react';

export default function ConfirmationCard({ order, onConfirm, onCancel }) {
  return (
    <div className="flex justify-start animate-fade-in-up">
      <div className="glass-card p-4 max-w-md border-amber-500/20">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-7 w-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-sm">
            ⚠️
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-300">Confirm Refund</p>
            <p className="text-[10px] text-slate-500">Please review before proceeding</p>
          </div>
        </div>

        {/* Order details */}
        <div className="bg-[#0d1117]/60 rounded-lg p-3 flex flex-col gap-1.5 text-xs mb-3">
          <div className="flex justify-between">
            <span className="text-slate-500">Order</span>
            <span className="text-slate-200 font-medium font-mono">#{order.order_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Item</span>
            <span className="text-slate-200">{order.item}</span>
          </div>
          <div className="flex justify-between border-t border-slate-800/50 pt-1.5 mt-0.5">
            <span className="text-slate-400 font-medium">Refund Amount</span>
            <span className="text-amber-300 font-bold">${order.price}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 bg-amber-500/90 hover:bg-amber-500 text-[#0d1117] text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
          >
            Confirm Refund
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-transparent hover:bg-slate-800/60 text-slate-400 text-xs font-medium py-2 rounded-lg border border-slate-700/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
