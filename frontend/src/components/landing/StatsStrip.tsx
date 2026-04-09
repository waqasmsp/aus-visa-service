import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../primitives/Card';
import { SectionContainer } from '../primitives/SectionContainer';

type Stat = {
  label: string;
  value: string;
};

type StatsStripProps = {
  stats: Stat[];
};

type ParsedStat = {
  prefix: string;
  target: number;
  suffix: string;
};

const DURATION_MS = 1400;

function parseStat(rawValue: string): ParsedStat {
  const match = rawValue.match(/^([^0-9]*)(\d+)(.*)$/);

  if (!match) {
    return {
      prefix: '',
      target: 0,
      suffix: rawValue
    };
  }

  return {
    prefix: match[1],
    target: Number.parseInt(match[2], 10),
    suffix: match[3]
  };
}

function AnimatedValue({ value, isActive }: { value: string; isActive: boolean }) {
  const parsed = useMemo(() => parseStat(value), [value]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCurrent(0);
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrent(parsed.target);
      return;
    }

    let frameId = 0;
    let startTime = 0;

    const step = (time: number) => {
      if (!startTime) {
        startTime = time;
      }

      const elapsed = time - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const eased = 1 - (1 - progress) * (1 - progress);

      setCurrent(Math.round(parsed.target * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      }
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isActive, parsed.target]);

  return (
    <strong>
      {parsed.prefix}
      {current}
      {parsed.suffix}
    </strong>
  );
}

export function StatsStrip({ stats }: StatsStripProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const target = wrapperRef.current;

    if (!target || hasStarted) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasStarted]);

  return (
    <div ref={wrapperRef}>
      <SectionContainer className="stats-strip">
        {stats.map((stat) => (
          <Card key={stat.label} className="stat-card">
            <AnimatedValue value={stat.value} isActive={hasStarted} />
            <span>{stat.label}</span>
          </Card>
        ))}
      </SectionContainer>
    </div>
  );
}
