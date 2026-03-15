import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionContext } from '../../context/useSessionContext';
import { formatDate, formatDuration } from '../../utils/formatters';
import { buildRoute, getScoreTier, ROUTES } from '../../utils/constants';
import BackButton from '../../components/common/BackButton';
import '../main/InnerPages.css';
import './SessionPages.css';

function SessionDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { currentSession, fetchSessionById, isLoading, error } = useSessionContext();

  useEffect(() => {
    if (sessionId) fetchSessionById(sessionId);
  }, [sessionId, fetchSessionById]);

  if (isLoading) {
    return <div className="inner-page"><div className="page-loading">Loading session…</div></div>;
  }

  if (error || !currentSession) {
    return (
      <div className="inner-page">
        <div className="empty-state">
          <span className="empty-icon">⚠️</span>
          <p className="empty-title">Session not found</p>
          <button className="btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const s     = currentSession;
  const score = s.confidence_score ?? 0;
  const tier  = getScoreTier(score);
  const durationSec = s.duration_sec ?? s.duration;

  return (
    <div className="inner-page">
      {/* Header */}
      <div className="inner-page-header">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="inner-page-title">Session Detail</h1>
      </div>

      {/* Score card */}
      <div className="page-card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div
          className="score-circle"
          style={{ borderColor: tier.color }}
        >
          <span className="score-circle-num">{score}</span>
          <span className="score-circle-label">/100</span>
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: tier.color, margin: '6px 0 0' }}>
          {tier.label}
        </p>
      </div>

      {/* Practiced text */}
      <div className="page-card" style={{ marginBottom: 16 }}>
        <p className="detail-section-title">Practiced Text</p>
        <p className="practiced-text">{s.target_text || 'No text recorded.'}</p>
      </div>

      {/* Session info */}
      <div className="page-card" style={{ marginBottom: 16 }}>
        <p className="detail-section-title">Session Info</p>
        <div className="info-row">
          <span className="info-row-key">Date</span>
          <span className="info-row-val">{formatDate(s.created_at)}</span>
        </div>
        {durationSec != null && (
          <div className="info-row">
            <span className="info-row-key">Duration</span>
            <span className="info-row-val">{formatDuration(durationSec)}</span>
          </div>
        )}
        {s.script_type && (
          <div className="info-row">
            <span className="info-row-key">Type</span>
            <span className="info-row-val" style={{ textTransform: 'capitalize' }}>{s.script_type}</span>
          </div>
        )}
        {s.difficulty && (
          <div className="info-row">
            <span className="info-row-key">Difficulty</span>
            <span className="info-row-val" style={{ textTransform: 'capitalize' }}>{s.difficulty}</span>
          </div>
        )}
      </div>

      {/* Feedback card */}
      {s.feedback && (
        <div className="page-card" style={{ marginBottom: 16 }}>
          <p className="detail-section-title">Feedback</p>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: 0 }}>{s.feedback}</p>
        </div>
      )}

      {/* View detailed feedback link */}
      <div
        className="view-feedback-row"
        onClick={() => navigate(buildRoute.detailedFeedback(sessionId), { state: s })}
      >
        <span className="view-feedback-label">View Detailed Feedback</span>
        <span className="view-feedback-arrow">›</span>
      </div>

      {/* Actions */}
      <div className="btn-row" style={{ marginTop: 24 }}>
        <button className="btn-secondary" onClick={() => navigate(ROUTES.TRAINING_SETUP)}>
          Practice Again
        </button>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    </div>
  );
}

export default SessionDetailPage;
