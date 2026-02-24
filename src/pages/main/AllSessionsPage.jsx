import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '../../context/useSessionContext';
import { buildRoute, getScoreTier } from '../../utils/constants';
import { formatDate, formatDuration } from '../../utils/formatters';
import BackButton from '../../components/common/BackButton';
import FilterTabs from '../../components/common/FilterTabs';
import './InnerPages.css';

const FILTER_TABS = [
  { label: 'All',        value: 'All' },
  { label: 'Today',      value: 'Today' },
  { label: 'This Week',  value: 'This Week' },
  { label: 'This Month', value: 'This Month' },
];

function AllSessionsPage() {
  const navigate = useNavigate();
  const { sessions, fetchSessions, loadMoreSessions, isLoading, hasMore } = useSessionContext();
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchSessions(1, true);
  }, [fetchSessions]);

  const filterSession = (s) => {
    const d = new Date(s.created_at);
    const now = new Date();
    if (filter === 'Today') {
      return d.toDateString() === now.toDateString();
    }
    if (filter === 'This Week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    if (filter === 'This Month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const filtered = sessions.filter(filterSession);

  return (
    <div className="inner-page">
      <div className="inner-page-header">
        <BackButton />
        <h1 className="inner-page-title">All Sessions</h1>
      </div>

      {/* Filter tabs */}
      <FilterTabs
        tabs={FILTER_TABS}
        active={filter}
        onChange={setFilter}
      />

      {isLoading && sessions.length === 0 && (
        <div className="page-loading">Loading…</div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p className="empty-title">No sessions</p>
          <p className="empty-desc">No sessions found for the selected period.</p>
        </div>
      )}

      <div className="sessions-list">
        {filtered.map((s) => {
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
                  {s.target_text?.slice(0, 70) || 'Practice session'}
                </p>
                <p className="session-row-date">
                  {formatDate(s.created_at)}
                  {s.duration_sec ? ` · ${formatDuration(s.duration_sec)}` : ''}
                </p>
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

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            className="btn-secondary"
            onClick={loadMoreSessions}
            disabled={isLoading}
            style={{ width: 'auto', padding: '10px 28px' }}
          >
            {isLoading ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

export default AllSessionsPage;
