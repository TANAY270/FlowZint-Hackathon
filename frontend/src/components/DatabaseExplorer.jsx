import React from 'react';

export default function DatabaseExplorer({ orders }) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 mb-1">
        Live Database
      </h2>
      <p className="text-[10px] text-slate-600 mb-4 leading-relaxed">
        Real-time mock backend state. Updates on tool execution.
      </p>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-0.5">
        {Object.keys(orders).length === 0 ? (
          <span className="text-slate-600 italic text-xs">No records loaded.</span>
        ) : (
          Object.values(orders).map(order => (
            <div
              key={order.order_id}
              className="glass-card p-3 flex flex-col gap-2 text-xs"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/30">
                <span className="text-indigo-300 font-bold font-mono">
                  #{order.order_id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                    order.status === 'Delivered'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {/* Fields */}
              <div className="flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Item</span>
                  <span className="text-slate-300">{order.item}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Price</span>
                  <span className="text-slate-300">${order.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Carrier</span>
                  <span className="text-slate-300">{order.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery</span>
                  <span className="text-slate-300">{order.delivery_date}</span>
                </div>
                {order.refunded !== undefined && (
                  <div className="flex justify-between items-center mt-0.5 pt-1.5 border-t border-slate-800/30">
                    <span className="text-slate-600">Refunded</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          order.refunded ? 'bg-emerald-400' : 'bg-slate-600'
                        }`}
                      />
                      <span
                        className={
                          order.refunded
                            ? 'text-emerald-400 font-semibold'
                            : 'text-slate-500'
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
