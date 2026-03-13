import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '../../context/useSessionContext';
import { buildRoute, getScoreTier, ROUTES } from '../../utils/constants';
import { formatDate, formatDuration } from '../../utils/formatters';
import './InnerPages.css';

function HistoryPage() {
  const navigate = useNavigate();
  const { sessions, fetchSessions, loadMoreSessions, isLoading, hasMore, error } = useSessionContext();

  useEffect(() => {
    fetchSessions(1, true);
  }, [fetchSessions]);

  return (
    <div className="inner-page">
      <div className="inner-page-header">
        <h1 className="inner-page-title">History</h1>
        <span style={{ fontSize: 14, color: '#888' }}>
          {sessions.length > 0 ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      {isLoading && sessions.length === 0 && (
        <div className="page-loading">Loading sessions…</div>
      )}

      {error && !isLoading && (
        <div className="page-error">{error}</div>
      )}

      {!isLoading && !error && sessions.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <p className="empty-title">No sessions yet</p>
          <p className="empty-desc">Start practicing to see your history here.</p>
          <button
            className="btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate(ROUTES.SCRIPTS)}
          >
            Start Practice
          </button>
        </div>
      )}

      <div className="sessions-list">
        {sessions.map((s) => {
          const score = s.confidence_score ?? 0;
          const tier  = getScoreTier(score);
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
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            className="btn-secondary"
            style={{ width: 'auto', padding: '10px 28px' }}
            onClick={loadMoreSessions}
            disabled={isLoading}
          >
            {isLoading ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;

