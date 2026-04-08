type ComparisonPanelProps = {
  title: string;
  leftTitle: string;
  leftPoints: string[];
  rightTitle: string;
  rightPoints: string[];
};

export function ComparisonPanel({ title, leftTitle, leftPoints, rightTitle, rightPoints }: ComparisonPanelProps) {
  return (
    <section className="comparison-panel">
      <h2>{title}</h2>
      <div className="comparison-grid">
        <article>
          <h3>{leftTitle}</h3>
          <ul>
            {leftPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>{rightTitle}</h3>
          <ul>
            {rightPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
