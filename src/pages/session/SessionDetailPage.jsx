import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSessionContext } from '../../context/useSessionContext';
import { formatDate, formatDuration } from '../../utils/formatters';
import Card from '../../components/common/Card';
import './SessionPages.css';

/**
 * Session Detail Page
 * Shows details of a specific practice session
 */
function SessionDetailPage() {
  const { sessionId } = useParams();
  const { currentSession, fetchSession, isLoading, error } = useSessionContext();

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId, fetchSession]);

  if (isLoading) {
    return (
      <div className="session-page">
        <div className="loading-state">Loading session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-page">
        <div className="error-state">
          <p>{error}</p>
          <Link to="/history" className="back-link">← Back to History</Link>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="session-page">
        <div className="empty-state">
          <p>Session not found</p>
          <Link to="/history" className="back-link">← Back to History</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="session-page">
      <div className="page-header">
        <Link to="/history" className="back-link">← Back to History</Link>
        <h1 className="page-title">Session Details</h1>
      </div>

      <div className="session-details">
        <Card className="session-info-card">
          <h2 className="card-title">Practice Text</h2>
          <p className="session-text-display">{currentSession.text}</p>
          
          <div className="session-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Date</span>
              <span className="meta-value">{formatDate(currentSession.createdAt)}</span>
            </div>
            {currentSession.duration && (
              <div className="meta-item">
                <span className="meta-label">Duration</span>
                <span className="meta-value">{formatDuration(currentSession.duration)}</span>
              </div>
            )}
            {currentSession.score !== undefined && (
              <div className="meta-item">
                <span className="meta-label">Score</span>
                <span className="meta-value score-value">{Math.round(currentSession.score)}%</span>
              </div>
            )}
          </div>
        </Card>

        {currentSession.audioUrl && (
          <Card className="session-audio-card">
            <h2 className="card-title">Your Recording</h2>
            <audio controls src={currentSession.audioUrl} className="session-audio" />
          </Card>
        )}

        <div className="session-actions">
          <Link to={`/session/${sessionId}/result`} className="action-btn action-btn-primary">
            View Analysis Results
          </Link>
          <Link to="/practice" className="action-btn action-btn-secondary">
            Practice Again
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SessionDetailPage;
