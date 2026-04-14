import { Card } from '../../primitives/Card';
import type { BlogPerformanceSnapshot } from '../../../services/blogAnalyticsService';

export function BlogPerformanceWidgets({ snapshot, staleThresholdDays }: { snapshot: BlogPerformanceSnapshot; staleThresholdDays: number }) {
  return (
    <>
      <div className="dashboard-kpi-grid">
        <article className="dashboard-kpi-card">
          <p>Draft</p>
          <strong>{snapshot.postsByStatus.draft}</strong>
          <span>Posts waiting for writing or edits</span>
        </article>
        <article className="dashboard-kpi-card">
          <p>In Review + Scheduled</p>
          <strong>{snapshot.postsByStatus.in_review + snapshot.postsByStatus.scheduled}</strong>
          <span>Editorial queue in progress</span>
        </article>
        <article className="dashboard-kpi-card">
          <p>Published (last 30d)</p>
          <strong>{snapshot.publishFrequencyLast30Days}</strong>
          <span>Publish frequency</span>
        </article>
        <article className="dashboard-kpi-card">
          <p>Archived</p>
          <strong>{snapshot.postsByStatus.archived}</strong>
          <span>Posts removed from active rotation</span>
        </article>
      </div>

      <div className="dashboard-grid dashboard-grid--2">
        <Card className="dashboard-panel" as="article">
          <div className="dashboard-panel__header">
            <h2>Top-performing posts</h2>
            <small>Views + CTA CTR</small>
          </div>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Views</th>
                <th>CTA clicks</th>
                <th>CTR</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.topPerformingPosts.length === 0 ? (
                <tr>
                  <td colSpan={4}>No performance data yet.</td>
                </tr>
              ) : (
                snapshot.topPerformingPosts.map((post) => (
                  <tr key={post.slug}>
                    <td>{post.title}</td>
                    <td>{post.views}</td>
                    <td>{post.ctaClicks}</td>
                    <td>{(post.ctr * 100).toFixed(1)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <Card className="dashboard-panel" as="article">
          <div className="dashboard-panel__header">
            <h2>Stale content candidates</h2>
            <small>Not updated for {staleThresholdDays}+ days</small>
          </div>
          <ul className="dashboard-simple-list">
            {snapshot.staleContentCandidates.length === 0 ? <li>No stale candidates found.</li> : null}
            {snapshot.staleContentCandidates.map((post) => (
              <li key={post.slug}>
                <strong>{post.title}</strong>
                <span> · {post.daysSinceUpdate} days since update</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
