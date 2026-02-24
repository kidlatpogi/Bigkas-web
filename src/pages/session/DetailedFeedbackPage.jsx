import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSessionContext } from '../../context/useSessionContext';
import { ROUTES, getScoreTier } from '../../utils/constants';
import '../main/InnerPages.css';
import './SessionPages.css';

function DetailedFeedbackPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { state: locationState } = useLocation();
  const { currentSession, fetchSessionById, isLoading } = useSessionContext();

  const session = locationState || currentSession;

  useEffect(() => {
    if (!session) {
      fetchSessionById(sessionId);
    }
  }, [sessionId, session, fetchSessionById]);

  const score = session?.confidence_score ?? 0;

  // All useMemo hooks must be called before any early return
  const metrics = useMemo(() => [
    {
      label: 'Eye Contact',
      score: session?.eye_contact_score ?? Math.min(100, Math.round(score * 0.92)),
      note:  'Maintaining steady eye contact improves audience engagement.',
    },
    {
      label: 'Body Gestures',
      score: session?.gesture_score ?? Math.min(100, Math.round(score * 0.87)),
      note:  'Natural gestures reinforce your spoken message.',
    },
    {
      label: 'Voice Quality',
      score: session?.acoustic_score ?? score,
      note:  'Consistent volume and clarity make your speech compelling.',
    },
  ], [session?.eye_contact_score, session?.gesture_score, session?.acoustic_score, score]);

  const buckets = 16;
  const bars = useMemo(() => {
    return Array.from({ length: buckets }, (__, idx) => {
      const variation = ((idx * 17 + score * 3) % 20) - 10;
      return Math.max(10, Math.min(100, Math.round(score + variation)));
    });
  }, [score]);

  const feedbackItems = useMemo(() => [
    { sec: 12, score: Math.min(100, Math.round(score * 0.95)) },
    { sec: 28, score: Math.min(100, Math.round(score * 0.88)) },
    { sec: 45, score: Math.min(100, Math.round(score * 1.05)) },
    { sec: 67, score: Math.min(100, Math.round(score * 0.80)) },
  ], [score]);

  if (isLoading && !session) {
    return <div className="inner-page"><div className="page-loading">Loading…</div></div>;
  }

  if (!session) {
    return (
      <div className="inner-page">
        <div className="empty-state">
          <span className="empty-icon">⚠️</span>
          <p className="empty-title">Session not found</p>
          <button className="btn-primary" onClick={() => navigate(ROUTES.DASHBOARD)}>Go Home</button>
        </div>
      </div>
    );
  }

  const maxBar = Math.max(...bars);
  const durationSec = session.duration_sec ?? 30;

  const formatMinSec = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="inner-page">
      {/* Header */}
      <div className="inner-page-header">
        <button className="inner-page-back" onClick={() => navigate(-1)}>‹</button>
        <h1 className="inner-page-title">Detailed Feedback</h1>
      </div>

      {/* Performance flow chart */}
      <div className="page-card">
        <p className="section-label">Performance Flow</p>
        <div className="flow-chart">
          {bars.map((b, i) => (
            <div key={i} className="flow-bar-col">
              <div
                className="flow-bar"
                style={{
                  height: `${(b / maxBar) * 100}%`,
                  background: b >= 65 ? '#34C759' : b >= 45 ? '#FBAF00' : '#FF3B30',
                }}
                title={`${b}/100`}
              />
            </div>
          ))}
        </div>
        <div className="flow-legend">
          <span className="legend-dot green" /> <span>Good</span>
          <span className="legend-dot yellow" /> <span>Fair</span>
          <span className="legend-dot red" /> <span>Needs Work</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>
            Duration: {formatMinSec(durationSec)}
          </span>
        </div>
      </div>

      {/* Metric cards */}
      {metrics.map((m) => {
        const t = getScoreTier(m.score);
        return (
          <div key={m.label} className="page-card metric-card">
            <div className="metric-card-top">
              <span className="metric-label">{m.label}</span>
              <span
                className="score-badge"
                style={{ background: t.color + '22', color: t.color }}
              >
                {m.score}/100
              </span>
            </div>
            {/* Progress track */}
            <div className="progress-track">
              <div
                className="progress-track-fill"
                style={{ width: `${m.score}%`, background: t.color }}
              />
            </div>
            <p className="metric-note">{m.note}</p>
          </div>
        );
      })}

      {/* Timestamped feedback list (simulated) */}
      <p className="section-label">Timestamped Feedback</p>
      {feedbackItems.map(({ sec, score: s }) => {
        const t = getScoreTier(s);
        return (
          <div key={sec} className="feedback-item" style={{ borderLeftColor: t.color }}>
            <span className="feedback-time">{formatMinSec(sec)}</span>
            <p className="feedback-text">
              {s >= 65
                ? 'Good pacing and clear articulation at this point.'
                : s >= 45
                ? 'Slight hesitation detected. Try to maintain your rhythm.'
                : 'Noticeable disfluency. Slow down and breathe.'}
            </p>
          </div>
        );
      })}

      {/* Actions */}
      <div className="btn-row" style={{ marginTop: 32 }}>
        <button className="btn-secondary" onClick={() => navigate(ROUTES.TRAINING_SETUP)}>
          Train Again
        </button>
        <button className="btn-primary" onClick={() => navigate(ROUTES.DASHBOARD)}>
          Go Home
        </button>
      </div>
    </div>
  );
}

export default DetailedFeedbackPage;
