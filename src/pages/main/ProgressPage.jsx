import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '../../context/useSessionContext';
import { ROUTES, buildRoute, getScoreTier } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import './InnerPages.css';
import './ProgressPage.css';

const TIME_RANGES = ['Week', 'Month', 'Year'];

function ProgressPage() {
  const navigate = useNavigate();
  const { sessions, fetchSessions, isLoading } = useSessionContext();

  const [range, setRange] = useState('Week');

  useEffect(() => {
    fetchSessions(1, true);
  }, [fetchSessions]);

  // Filter sessions for chart based on range
  const now = new Date();
  const filteredSessions = sessions.filter((s) => {
    const d = new Date(s.created_at);
    if (range === 'Week')  return (now - d) / 86400000 <= 7;
    if (range === 'Month') return (now - d) / 86400000 <= 30;
    return (now - d) / 86400000 <= 365;
  });

  const avgScore = filteredSessions.length
    ? Math.round(filteredSessions.reduce((a, b) => a + (b.confidence_score ?? 0), 0) / filteredSessions.length)
    : null;

  // Last-period comparison
  const prevNow = new Date(now);
  const daysMap = { Week: 7, Month: 30, Year: 365 };
  const days = daysMap[range];
  prevNow.setDate(prevNow.getDate() - days);

  const prevSessions = sessions.filter((s) => {
    const d = new Date(s.created_at);
    const prev2 = new Date(prevNow);
    prev2.setDate(prev2.getDate() - days);
    return d >= prev2 && d < prevNow;
  });

  const prevAvg = prevSessions.length
    ? Math.round(prevSessions.reduce((a, b) => a + (b.confidence_score ?? 0), 0) / prevSessions.length)
    : null;

  const improvement = avgScore !== null && prevAvg !== null ? avgScore - prevAvg : null;

  // Chart bars: last 7 / 30 / 12 buckets
  const buildBars = () => {
    const buckets = range === 'Week' ? 7 : range === 'Month' ? 8 : 12;
    return Array.from({ length: buckets }, (_, i) => {
      const bucketEnd = new Date(now);
      const bucketSize = days / buckets;
      bucketEnd.setDate(bucketEnd.getDate() - (buckets - 1 - i) * bucketSize);
      const bucketStart = new Date(bucketEnd);
      bucketStart.setDate(bucketStart.getDate() - bucketSize);

      const inBucket = sessions.filter((s) => {
        const d = new Date(s.created_at);
        return d >= bucketStart && d < bucketEnd;
      });

      const score = inBucket.length
        ? Math.round(inBucket.reduce((a, b) => a + (b.confidence_score ?? 0), 0) / inBucket.length)
        : 0;

      return { score, label: (i + 1).toString() };
    });
  };

  const bars = buildBars();
  const maxBar = Math.max(...bars.map(b => b.score), 1);

  const recentSessions = [...sessions].slice(0, 5);

  return (
    <div className="inner-page">
      <div className="inner-page-header">
        <h1 className="inner-page-title">Progress</h1>
      </div>

      {/* Performance trend card */}
      <div className="page-card progress-trend-card">
        <div className="trend-top">
          <div>
            <p className="section-label">Performance Trend</p>
            <div className="trend-score">
              {avgScore !== null ? (
                <>
                  <span className="trend-score-num">{avgScore}</span>
                  <span className="trend-score-label">/100 avg</span>
                  {improvement !== null && (
                    <span className={`trend-badge ${improvement >= 0 ? 'up' : 'down'}`}>
                      {improvement >= 0 ? '+' : ''}{improvement} vs prev {range.toLowerCase()}
                    </span>
                  )}
                </>
              ) : (
                <span className="trend-score-label">No data yet</span>
              )}
            </div>
          </div>
          <div className="tabs" style={{ margin: 0 }}>
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                className={`tab-btn ${range === r ? 'active' : ''}`}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="bar-chart">
          {bars.map((bar, i) => (
            <div key={i} className="bar-col">
              <div
                className="bar"
                style={{ height: `${(bar.score / maxBar) * 100}%` }}
                title={`${bar.score}/100`}
              />
              <span className="bar-label">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="progress-stats-row">
        <div className="stat-block">
          <p className="stat-num">{filteredSessions.length}</p>
          <p className="stat-desc">Sessions this {range.toLowerCase()}</p>
        </div>
        <div className="stat-block">
          <p className="stat-num">{avgScore ?? '-'}</p>
          <p className="stat-desc">Avg score</p>
        </div>
        {improvement !== null && (
          <div className="stat-block">
            <p className={`stat-num ${improvement >= 0 ? 'stat-positive' : 'stat-negative'}`}>
              {improvement >= 0 ? '+' : ''}{improvement}
            </p>
            <p className="stat-desc">vs last {range.toLowerCase()}</p>
          </div>
        )}
      </div>

      {/* Recent sessions */}
      <div className="progress-recent-header">
        <p className="section-label" style={{ marginBottom: 0 }}>Recent Sessions</p>
        <button className="btn-link" onClick={() => navigate(ROUTES.ALL_SESSIONS ?? '/sessions')}>
          View All
        </button>
      </div>

      {isLoading && <div className="page-loading">Loading…</div>}

      {!isLoading && recentSessions.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p className="empty-title">No sessions yet</p>
          <p className="empty-desc">Start practicing to track your progress.</p>
        </div>
      )}

      <div className="sessions-list">
        {recentSessions.map((s) => {
          const score = s.confidence_score ?? 0;
          const tier = getScoreTier(score);
          return (
            <div
              key={s.id}
              className="session-row"
              onClick={() => navigate(buildRoute.sessionDetail(s.id))}
            >
              <div className="session-row-info">
                <p className="session-row-text">
                  {s.target_text?.slice(0, 60) || 'Practice session'}
                </p>
                <p className="session-row-date">{formatDate(s.created_at)}</p>
              </div>
              <span
                className="score-badge"
                style={{ background: tier.color + '22', color: tier.color }}
              >
                {score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProgressPage;
