import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { getScripts } from '../../api/scriptsApi';
import BackButton from '../../components/common/BackButton';
import { ROUTES } from '../../utils/constants';
import './InnerPages.css';
import './TrainingSetupPage.css';

const FOCUS_OPTIONS = [
  { value: 'scripted', label: 'Scripted Accuracy', desc: 'Strict adherence to text for pronunciation. AI will track every word you say.' },
  { value: 'free',     label: 'Free Speech',       desc: 'Impromptu speaking style. Focus on flow, tone, and pacing.' },
];

function TrainingSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [activeTab, setActiveTab]   = useState('pre-written');
  const [scripts, setScripts]       = useState([]);
  const [selectedScript, setSelectedScript] = useState(null);
  const [focus, setFocus]           = useState('scripted');
  const [isLoading, setIsLoading]   = useState(false);
  const [freeTopic, setFreeTopic]   = useState('');
  const [showTopicModal, setShowTopicModal] = useState(false);

  const loadScripts = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const type = activeTab === 'pre-written' ? 'self-authored' : 'auto-generated';
      const { data, error } = await getScripts(user.id, type);
      if (error) throw error;
      setScripts(Array.isArray(data) ? data : []);
      setSelectedScript(null);
    } catch {
      setScripts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    loadScripts();
  }, [loadScripts]);

  const handleStart = () => {
    if (focus === 'free') {
      setShowTopicModal(true);
    } else {
      if (!selectedScript) return;
      navigate(ROUTES.TRAINING, { state: { script: selectedScript, focus } });
    }
  };

  const handleFreeStart = () => {
    navigate(ROUTES.TRAINING, {
      state: { script: selectedScript, focus: 'free', freeTopic },
    });
  };

  return (
    <div className="inner-page training-setup-page">
      <div className="inner-page-header training-setup-header">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="inner-page-title">Training Setup</h1>
      </div>

      {/* Source tabs */}
      <p className="section-label">Select Script Source</p>
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'pre-written' ? 'active' : ''}`}
          onClick={() => setActiveTab('pre-written')}
        >
          Pre-written
        </button>
        <button
          className={`tab-btn ${activeTab === 'auto-generated' ? 'active' : ''}`}
          onClick={() => setActiveTab('auto-generated')}
        >
          Auto-Generated
        </button>
      </div>

      {/* Script selection */}
      {activeTab === 'auto-generated' ? (
        <div className="form-group">
          <button
            className="btn-primary training-generate-btn"
            onClick={() => navigate(ROUTES.GENERATE_SCRIPT)}
          >
            Generate Speech
          </button>
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label" style={focus === 'free' ? { opacity: 0.4 } : {}}>Choose Script</label>
          {isLoading ? (
            <p style={{ color: '#888', fontSize: 14 }}>Loading scripts…</p>
          ) : (
            <select
              className="form-select"
              value={selectedScript?.id || ''}
              disabled={focus === 'free'}
              onChange={(e) => {
                const s = scripts.find(sc => sc.id === e.target.value);
                setSelectedScript(s || null);
              }}
            >
              <option value="">— Select a script —</option>
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>{s.title || 'Untitled Script'}</option>
              ))}
            </select>
          )}
          {!isLoading && scripts.length === 0 && (
            <p className="form-hint">
              No scripts found.{' '}
              <button
                className="btn-link"
                onClick={() => navigate(ROUTES.SCRIPTS)}
              >
                Create one
              </button>
            </p>
          )}
        </div>
      )}

      {/* Selected script preview */}
      {selectedScript && (
        <div className="page-card script-preview-card">
          <p className="script-preview-title">{selectedScript.title}</p>
          <p className="script-preview-content">
            {selectedScript.content?.slice(0, 140)}
            {selectedScript.content?.length > 140 ? '…' : ''}
          </p>
        </div>
      )}

      {/* Focus selection */}
      <p className="section-label" style={{ marginTop: 8 }}>Choose Your Focus</p>
      <div className="focus-options">
        {FOCUS_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`focus-option ${focus === opt.value ? 'selected' : ''}`}
            onClick={() => setFocus(opt.value)}
          >
            <div className="focus-radio-circle">
              {focus === opt.value && <div className="focus-radio-dot" />}
            </div>
            <div className="focus-option-text">
              <p className="focus-label">{opt.label}</p>
              <p className="focus-desc">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="btn-row" style={{ marginTop: 32 }}>
        <button className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
        <button
          className="btn-primary"
          onClick={handleStart}
          disabled={focus === 'scripted' && !selectedScript}
        >
          Start Training
        </button>
      </div>

      {/* Free topic modal */}
      {showTopicModal && (
        <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">What will you speak about?</h2>
            <p className="modal-desc">Enter a topic for your free speech session, or skip to speak freely.</p>
            <div className="form-group">
              <input
                className="form-input"
                placeholder="e.g., My weekend trip"
                value={freeTopic}
                onChange={(e) => setFreeTopic(e.target.value)}
              />
            </div>
            <div className="btn-row">
              <button className="btn-secondary" onClick={handleFreeStart}>Skip</button>
              <button className="btn-primary" onClick={handleFreeStart}>Start</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingSetupPage;
