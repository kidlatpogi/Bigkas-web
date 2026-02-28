import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { getScripts } from '../../api/scriptsApi';
import { SYSTEM_PREWRITTEN_SPEECHES } from '../../utils/practiceData';
import BackButton from '../../components/common/BackButton';
import { ROUTES } from '../../utils/constants';
import './InnerPages.css';
import './TrainingSetupPage.css';

const FOCUS_OPTIONS = [
  { value: 'scripted', label: 'Scripted Accuracy', desc: 'Strict adherence to text for pronunciation. AI will track every word you say.' },
  { value: 'free',     label: 'Free Speech',       desc: 'Impromptu speaking style. Focus on flow, tone, and pacing.' },
];

const FILTER_CHIPS = [
  { value: 'all',        label: 'All' },
  { value: 'prewritten', label: 'Pre-Written' },
  { value: 'generated',  label: 'My AI Scripts' },
];

function TrainingSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [userScripts, setUserScripts]       = useState([]);
  const [selectedScript, setSelectedScript] = useState(null);
  const [focus, setFocus]                   = useState('scripted');
  const [isLoading, setIsLoading]           = useState(false);
  const [scriptFilter, setScriptFilter]     = useState('all');
  const [freeTopic, setFreeTopic]           = useState('');
  const [showTopicModal, setShowTopicModal] = useState(false);

  /* Load the user’s auto-generated scripts from Supabase */
  const loadScripts = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await getScripts(user.id, 'auto-generated');
      if (error) throw error;
      setUserScripts(
        (Array.isArray(data) ? data : []).map(s => ({ ...s, type: 'generated' }))
      );
    } catch {
      setUserScripts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadScripts(); }, [loadScripts]);

  /* Combined + typed system speeches */
  const systemScripts = useMemo(
    () => SYSTEM_PREWRITTEN_SPEECHES.map(s => ({ ...s, type: 'prewritten' })),
    []
  );

  const allAvailableScripts = useMemo(
    () => [...systemScripts, ...userScripts],
    [systemScripts, userScripts]
  );

  /* Apply filter chip */
  const filteredScripts = useMemo(() => {
    if (scriptFilter === 'prewritten') return systemScripts;
    if (scriptFilter === 'generated')  return userScripts;
    return allAvailableScripts;
  }, [scriptFilter, systemScripts, userScripts, allAvailableScripts]);

  /* Keep selectedScript in sync when filter changes */
  useEffect(() => {
    if (selectedScript && !filteredScripts.find(s => s.id === selectedScript.id)) {
      setSelectedScript(null);
    }
  }, [filteredScripts, selectedScript]);

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

  const noGeneratedScripts = scriptFilter === 'generated' && userScripts.length === 0 && !isLoading;

  return (
    <div className="inner-page training-setup-page">
      <div className="inner-page-header training-setup-header">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="inner-page-title">Training Setup</h1>
      </div>

      {/* ── Script selection ── */}
      <p className="section-label">Select Script</p>

      {/* Quick-action: generate new speech */}
      <button
        className="btn-primary training-generate-btn"
        onClick={() => navigate(ROUTES.GENERATE_SCRIPT)}
      >
        + Generate New Speech
      </button>

      {/* Filter chips */}
      <div className="ts-filter-chips">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.value}
            className={`ts-chip${scriptFilter === chip.value ? ' active' : ''}`}
            onClick={() => setScriptFilter(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Dropdown */}
      <div className="form-group" style={{ marginTop: 0 }}>
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
                {s.type === 'prewritten' ? '📋 ' : '🤖 '}{s.title || 'Untitled Script'}
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
              {selectedScript.type === 'prewritten' ? 'Pre-Written' : 'AI Generated'}
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
