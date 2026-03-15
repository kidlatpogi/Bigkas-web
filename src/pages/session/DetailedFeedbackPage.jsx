import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSessionContext } from '../../context/useSessionContext';
import { ROUTES } from '../../utils/constants';
import BackButton from '../../components/common/BackButton';
import '../main/InnerPages.css';
import './SessionPages.css';

function toPct(value, fallback = 50) {
  const n = Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreWord(score) {
  if (score >= 85) return 'EXCELLENT';
  if (score >= 70) return 'GOOD';
  if (score >= 50) return 'FAIR';
  return 'NEEDS WORK';
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

  const eye = toPct(session?.facial_expression_score ?? session?.eye_contact_score);
  const gesture = toPct(session?.gesture_score ?? session?.visual_score);
  const voice = toPct(session?.pronunciation_score ?? session?.acoustic_score ?? session?.confidence_score);
  const total = toPct(session?.confidence_score ?? session?.score, 0);

  const timeline = useMemo(() => {
    const e = [Math.max(35, eye - 18), Math.min(95, eye + 7), Math.max(30, eye - 6), Math.min(95, eye + 4)];
    const g = [Math.max(30, gesture - 20), Math.min(95, gesture + 6), Math.max(35, gesture - 12), Math.min(95, gesture + 3)];
    const v = [Math.max(40, voice - 16), Math.min(97, voice + 3), Math.max(42, voice - 5), Math.min(97, voice + 1)];
    return { eye: e, gesture: g, voice: v };
  }, [eye, gesture, voice]);

  const tips = useMemo(() => {
    const sorted = [
      { key: 'eye', score: eye, title: 'Strong Eye Contact', color: 'eye', text: 'Maintain direct eye contact with the camera to build trust and confidence.' },
      { key: 'voice', score: voice, title: 'Confident Vocal Energy', color: 'voice', text: 'Project your voice clearly and keep articulation crisp across key points.' },
      { key: 'gesture', score: gesture, title: 'Effective Hand Gestures', color: 'gesture', text: 'Use open-palmed gestures to emphasize key points naturally.' },
    ].sort((a, b) => b.score - a.score);

    return sorted.map((x, i) => ({ ...x, time: ['0:12', '0:18', '0:31'][i] }));
  }, [eye, gesture, voice]);

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
      <div className="inner-page-header">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="inner-page-title">Detailed Feedback</h1>
      </div>

      <div className="page-card feedback-flow-card">
        <p className="feedback-flow-label">Performance Flow</p>
        <h2 className="feedback-flow-title">Timeline</h2>

        <div className="feedback-timeline">
          {[1, 2, 3, 4].map((minute, i) => (
            <div key={minute} className="feedback-col">
              <div className="feedback-col-bg" />
              <div className="feedback-bar feedback-bar-eye" style={{ height: `${timeline.eye[i]}%` }} />
              <div className="feedback-bar feedback-bar-gesture" style={{ height: `${timeline.gesture[i]}%` }} />
              <div className="feedback-bar feedback-bar-voice" style={{ height: `${timeline.voice[i]}%` }} />
              <span className="feedback-time">{minute}:00</span>
            </div>
          ))}
        </div>

        <div className="feedback-legend-row">
          <span className="feedback-legend"><i className="dot dot-eye" /> EyeContact</span>
          <span className="feedback-legend"><i className="dot dot-gesture" /> Body Gestures</span>
          <span className="feedback-legend"><i className="dot dot-voice" /> Voice</span>
        </div>
      </div>

      <div className="feedback-metrics-grid">
        <div className="page-card feedback-score-card eye">
          <p className="feedback-score-title">EyeContact</p>
          <p className="feedback-score-main">{eye}%</p>
          <p className="feedback-score-sub">MAINTAINED</p>
          <div className="feedback-score-track"><div style={{ width: `${eye}%` }} /></div>
          <p className="feedback-score-note">Focus needs more practice</p>
        </div>

        <div className="page-card feedback-score-card gesture">
          <p className="feedback-score-title">Body Gestures</p>
          <p className="feedback-score-main word">{scoreWord(gesture)}</p>
          <div className="feedback-score-track"><div style={{ width: `${gesture}%` }} /></div>
          <p className="feedback-score-note">Natural hand movements detected</p>
        </div>
      </div>

      <div className="page-card feedback-score-card voice wide">
        <p className="feedback-score-title">Voice</p>
        <p className="feedback-score-main word">{scoreWord(voice)}</p>
        <div className="feedback-score-track"><div style={{ width: `${voice}%` }} /></div>
        <p className="feedback-score-note">Pronunciation and diction are improving</p>
      </div>

      <div className="feedback-tips-list">
        {tips.map((tip) => (
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
