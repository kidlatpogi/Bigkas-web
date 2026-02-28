import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { getScripts } from '../../api/scriptsApi';
import BackButton from '../../components/common/BackButton';
import FilterTabs from '../../components/common/FilterTabs';
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

  const [userScripts, setUserScripts]       = useState([]);
  const [selfScripts, setSelfScripts]       = useState([]);
  const [selectedScript, setSelectedScript] = useState(null);
  const [focus, setFocus]                   = useState('scripted');
  const [isLoading, setIsLoading]           = useState(false);
  const [activeTab, setActiveTab]           = useState('self');  // 'self' | 'generated'
  const [freeTopic, setFreeTopic]           = useState('');
  const [showTopicModal, setShowTopicModal] = useState(false);

  /* Load the user’s scripts from Supabase */
  const loadScripts = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [genRes, selfRes] = await Promise.all([
        getScripts(user.id, 'auto-generated'),
        getScripts(user.id, 'self-authored'),
      ]);
      setUserScripts(
        (Array.isArray(genRes.data) ? genRes.data : []).map(s => ({ ...s, type: 'generated' }))
      );
      setSelfScripts(
        (Array.isArray(selfRes.data) ? selfRes.data : []).map(s => ({ ...s, type: 'myScripts' }))
      );
    } catch {
      setUserScripts([]);
      setSelfScripts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadScripts(); }, [loadScripts]);

  /* Apply tab filter — Self-Authored tab shows only user's own scripts (no pre-written) */
  const filteredScripts = useMemo(() => {
    return activeTab === 'generated'
      ? userScripts
      : selfScripts;
  }, [activeTab, userScripts, selfScripts]);

  const noScripts = !isLoading && (
    (activeTab === 'generated' && userScripts.length === 0) ||
    (activeTab === 'self' && selfScripts.length === 0)
  );

  /* Keep selectedScript in sync when tab/filter changes */
  useEffect(() => {
    if (selectedScript && !filteredScripts.find(s => s.id === selectedScript.id)) {
      setSelectedScript(null);
    }
  }, [filteredScripts, selectedScript]);

  /* Reset selection when switching tabs */
  const handleTabChange = (val) => {
    setActiveTab(val);
    setSelectedScript(null);
  };

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

  const noGeneratedScripts = noScripts && activeTab === 'generated';

  return (
    <div className="inner-page training-setup-page">
      <div className="inner-page-header training-setup-header">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="inner-page-title">Training Setup</h1>
      </div>

      {/* Quick-action: generate new speech (always visible) */}
      <button
        className="btn-primary training-generate-btn"
        onClick={() => navigate(ROUTES.GENERATE_SCRIPT)}
      >
        Generate Speech
      </button>

      {/* ── Script selection ── */}
      <p className="section-label" style={{ marginTop: 20 }}>Select Script</p>

      {/* FilterTabs — Self-Authored vs AI Generated */}
      <div style={{ marginBottom: '16px' }}>
        <FilterTabs
          tabs={[
            { label: 'Self-Authored', value: 'self' },
            { label: 'AI Generated',  value: 'generated' },
          ]}
          active={activeTab}
          onChange={handleTabChange}
        />
      </div>

      {/* Script dropdown */}
      <div className="form-group" style={{ marginTop: 12 }}>
        {isLoading ? (
          <p style={{ color: '#888', fontSize: 14 }}>Loading scripts…</p>
        ) : noGeneratedScripts ? (
          <div className="ts-empty-state">
            <p className="ts-empty-text">You haven’t generated any AI scripts yet.</p>
            <button
              className="btn-primary training-generate-btn"
              onClick={() => navigate(ROUTES.GENERATE_SCRIPT)}
            >
              Generate a Speech
            </button>
          </div>
        ) : (
          <select
            className="form-select"
            disabled={focus === 'free'}
            value={selectedScript?.id || ''}
            onChange={(e) => {
              const s = filteredScripts.find(sc => sc.id === e.target.value);
              setSelectedScript(s || null);
            }}
          >
            <option value="">— Select a script —</option>
            {filteredScripts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title || 'Untitled Script'}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Selected script preview */}
      {selectedScript && (
        <div className="page-card script-preview-card">
          <div className="script-preview-header">
            <p className="script-preview-title">{selectedScript.title}</p>
            <span className={`script-preview-badge ${selectedScript.type}`}>
              {selectedScript.type === 'myScripts' ? 'Self-Authored' : selectedScript.type === 'generated' ? 'AI Generated' : 'Pre-Written'}
            </span>
          </div>
          <p className="script-preview-content">
            {selectedScript.content?.slice(0, 180)}
            {selectedScript.content?.length > 180 ? '…' : ''}
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
            <p className="modal-desc">Enter a topic or write out what you plan to say. You can speak freely — this helps the AI follow along.</p>
            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder="e.g., I want to talk about my weekend trip to the mountains and what I learned from it..."
                rows={5}
                value={freeTopic}
                onChange={(e) => setFreeTopic(e.target.value)}
              />
            </div>
            <div className="btn-row">
              <button className="btn-secondary" onClick={() => setShowTopicModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleFreeStart}>Start</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingSetupPage;
