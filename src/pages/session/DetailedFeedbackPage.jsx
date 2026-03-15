import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSessionContext } from '../../context/useSessionContext';
import { ROUTES } from '../../utils/constants';
import { formatDuration } from '../../utils/formatters';
import BackButton from '../../components/common/BackButton';
import '../main/InnerPages.css';
import './SessionPages.css';

function toPct(value, fallback = 50) {
  const n = Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreWord(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs Work';
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

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
  }, [fetchSessionById, session, sessionId]);

  const durationSec = Math.max(1, Math.round(session?.duration_sec ?? session?.duration ?? 1));
  const total = toPct(session?.confidence_score ?? session?.score, 0);

  const categories = useMemo(() => {
    return [
      {
        id: 'facial',
        label: 'Facial Expression',
        score: toPct(session?.facial_expression_score ?? session?.eye_contact_score, total),
        color: '#21C26A',
      },
      {
        id: 'gesture',
        label: 'Gestures',
        score: toPct(session?.gesture_score ?? session?.visual_score, total),
        color: '#15B8A6',
      },
      {
        id: 'jitter',
        label: 'Jitter',
        score: toPct(session?.jitter_score ?? session?.acoustic_score, total),
        color: '#FCBA04',
      },
      {
        id: 'shimmer',
        label: 'Shimmer',
        score: toPct(session?.shimmer_score ?? session?.acoustic_score, total),
        color: '#F59E0B',
      },
      {
        id: 'pronunciation',
        label: 'Pronunciation',
        score: toPct(session?.pronunciation_score ?? session?.acoustic_score ?? total, total),
        color: '#EF4444',
      },
    ];
  }, [session, total]);

  const timelinePoints = useMemo(() => {
    const pointCount = clamp(Math.floor(durationSec / 15) + 1, 4, 8);
    return Array.from({ length: pointCount }, (_, idx) => {
      const progress = pointCount === 1 ? 1 : idx / (pointCount - 1);
      const timeSec = idx === pointCount - 1 ? durationSec : Math.round(durationSec * progress);

      const values = categories.reduce((acc, cat, catIndex) => {
        const variance = 8 + (100 - cat.score) * 0.08;
        const phase = progress * Math.PI * 1.6 + catIndex * 0.75;
        const wave = Math.sin(phase) * variance * 0.5 + Math.cos(phase * 0.7) * variance * 0.25;
        const momentum = (progress - 0.5) * ((cat.score - 50) / 12);
        acc[cat.id] = clamp(Math.round(cat.score + wave + momentum));
        return acc;
      }, {});

      return {
        idx,
        timeSec,
        label: formatDuration(timeSec),
        values,
      };
    });
  }, [categories, durationSec]);

  const timelineFeedback = useMemo(() => {
    const recommendations = Array.isArray(session?.recommendations) ? session.recommendations : [];
    const byPriority = [...categories].sort((a, b) => a.score - b.score);
    const feedbackText = recommendations.length
      ? recommendations
      : byPriority.map((cat) => `Keep practicing your ${cat.label.toLowerCase()} to improve consistency over time.`);

    return feedbackText.slice(0, 5).map((text, idx) => {
      const category = byPriority[idx % byPriority.length];
      const lowPoint = timelinePoints.reduce((minPoint, point) => {
        if (!minPoint) return point;
        return point.values[category.id] < minPoint.values[category.id] ? point : minPoint;
      }, null);

      return {
        key: `${category.id}-${idx}`,
        title: `${category.label} Focus`,
        text,
        time: lowPoint ? formatDuration(lowPoint.timeSec) : '00:00',
        color: category.id,
      };
    });
  }, [categories, session, timelinePoints]);

  if (isLoading && !session) {
    return <div className="inner-page"><div className="page-loading">Loading...</div></div>;
  }

  if (!session) {
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

  return (
    <div className="inner-page feedback-figma-page">
      <div className="inner-page-header centered-header">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="inner-page-title">Detailed Feedback</h1>
      </div>

      <div className="page-card feedback-flow-card">
        <p className="feedback-flow-label">Performance Flow</p>
        <h2 className="feedback-flow-title">Timeline</h2>

        <div className="feedback-timeline">
          {timelinePoints.map((point) => (
            <div key={point.idx} className="feedback-col">
              <div className="feedback-col-bg" />
              <div className="feedback-col-bars">
                {categories.map((cat) => (
                  <div key={`${point.idx}-${cat.id}`} className="feedback-mini-bar-wrap">
                    <div
                      className="feedback-mini-bar"
                      style={{ height: `${point.values[cat.id]}%`, background: cat.color }}
                    />
                  </div>
                ))}
              </div>
              <span className="feedback-time">{point.label}</span>
            </div>
          ))}
        </div>

        <div className="feedback-legend-row">
          {categories.map((cat) => (
            <span key={cat.id} className="feedback-legend">
              <i className="dot" style={{ background: cat.color }} /> {cat.label}
            </span>
          ))}
        </div>
      </div>

      <div className="feedback-metrics-grid">
        {categories.map((cat) => (
          <div key={cat.id} className={`page-card feedback-score-card ${cat.id}`}>
            <p className="feedback-score-title">{cat.label}</p>
            <p className="feedback-score-main">{cat.score}%</p>
            <p className="feedback-score-sub">{scoreWord(cat.score).toUpperCase()}</p>
            <div className="feedback-score-track"><div style={{ width: `${cat.score}%`, background: cat.color }} /></div>
          </div>
        ))}
      </div>

      <div className="feedback-tips-list">
        {timelineFeedback.map((tip) => (
          <div key={tip.title} className={`feedback-tip-card ${tip.color}`}>
            <div className="feedback-tip-top">
              <h3>{tip.title}</h3>
              <span>{tip.time}</span>
            </div>
            <p>{tip.text}</p>
          </div>
        ))}
      </div>

      <div className="page-card" style={{ textAlign: 'center', marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 14, color: '#666' }}>Speaking Confidence Score</p>
        <p style={{ margin: '4px 0 0', fontSize: 34, fontWeight: 800 }}>{total}/100</p>
      </div>

      <div className="btn-row" style={{ marginTop: 8 }}>
        <button className="btn-primary" onClick={() => navigate(ROUTES.TRAINING_SETUP)}>
          Practice Again
        </button>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default DetailedFeedbackPage;
