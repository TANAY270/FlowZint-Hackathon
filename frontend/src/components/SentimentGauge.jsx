import React from 'react';

export default function SentimentGauge({ sentiment, history = [] }) {
  const getDetails = () => {
    if (sentiment > 0.6) return { text: 'Positive',   color: 'var(--status-green-txt)', barColor: '#22c55e' };
    if (sentiment < 0.4) return { text: 'Frustrated', color: 'var(--status-red-txt)',   barColor: '#ef4444' };
    return               { text: 'Neutral',    color: 'var(--text-secondary)',   barColor: 'var(--accent)' };
  };

  const details = getDetails();

  const lineColor = sentiment > 0.6 ? '#22c55e' : sentiment < 0.4 ? '#ef4444' : '#C96442';
  const fillColor = lineColor;

  const renderSparkline = () => {
    if (history.length < 2) return null;
    const width = 200, height = 32, pad = 2;
    const w = width - pad * 2, h = height - pad * 2;
    const points = history.map((val, i) => ({
      x: pad + (i / (history.length - 1)) * w,
      y: pad + (1 - val) * h,
    }));
    const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
    const last = points[points.length - 1], first = points[0];
    const areaD =
      points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') +
      ` L ${last.x} ${height} L ${first.x} ${height} Z`;

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none" className="mt-2 rounded">
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#spark-fill)" />
        <polyline points={polyline} fill="none" stroke={lineColor}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r="2.5" fill={fillColor} />
      </svg>
    );
  };

  return (
    <div className="claude-card p-4">
      <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
        Live Sentiment
      </h3>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold" style={{ color: details.color }}>{details.text}</span>
        <span className="text-xs text-[var(--text-secondary)] font-mono">
          {(sentiment * 10).toFixed(1)}/10
        </span>
      </div>
      <div className="h-1.5 w-full bg-[var(--border-light)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${sentiment * 100}%`, backgroundColor: details.barColor }}
        />
      </div>
      {renderSparkline()}
      {history.length >= 2 && (
        <p className="text-[10px] text-[var(--text-secondary)] mt-1">
          {history.length} exchanges tracked
        </p>
      )}
    </div>
  );
}
