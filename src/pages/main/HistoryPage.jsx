import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSessionContext } from '../../context/useSessionContext';
import { formatDate, formatDuration } from '../../utils/formatters';
import Card from '../../components/common/Card';
import './MainPages.css';

/**
 * History Page Component
 * Shows list of past practice sessions
 */
function HistoryPage() {
  const { sessions, fetchSessions, isLoading, error } = useSessionContext();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="history-page">
      <div className="page-header">
        <h1 className="page-title">Practice History</h1>
        <p className="page-subtitle">Review your past practice sessions</p>
      </div>

      <div className="history-content">
        {isLoading && (
          <div className="loading-state">
            <p>Loading sessions...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && sessions.length === 0 && (
          <Card className="empty-state-card">
            <div className="empty-state">
              <span className="empty-icon">📝</span>
              <h2>No Sessions Yet</h2>
              <p>Start practicing to see your history here</p>
              <Link to="/practice" className="empty-action-link">
                Start Practice
              </Link>
            </div>
          </Card>
        )}

        {sessions.length > 0 && (
          <div className="sessions-list">
            {sessions.map((session) => (
              <Card key={session.id} className="session-card">
                <div className="session-info">
                  <h3 className="session-text">{session.text}</h3>
                  <div className="session-meta">
                    <span className="session-date">
                      {formatDate(session.createdAt)}
                    </span>
                    {session.duration && (
                      <span className="session-duration">
                        {formatDuration(session.duration)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="session-score">
                  {session.score !== undefined && (
                    <span className={`score-badge score-${getScoreLevel(session.score)}`}>
                      {Math.round(session.score)}%
                    </span>
                  )}
                </div>
                <Link 
                  to={`/session/${session.id}`} 
                  className="session-link"
                >
                  View Details →
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Get score level for styling
 */
function getScoreLevel(score) {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export default HistoryPage;
