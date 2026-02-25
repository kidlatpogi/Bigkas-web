import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getScoreTier, buildRoute, ROUTES } from '../../utils/constants';
import { formatDuration } from '../../utils/formatters';
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

  // Derived metrics
  const acousticScore  = result.acoustic_score  ?? Math.round(score * 0.95);
  const wpm            = result.wpm             ?? 120;
  const durationSec    = result.duration_sec    ?? 0;

  // Simulated pitch bars
  const pitchBars = Array.from({ length: 20 }, (_, index) => {
    const variance = (Math.sin((index + 1) * (score + 17)) + 1) / 2; // 0..1 deterministic
    return Math.max(12, Math.round((score / 100) * 48 * (0.6 + variance * 0.6)));
  });

  const pitchTier = getScoreTier(acousticScore);
  const paceTier  = wpm >= 120 && wpm <= 160 ? { label: 'Good', color: '#34C759' }
                  : { label: 'Needs Work', color: '#FF9500' };

  return (
    <div className="inner-page">
      {/* Header */}
      <div className="inner-page-header">
        <button className="inner-page-back" onClick={() => navigate(-1)}>‹</button>
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

      {/* Pitch stability card */}
      <div className="page-card" style={{ marginBottom: 16 }}>
        <div className="metric-card-top">
          <span className="metric-label">Pitch Stability</span>
          <span className="score-badge" style={{ background: pitchTier.color + '22', color: pitchTier.color }}>
            {pitchTier.label}
          </span>
        </div>
        <div className="pitch-bars">
          {pitchBars.map((h, i) => (
            <div key={i} className="pitch-bar" style={{ height: h, background: pitchTier.color }} />
          ))}
        </div>
      </div>

      {/* Speaking pace card */}
      <div className="page-card" style={{ marginBottom: 16 }}>
        <div className="metric-card-top">
          <span className="metric-label">Speaking Pace</span>
          <span className="score-badge" style={{ background: paceTier.color + '22', color: paceTier.color }}>
            {paceTier.label}
          </span>
        </div>
        <p style={{ fontSize: 24, fontWeight: 800, color: '#010101', margin: '6px 0 4px' }}>
          {wpm} <span style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>wpm</span>
        </p>
        <div className="progress-track" style={{ margin: '6px 0' }}>
          <div
            className="progress-track-fill"
            style={{ width: `${Math.min(100, (wpm / 180) * 100)}%`, background: paceTier.color }}
          />
        </div>
        <p style={{ fontSize: 12, color: '#888', margin: 0 }}>Ideal range: 120–160 wpm</p>
      </div>

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

