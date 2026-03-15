import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getScoreTier, buildRoute, ROUTES } from '../../utils/constants';
import { formatDuration } from '../../utils/formatters';
import BackButton from '../../components/common/BackButton';
import '../main/InnerPages.css';
import './SessionPages.css';

function SessionResultPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { state } = useLocation();

  // Result data is passed via navigation state from TrainingPage/analyseAndSave
  const result = state || {};
  const score  = result.confidence_score ?? 0;
  const tier   = getScoreTier(score);

  const durationSec = result.duration_sec ?? 0;
  const recommendations = Array.isArray(result.recommendations) ? result.recommendations : [];

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

  return (
    <div className="inner-page">
      {/* Header */}
      <div className="inner-page-header">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="inner-page-title">Analysis Result</h1>
      </div>

      {/* Overall score */}
      <div className="page-card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div className="score-circle" style={{ borderColor: tier.color }}>
          <span className="score-circle-num">{score}</span>
          <span className="score-circle-label">/100</span>
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: tier.color, margin: '8px 0 4px' }}>
          {tier.label}
        </p>
        <p className="result-summary">
          {score >= 85 ? 'Outstanding! Your speech was clear and fluent.'
          : score >= 65 ? 'Good job! A few areas to polish for even better results.'
          : score >= 45 ? 'Keep going! Regular practice will push your score higher.'
          : 'Don\'t give up. Every session makes you stronger.'}
        </p>
      </div>

      {/* Five scoring pillars */}
      <div className="page-card" style={{ marginBottom: 16 }}>
        <p className="section-label" style={{ marginBottom: 10 }}>Scoring Pillars</p>
        {pillars.map((p) => {
          const t = getScoreTier(p.score);
          return (
            <div key={p.key} style={{ marginBottom: 10 }}>
              <div className="metric-card-top" style={{ marginBottom: 6 }}>
                <span className="metric-label" style={{ fontSize: 14 }}>{p.label}</span>
                <span className="score-badge" style={{ background: t.color + '22', color: t.color }}>
                  {p.score}/100
                </span>
              </div>
              <div className="progress-track" style={{ marginBottom: 0 }}>
                <div className="progress-track-fill" style={{ width: `${p.score}%`, background: t.color }} />
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

      {/* Duration */}
      {durationSec > 0 && (
        <div className="page-card" style={{ marginBottom: 16 }}>
          <div className="info-row" style={{ borderBottom: 'none', padding: 0 }}>
            <span className="info-row-key">Session Duration</span>
            <span className="info-row-val">{formatDuration(durationSec)}</span>
          </div>
        </div>
      )}

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
        <button className="btn-secondary" onClick={() => navigate(ROUTES.TRAINING_SETUP)}>
          Train Again
        </button>
        <button className="btn-primary" onClick={() => navigate(ROUTES.SCRIPTS)}>
          Practice Again
        </button>
      </div>
    </div>
  );
}

export default SessionResultPage;

