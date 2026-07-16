import React from 'react';

export default function OrderCard({ order }) {
  const STATUS_STEPS = ['Processing', 'Shipped', 'In Transit', 'Delivered'];
  
  const statusIndex = STATUS_STEPS.findIndex(
    s => s.toLowerCase() === order.status?.toLowerCase()
  );
  const currentStepIndex = statusIndex >= 0 ? statusIndex : 0;

  const steps = STATUS_STEPS.map((stepName, i) => {
    const isDone = i < currentStepIndex;
    const isActive = i === currentStepIndex;
    return {
      label: stepName,
      done: isDone,
      active: isActive,
      icon: isDone ? '✓' : isActive ? '◎' : '○'
    };
  });

  return (
    <div className="claude-card p-5 mt-2 min-w-[280px] max-w-[320px] animate-fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b border-[var(--border-light)] pb-4">
        <div>
          <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
            Order #{order.order_id}
          </div>
          <div className="text-base font-bold text-[var(--text-primary)] mt-1">
            {order.item}
          </div>
        </div>
        <div className="px-2.5 py-1 rounded bg-[var(--bg-primary)] text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border border-[var(--border-light)]">
          {order.status}
        </div>
      </div>

      {/* ETA */}
      <div className="bg-[var(--bg-primary)] rounded-lg p-3 flex items-center gap-3 mb-5 border border-[var(--border-light)]">
        <div>
          <div className="text-[11px] text-[var(--text-secondary)] font-medium">Expected Delivery</div>
          <div className="text-sm font-bold text-[var(--accent-orange)]">{order.delivery_date}</div>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-colors ${
                step.done
                  ? 'bg-[var(--accent-orange)] text-white'
                  : step.active
                    ? 'border-2 border-[var(--accent-orange)] text-[var(--accent-orange)]'
                    : 'border-2 border-[var(--border-light)] text-[var(--border-light)]'
              }`}
            >
              {step.icon}
            </div>
            <span
              className={`text-xs ${
                step.active ? 'font-bold text-[var(--text-primary)]' : step.done ? 'font-medium text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Tracking number */}
      <div className="mt-5 pt-3 border-t border-[var(--border-light)] text-center">
        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-mono font-bold">
          Via {order.carrier.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
