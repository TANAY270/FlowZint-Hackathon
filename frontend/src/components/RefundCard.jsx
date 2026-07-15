import React from 'react';

export default function RefundCard({ order }) {
  return (
    <div className="glass-card p-4 max-w-md border-emerald-500/20 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-7 w-7 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-xs font-bold">
          ✓
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-400">Refund Processed</p>
          <p className="text-[10px] text-slate-500">Transaction completed successfully</p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-[#0d1117]/60 rounded-lg p-3 flex flex-col gap-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Order</span>
          <span className="text-slate-200 font-medium font-mono">#{order.order_id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Item</span>
          <span className="text-slate-200">{order.item}</span>
        </div>
        <div className="flex justify-between border-t border-slate-800/50 pt-1.5 mt-0.5">
          <span className="text-slate-400 font-medium">Amount Refunded</span>
          <span className="text-emerald-400 font-bold">${order.price}</span>
        </div>
      </div>

      <p className="text-[10px] text-slate-500 mt-2.5 px-0.5">
        Expect the refund in your account within 2–3 business days.
      </p>
    </div>
  );
}
