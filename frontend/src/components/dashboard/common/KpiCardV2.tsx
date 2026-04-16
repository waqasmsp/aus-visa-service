import { useMemo, useState } from 'react';

type TrendDirection = 'up' | 'down' | 'flat';
type KpiSeverity = 'success' | 'warning' | 'danger' | 'neutral';

type KpiCardV2Props = {
  title: string;
  value: string;
  delta: string;
  trendDirection: TrendDirection;
  sparklineData: number[];
  severity: KpiSeverity;
  href?: string;
};

const trendLabelMap: Record<TrendDirection, string> = {
  up: 'Trending up',
  down: 'Trending down',
  flat: 'No significant change'
};

const trendSymbolMap: Record<TrendDirection, string> = {
  up: '↑',
  down: '↓',
  flat: '→'
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function KpiCardV2({ title, value, delta, trendDirection, sparklineData, severity, href }: KpiCardV2Props) {
  const [expanded, setExpanded] = useState(false);

  const points = useMemo(() => {
    if (sparklineData.length <= 1) {
      return '0,24 100,24';
    }

    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;

    return sparklineData
      .map((point, index) => {
        const x = (index / (sparklineData.length - 1)) * 100;
        const normalized = (point - min) / range;
        const y = clamp(24 - normalized * 22, 2, 24);
        return `${x},${y}`;
      })
      .join(' ');
  }, [sparklineData]);

  return (
    <article className={`kpi-card-v2 kpi-card-v2--${severity}`}>
      <div className="kpi-card-v2__body">
        <p>{title}</p>
        <strong>{value}</strong>
        <div className={`kpi-card-v2__meta ${expanded ? 'is-expanded' : ''}`}>
          <span className={`kpi-card-v2__delta kpi-card-v2__delta--${trendDirection}`} aria-label={trendLabelMap[trendDirection]}>
            {trendSymbolMap[trendDirection]} {delta}
          </span>
          <svg viewBox="0 0 100 26" role="img" aria-label={`${title} trend`}>
            <polyline points={points} />
          </svg>
        </div>
      </div>
      <div className="kpi-card-v2__actions">
        <button
          type="button"
          className="kpi-card-v2__toggle"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
        {href ? <a href={href}>View filtered table</a> : null}
      </div>
    </article>
  );
}
