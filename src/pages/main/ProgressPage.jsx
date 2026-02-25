import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '../../context/useSessionContext';
import { ROUTES, buildRoute, getScoreTier } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import './InnerPages.css';
import './ProgressPage.css';

const TIME_RANGES = ['Week', 'Month', 'Year'];
const CHART_WIDTH = 1000;
const CHART_HEIGHT = 210;
const CHART_LEFT = 70;
const CHART_RIGHT = 930;
const CHART_TOP = 28;
const CHART_BASELINE = 150;
const CHART_LABEL_Y = 188;

function ProgressPage() {
  const navigate = useNavigate();
  const { sessions, fetchSessions, isLoading } = useSessionContext();

  const [range, setRange] = useState('Week');

  useEffect(() => {
    fetchSessions(1, true);
  }, [fetchSessions]);

  const hasAnySessions = sessions.length > 0;

  const chartData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (range === 'Week') {
      const now = new Date();
      const result = [];
      for (let i = 6; i >= 0; i -= 1) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        day.setHours(0, 0, 0, 0);

        const daySessions = sessions.filter((session) => {
          const sessionDate = new Date(session.created_at);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === day.getTime();
        });

        const avg = daySessions.length > 0
          ? Math.round(daySessions.reduce((sum, session) => sum + (session.confidence_score ?? 0), 0) / daySessions.length)
          : 0;

        result.push({ label: dayNames[day.getDay()], value: avg });
      }
      return result;
    }

    if (range === 'Month') {
      const now = new Date();
      const result = [];
      for (let week = 3; week >= 0; week -= 1) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - week * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);
        weekEnd.setHours(23, 59, 59, 999);

        const weekSessions = sessions.filter((session) => {
          const sessionDate = new Date(session.created_at);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        });

        const avg = weekSessions.length > 0
          ? Math.round(weekSessions.reduce((sum, session) => sum + (session.confidence_score ?? 0), 0) / weekSessions.length)
          : 0;

        result.push({ label: `Wk${4 - week}`, value: avg });
      }
      return result;
    }

    const now = new Date();
    const result = [];
    for (let monthOffset = 11; monthOffset >= 0; monthOffset -= 1) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthSessions = sessions.filter((session) => {
        const sessionDate = new Date(session.created_at);
        return sessionDate >= monthStart && sessionDate <= monthEnd;
      });

      const avg = monthSessions.length > 0
        ? Math.round(monthSessions.reduce((sum, session) => sum + (session.confidence_score ?? 0), 0) / monthSessions.length)
        : 0;

      result.push({ label: monthNames[monthStart.getMonth()], value: avg });
    }

    return result;
  }, [range, sessions]);

  const chartPoints = useMemo(() => {
    if (!chartData.length) return [];

    const values = chartData.map((point) => (Number.isFinite(point.value) ? point.value : 0));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const rangeValue = maxValue - minValue;
    const flatLineY = CHART_BASELINE;

    return chartData.map((point, index) => {
      const x = chartData.length > 1
        ? CHART_LEFT + (index * (CHART_RIGHT - CHART_LEFT)) / (chartData.length - 1)
        : (CHART_LEFT + CHART_RIGHT) / 2;
      const y = rangeValue === 0
        ? flatLineY
        : CHART_TOP + (1 - (point.value - minValue) / rangeValue) * (CHART_BASELINE - CHART_TOP);
      return { ...point, x, y };
    });
  }, [chartData]);

  const polylinePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(' ');

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

  const performanceScore = avgScore ?? 0;

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

  const recentSessions = [...sessions].slice(0, 5);

  return (
    <div className="inner-page">
      <div className="inner-page-header">
        <h1 className="inner-page-title">Progress</h1>
      </div>

      {/* Performance trend card */}
      <div className="page-card progress-trend-card">
        <div className="progress-chart-header">
          <h2 className="progress-chart-title">Daily Progress</h2>
          <div className="progress-range-selector">
            {TIME_RANGES.map((timeRange) => (
              <button
                key={timeRange}
                className={`progress-range-btn${range === timeRange ? ' active' : ''}`}
                onClick={() => setRange(timeRange)}
              >
                {timeRange.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="trend-score-row">
          <span className="trend-score-num">{performanceScore}%</span>
          {improvement !== null ? (
            <span className={`trend-badge ${improvement >= 0 ? 'up' : 'down'}`}>
              {improvement >= 0 ? '+' : ''}{improvement}%
            </span>
          ) : (
            <span className="trend-score-label">No trend data yet</span>
          )}
        </div>

        <div className="progress-line-chart">
          <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="xMidYMid meet" className="progress-svg" role="img" aria-label="Progress chart">
            <line x1={CHART_LEFT} y1={CHART_BASELINE} x2={CHART_RIGHT} y2={CHART_BASELINE} className="progress-baseline" />
            <polyline points={polylinePoints} className="progress-polyline" />
            {chartPoints.map((point) => (
              <g key={point.label}>
                <circle cx={point.x} cy={point.y} r="9" className="progress-point" />
                <text x={point.x} y={CHART_LABEL_Y} textAnchor="middle" className="progress-label">{point.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Stats row */}
      <div className="progress-stats-row">
        <div className="stat-block">
          <p className={`stat-num${!hasAnySessions ? ' stat-primary' : ''}`}>{hasAnySessions ? filteredSessions.length : 0}</p>
          <p className="stat-desc">{hasAnySessions ? `Sessions this ${range.toLowerCase()}` : 'NO DATA YET'}</p>
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
