import React from 'react';

export default function DatabaseExplorer({ orders }) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-secondary)] mb-1">
        Live Database
      </h2>
      <p className="text-[10px] text-[var(--text-secondary)] mb-4 leading-relaxed">
        Real-time mock backend state. Updates on tool execution.
      </p>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-0.5">
        {Object.keys(orders).length === 0 ? (
          <span className="text-[var(--text-secondary)] italic text-xs">No records loaded.</span>
        ) : (
          Object.values(orders).map(order => (
            <div
              key={order.order_id}
              className="p-3 flex flex-col gap-2 text-xs rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-1.5 border-b border-[var(--border-light)]">
                <span className="text-[var(--accent-orange)] font-bold font-mono">
                  #{order.order_id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                    order.status === 'Delivered'
                      ? 'bg-green-100 text-green-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : order.status === 'Cancelled'
                      ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {/* Fields */}
              <div className="flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Item</span>
                  <span className="text-[var(--text-primary)] font-medium text-right max-w-[60%] truncate">{order.item}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Price</span>
                  <span className="text-[var(--text-primary)] font-medium">${order.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Carrier</span>
                  <span className="text-[var(--text-primary)]">{order.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Delivery</span>
                  <span className="text-[var(--text-primary)]">{order.delivery_date}</span>
                </div>
                {order.refunded !== undefined && (
                  <div className="flex justify-between items-center mt-0.5 pt-1.5 border-t border-[var(--border-light)]">
                    <span className="text-[var(--text-secondary)]">Refunded</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          order.refunded ? 'bg-emerald-500' : 'bg-[var(--border-light)]'
                        }`}
                      />
                      <span
                        className={
                          order.refunded
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-[var(--text-secondary)]'
                        }
                      >
                        {order.refunded ? 'YES' : 'NO'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
