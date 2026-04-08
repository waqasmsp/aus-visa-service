import { Card } from '../primitives/Card';
import { SectionContainer } from '../primitives/SectionContainer';

type Stat = {
  label: string;
  value: string;
};

type StatsStripProps = {
  stats: Stat[];
};

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <SectionContainer className="stats-strip">
      {stats.map((stat) => (
        <Card key={stat.label} className="stat-card">
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </Card>
      ))}
    </SectionContainer>
  );
}
