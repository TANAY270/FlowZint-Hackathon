import React from 'react';

const STEPS = ['Ordered', 'Shipped', 'In Transit', 'Delivered'];

export default function OrderCard({ order }) {
  const statusIndex = STEPS.findIndex(
    s => s.toLowerCase() === order.status?.toLowerCase()
  );
  const currentStep = statusIndex >= 0 ? statusIndex : 0;

  return (
    <div className="glass-card p-4 max-w-md animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/15 flex items-center justify-center text-sm">
            📦
          </div>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Order #{order.order_id}
          </span>
        </div>
        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
            order.status === 'Delivered'
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {order.status}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-4 px-0.5">
        <div>
          <span className="text-slate-600 text-[10px]">Item</span>
          <p className="text-slate-200 font-medium">{order.item}</p>
        </div>
        <div>
          <span className="text-slate-600 text-[10px]">Price</span>
          <p className="text-slate-200 font-medium">${order.price}</p>
        </div>
        <div>
          <span className="text-slate-600 text-[10px]">Carrier</span>
          <p className="text-slate-200 font-medium">{order.carrier}</p>
        </div>
        <div>
          <span className="text-slate-600 text-[10px]">Est. Delivery</span>
          <p className="text-slate-200 font-medium">{order.delivery_date}</p>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="relative flex justify-between px-1 pt-1 pb-0.5">
        {/* Background track */}
        <div
          className="absolute top-[9px] h-[2px] rounded-full bg-slate-700/50"
          style={{ left: '12.5%', width: '75%' }}
        />
        {/* Active track */}
        <div
          className="absolute top-[9px] h-[2px] rounded-full bg-emerald-400/80 transition-all duration-700 ease-out"
          style={{
            left: '12.5%',
            width: `${currentStep > 0 ? (currentStep / (STEPS.length - 1)) * 75 : 0}%`,
          }}
        />

        {STEPS.map((step, i) => (
          <div key={step} className="flex flex-col items-center flex-1 z-10">
            <div
              className={`h-2.5 w-2.5 rounded-full border-2 transition-all duration-300 ${
                i < currentStep
                  ? 'bg-emerald-400 border-emerald-400'
                  : i === currentStep
                    ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.5)]'
                    : 'bg-[#151b28] border-slate-600'
              }`}
            />
            <span
              className={`text-[9px] mt-1.5 leading-none font-medium ${
                i <= currentStep ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
