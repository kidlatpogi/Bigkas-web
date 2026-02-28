import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import './FrameworksPage.css';

/* ─── Lazy-load the framework data ─────────────────────────────────────────── */
let frameworkCache = null;
async function loadFrameworks() {
  if (frameworkCache) return frameworkCache;
  const mod = await import('../../assets/framework.json');
  const raw = mod.default;
  frameworkCache = Array.isArray(raw) ? raw : Object.values(raw);
  return frameworkCache;
}

/* ─── Icons ─────────────────────────────────────────────────────────────────── */
function IconClose() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconExternal() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/* ─── Framework Card ────────────────────────────────────────────────────────── */
function FrameworkCard({ framework, onWatch }) {
  return (
    <div className="fw-card">
      <div className="fw-card-header">
        <span className="fw-card-id">{framework.id}</span>
      </div>
      <h3 className="fw-card-name">{framework.name}</h3>
      <p className="fw-card-summary">{framework.summary}</p>
      <p className="fw-card-usage">
        <span className="fw-usage-label">BEST FOR: </span>
        {framework.usage_scenario}
      </p>
      <div className="fw-steps">
        {framework.steps.map((step, i) => (
          <div key={i} className="fw-step-pill">
            <span className="fw-step-num">{i + 1}</span>
            <span className="fw-step-text">{step}</span>
          </div>
        ))}
      </div>
      <button
        className="fw-watch-btn"
        onClick={() => onWatch(framework)}
        aria-label={`Watch and learn the ${framework.name}`}
      >
        <IconPlay />
        Watch &amp; Learn
      </button>
    </div>
  );
}

/* ─── Video Modal ───────────────────────────────────────────────────────────── */
function FrameworkModal({ framework, onClose }) {
  const hasVideo = Boolean(framework.youtubeId);

  /* Trap focus / close on Escape */
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fw-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Learn ${framework.name}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="fw-modal">
        {/* Header */}
        <div className="fw-modal-header">
          <div>
            <span className="fw-modal-id">{framework.id}</span>
            <h2 className="fw-modal-title">{framework.name}</h2>
          </div>
          <button className="fw-modal-close" onClick={onClose} aria-label="Close modal">
            <IconClose />
          </button>
        </div>

        {/* Video embed */}
        {hasVideo ? (
          <div className="fw-video-wrapper">
            <iframe
              className="fw-video"
              src={`https://www.youtube.com/embed/${framework.youtubeId}?rel=0&modestbranding=1`}
              title={`${framework.name} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="fw-video-placeholder">
            <span className="fw-video-placeholder-text">No video available for this framework yet.</span>
          </div>
        )}

        {/* Description */}
        <p className="fw-modal-summary">{framework.summary}</p>

        {/* Steps */}
        <div className="fw-modal-steps">
          <p className="fw-modal-steps-label">THE FRAMEWORK STEPS</p>
          {framework.steps.map((step, i) => (
            <div key={i} className="fw-modal-step-row">
              <span className="fw-modal-step-num">{i + 1}</span>
              <span className="fw-modal-step-text">{step}</span>
            </div>
          ))}
        </div>

        {/* Study link */}
        {framework.studyLink && framework.studyLink !== '...' && (
          <a
            className="fw-modal-study-link"
            href={framework.studyLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read full guide <IconExternal />
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function FrameworksPage() {
  const navigate = useNavigate();
  const [frameworks, setFrameworks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    loadFrameworks().then((data) => {
      setFrameworks(data);
      setIsLoading(false);
    });
  }, []);

  const handleWatch = useCallback((fw) => setActiveModal(fw), []);
  const handleClose = useCallback(() => setActiveModal(null), []);

  return (
    <div className="fw-page">
      {/* Header */}
      <div className="fw-header">
        <BackButton onClick={() => navigate(-1)} />
        <div className="fw-header-text">
          <h1 className="fw-page-title">Training Hub</h1>
          <p className="fw-page-sub">Master proven speech frameworks</p>
        </div>
      </div>

      {/* Framework grid */}
      {isLoading ? (
        <div className="fw-loading" aria-label="Loading frameworks">
          <div className="fw-spinner" />
        </div>
      ) : (
        <div className="fw-grid">
          {frameworks.map((fw) => (
            <FrameworkCard key={fw.id} framework={fw} onWatch={handleWatch} />
          ))}
        </div>
      )}

      {/* Video modal */}
      {activeModal && (
        <FrameworkModal framework={activeModal} onClose={handleClose} />
      )}
    </div>
  );
}
