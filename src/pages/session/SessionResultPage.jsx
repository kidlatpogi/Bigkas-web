import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSessionContext } from '../../context/useSessionContext';
import { getScoreTier, buildRoute, ROUTES } from '../../utils/constants';
import { formatDate, formatDuration } from '../../utils/formatters';
import BackButton from '../../components/common/BackButton';
import '../main/InnerPages.css';
import './SessionPages.css';

function getSessionModeLabel(session) {
  const raw = String(
    session?.session_mode
    ?? session?.mode
    ?? session?.session_type
    ?? session?.script_type
    ?? '',
  ).toLowerCase();

  if (raw.includes('practice')) return 'Practice';
  if (raw.includes('train')) return 'Training';
  if (raw.includes('free') || raw.includes('script') || raw.includes('ai') || raw.includes('self')) return 'Training';
  return 'Training';
}

function SessionResultPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { state } = useLocation();
  const { currentSession, fetchSessionById, isLoading } = useSessionContext();

  useEffect(() => {
    if (state) return;
    fetchSessionById(sessionId);
  }, [fetchSessionById, sessionId, state]);

  const result = useMemo(() => {
    if (state) return state;
    if (String(currentSession?.id || '') === String(sessionId || '')) {
      return currentSession;
    }
    return null;
  }, [currentSession, sessionId, state]);

  const [isSessionInfoOpen, setIsSessionInfoOpen] = useState(true);

  if (!result && isLoading) {
    return <div className="inner-page"><div className="page-loading">Loading...</div></div>;
  }

  if (!result) {
    return (
      <div className="inner-page">
        <div className="empty-state">
          <span className="empty-icon">&#9888;&#65039;</span>
          <p className="empty-title">Session not found</p>
          <button className="btn-primary" onClick={() => navigate(ROUTES.DASHBOARD)}>Go Home</button>
        </div>
      </div>
    );
  }

  const score  = result.confidence_score ?? 0;
  const tier   = getScoreTier(score);
  const scoreDisplay = Number.isInteger(score) ? `${score}` : Number(score).toFixed(2);

  const durationSec = result.duration_sec ?? 0;
  const recommendations = Array.isArray(result.recommendations) ? result.recommendations : [];
  const modeLabel = getSessionModeLabel(result);
  const practicedText = result.target_text || result.transcript || 'No recorded text available.';
  const audioUrl = result.audio_url || null;
  const videoUrl = result.video_url || result.video_storage_url || null;

  const pillars = [
    { key: 'facial', label: 'Facial Expression', value: result.facial_expression_score },
    { key: 'gesture', label: 'Gestures', value: result.gesture_score },
    { key: 'jitter', label: 'Jitter', value: result.jitter_score },
    { key: 'shimmer', label: 'Shimmer', value: result.shimmer_score },
    { key: 'pronunciation', label: 'Pronunciation', value: result.pronunciation_score },
  ].map((p) => {
    const scoreVal = Number.isFinite(p.value) ? p.value : 0;
    return { ...p, score: Math.max(0, Math.min(100, Math.round(scoreVal))) };
  });

  const pillarColors = {
    facial: '#21C26A',
    gesture: '#15B8A6',
    jitter: '#FCBA04',
    shimmer: '#F59E0B',
    pronunciation: '#EF4444',
  };

  return (
    <div className="inner-page">
      {/* Header */}
      <div className="inner-page-header centered-header">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="inner-page-title">Analysis Result</h1>
      </div>

      {/* Overall score */}
      <div className="page-card result-hero-card">
        <p className="result-hero-kicker">Speaking Confidence Score</p>
        <div className="result-hero-score-row">
          <p className="result-hero-score">
            {scoreDisplay}
            <span>/100</span>
          </p>
          <span className="result-hero-tier" style={{ background: `${tier.color}1A`, color: tier.color }}>
            {tier.label}
          </span>
        </div>
        <div className="result-hero-track">
          <div
            className="result-hero-track-fill"
            style={{ width: `${Math.max(0, Math.min(100, Number(score) || 0))}%`, background: tier.color }}
          />
        </div>
        <p className="result-summary">
          {score >= 85 ? 'Outstanding! Your speech was clear and fluent.'
          : score >= 65 ? 'Good job! A few areas to polish for even better results.'
          : score >= 45 ? 'Keep going! Regular practice will push your score higher.'
          : 'Don\'t give up. Every session makes you stronger.'}
        </p>
      </div>

      {/* Five scoring pillars */}
      <div className="page-card result-pillars-card" style={{ marginBottom: 16 }}>
        <p className="section-label" style={{ marginBottom: 10 }}>Scoring Pillars</p>
        {pillars.map((p) => {
          const color = pillarColors[p.key] || '#FCBA04';
          return (
            <div key={p.key} className="result-pillar-item">
              <div className="metric-card-top result-pillar-head" style={{ marginBottom: 6 }}>
                <span className="metric-label" style={{ fontSize: 14 }}>{p.label}</span>
                <span className="score-badge result-pillar-score" style={{ background: `${color}1F`, color }}>
                  {p.score}/100
                </span>
              </div>
              <div className="progress-track result-pillar-track" style={{ marginBottom: 0 }}>
                <div className="progress-track-fill" style={{ width: `${p.score}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>

      {recommendations.length > 0 && (
        <div className="page-card" style={{ marginBottom: 16 }}>
          <p className="section-label" style={{ marginBottom: 8 }}>Recommendations</p>
          {recommendations.map((text, idx) => (
            <p key={`${text}-${idx}`} style={{ margin: '0 0 8px', color: '#555', fontSize: 14 }}>
              {idx + 1}. {text}
            </p>
          ))}
        </div>
      )}

      {(audioUrl || videoUrl) && (
        <div className="page-card" style={{ marginBottom: 16 }}>
          <p className="section-label" style={{ marginBottom: 10 }}>Session Recordings</p>
          {videoUrl ? (
            <div className="session-video-wrap" style={{ marginBottom: audioUrl ? 10 : 0 }}>
              <video className="session-video" controls preload="metadata" src={videoUrl}>
                Your browser does not support video playback.
              </video>
            </div>
          ) : null}
          {audioUrl ? (
            <audio className="session-audio" controls preload="metadata" src={audioUrl}>
              Your browser does not support audio playback.
            </audio>
          ) : null}
        </div>
      )}

      {/* Extra session information */}
      <div className="page-card" style={{ marginBottom: 16 }}>
        <button
          className="result-collapse-toggle"
          onClick={() => setIsSessionInfoOpen((open) => !open)}
          type="button"
          aria-expanded={isSessionInfoOpen}
          aria-controls="session-information-body"
        >
          <span className="section-label" style={{ marginBottom: 0 }}>Session Information</span>
          <span className={`result-collapse-chevron${isSessionInfoOpen ? ' open' : ''}`}>▼</span>
        </button>

        {isSessionInfoOpen && (
          <div id="session-information-body" className="result-collapse-body">
            {result.created_at && (
              <div className="info-row">
                <span className="info-row-key">Date</span>
                <span className="info-row-val">{formatDate(result.created_at)}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-row-key">Duration</span>
              <span className="info-row-val">{formatDuration(durationSec || 0)}</span>
            </div>
            <div className="info-row">
              <span className="info-row-key">Mode</span>
              <span className="info-row-val">{modeLabel}</span>
            </div>
            <div className="info-row" style={{ borderBottom: 'none' }}>
              <span className="info-row-key">Difficulty</span>
              <span className="info-row-val" style={{ textTransform: 'capitalize' }}>
                {result?.difficulty ? String(result.difficulty) : 'N/A'}
              </span>
            </div>

            <p className="detail-section-title" style={{ marginTop: 14 }}>Practiced Text</p>
            <p className="practiced-text">{practicedText}</p>
          </div>
        )}
      </div>

      {/* View detailed feedback row */}
      <div
        className="view-feedback-row"
        onClick={() => navigate(buildRoute.detailedFeedback(sessionId), { state: result })}
      >
        <span className="view-feedback-label">View Detailed Feedback</span>
        <span className="view-feedback-arrow">›</span>
      </div>

      {/* Actions */}
      <div className="btn-row" style={{ marginTop: 24 }}>
        <button className="btn-secondary" onClick={() => navigate(ROUTES.DASHBOARD)}>
          Back to Dashboard
        </button>
        <button className="btn-primary" onClick={() => navigate(ROUTES.TRAINING_SETUP)}>
          Practice Again
        </button>
      </div>
    </div>
  );
}

export default SessionResultPage;

