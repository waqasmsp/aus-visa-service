import { Card } from '../primitives/Card';
import { IconBulletList } from '../primitives/IconBulletList';
import { SectionContainer } from '../primitives/SectionContainer';

type ComparisonPanelProps = {
  title: string;
  leftTitle: string;
  leftPoints: string[];
  rightTitle: string;
  rightPoints: string[];
};

export function ComparisonPanel({ title, leftTitle, leftPoints, rightTitle, rightPoints }: ComparisonPanelProps) {
  return (
    <SectionContainer className="comparison-panel">
      <h2>{title}</h2>
      <div className="comparison-grid">
        <Card>
          <h3>{leftTitle}</h3>
          <IconBulletList items={leftPoints} />
        </Card>
        <Card>
          <h3>{rightTitle}</h3>
          <IconBulletList items={rightPoints} />
        </Card>
      </div>
    </SectionContainer>
  );
}
