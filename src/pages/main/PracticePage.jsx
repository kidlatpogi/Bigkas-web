import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { getScripts, duplicateSystemScript } from '../../api/scriptsApi';
import { ROUTES, buildRoute } from '../../utils/constants';
import { SYSTEM_PREWRITTEN_SPEECHES, RANDOM_TOPICS } from '../../utils/practiceData';
import BackButton from '../../components/common/BackButton';
import './PracticePage.css';

/* ”€”€”€ Icons ”€”€”€ */
function IconShuffle() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FCBA04"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 3 21 3 21 8"/>
      <line x1="4" y1="20" x2="21" y2="3"/>
      <polyline points="21 16 21 21 16 21"/>
      <line x1="15" y1="15" x2="21" y2="21"/>
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(1,1,1,0.35)"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  );
}

/* ”€”€”€ Tab options (mirrors mobile PracticeScreen) ”€”€”€ */
const TABS = [
  { value: 'prewritten',  label: 'Pre-written' },
  { value: 'randomizer',  label: 'Randomizer' },
  { value: 'generate',    label: 'Generate' },
];

/**
 * PracticePage "” web adaptation of PracticeScreen.jsx (Bigkas-mobile).
 *
 * Tabs:
 *  Pre-written "” system speeches + user self-authored scripts
 *  Randomizer  "” random topic card + shuffle button
 *  Generate    "” navigate to /scripts/generate; shows auto-generated scripts below
 */
export default function PracticePage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [selectedTab, setSelectedTab] = useState('prewritten');
  const [scripts, setScripts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [selectedTab]);

  /* Teleprompter preview modal */
  const [previewScript, setPreviewScript] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIsSystem, setPreviewIsSystem] = useState(false);

  /* Copy-to-My-Scripts state */
  const [isCopying, setIsCopying] = useState(false);
  const [copyToast, setCopyToast] = useState(''); // '' | 'success' | 'error'

  /* Randomiser */
  const [randomTopic, setRandomTopic] = useState(() => RANDOM_TOPICS[0]);

  /* Load user scripts from Supabase */
  const loadScripts = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data } = await getScripts(user.id, null);
      setScripts(Array.isArray(data) ? data : []);
    } catch {
      setScripts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadScripts();
  }, [loadScripts]);

  /* Shuffle randomiser */
  const shuffleRandomTopic = useCallback(() => {
    const idx = Math.floor(Math.random() * RANDOM_TOPICS.length);
    setRandomTopic(RANDOM_TOPICS[idx]);
  }, []);

  /* Visible scripts per tab */
  const visibleScripts = useMemo(() => {
    if (selectedTab === 'prewritten') {
      return [...SYSTEM_PREWRITTEN_SPEECHES];
    }
    if (selectedTab === 'generate') {
      return scripts.filter((s) => s.type === 'auto-generated');
    }
    return [];
  }, [scripts, selectedTab]);

  const pagedScripts = useMemo(
    () => visibleScripts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visibleScripts, page]
  );
  const totalPages = Math.max(1, Math.ceil(visibleScripts.length / PAGE_SIZE));

  /* Open teleprompter modal */
  const handleScriptPress = (script, isSystem = false) => {
    setPreviewScript(script);
    setPreviewIsSystem(isSystem);
    setShowPreview(true);
  };

  /* Start practice with previewed script */
  const handleStartPractice = () => {
    if (!previewScript) return;
    setShowPreview(false);
    navigate(ROUTES.TRAINING, {
      state: {
        script: previewScript,
        focus: 'scripted',
        entryPoint: 'practice',
      },
    });
  };

  /* Copy system script into user library, then open script editor */
  const handleCopyAndEdit = async () => {
    if (!user?.id) return;
    setIsCopying(true);
    try {
      const { data, error } = await duplicateSystemScript(user.id, previewScript);
      if (error) throw error;
      setCopyToast('success');
      setTimeout(() => {
        setCopyToast('');
        setShowPreview(false);
        navigate(buildRoute.scriptEditor(data.id), { state: { isTempCopy: true } });
      }, 1200);
    } catch {
      setCopyToast('error');
      setTimeout(() => setCopyToast(''), 3000);
    } finally {
      setIsCopying(false);
    }
  };

  /* Start randomiser practice */
  const handleStartRandomTopic = () => {
    if (!randomTopic) return;
    navigate(ROUTES.TRAINING, {
      state: {
        freeTopic: randomTopic.title,
        freeSpeechContext: randomTopic.body,
        focus: 'free',
        entryPoint: 'practice',
      },
    });
  };

  return (
    <div className="practice-page">
      <div className="practice-wrap">

        {/* Header */}
        <div className="practice-header">
          <BackButton onClick={() => navigate(-1)} />
          <h1 className="practice-title">Practice Setup</h1>
        </div>
        <p className="practice-sub">
          Choose a speech to preview, generate your own, or try a random topic!
        </p>

        {/* Tabs */}
        <div className="practice-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={selectedTab === tab.value}
              className={`practice-tab-btn${selectedTab === tab.value ? ' active' : ''}`}
              onClick={() => setSelectedTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ”€”€ Pre-written tab ”€”€ */}
        {selectedTab === 'prewritten' && (
          <div className="practice-list">
            {isLoading ? (
              <div className="practice-spinner" aria-label="Loading" />
            ) : visibleScripts.length === 0 ? (
              <div className="practice-empty">
                <IconDoc />
                <p>No scripts yet. Write one from the Scripts tab or generate one!</p>
              </div>
            ) : (
              pagedScripts.map((script) => (
                <button
                  key={script.id}
                  className="practice-script-card"
                  onClick={() => handleScriptPress(script, true)}
                >
                  <span className="practice-script-title">{script.title}</span>
                  <p className="practice-script-preview">
                    {(script.content || script.body || '').slice(0, 120)}
                    {(script.content || script.body || '').length > 120 ? '...' : ''}
                  </p>
                </button>
              ))
            )}
          </div>
        )}

        {/* ”€”€ Randomiser tab ”€”€ */}
        {selectedTab === 'randomizer' && (
          <div className="practice-rand-wrap">
            <div className="practice-rand-card">
              <h3 className="practice-rand-title">{randomTopic?.title || 'Surprise Topic'}</h3>
              <p className="practice-rand-body">
                {randomTopic?.body || 'Press shuffle to get a random topic!'}
              </p>
              <div className="practice-rand-actions">
                <button className="practice-btn-outline" onClick={shuffleRandomTopic}>
                  Shuffle
                </button>
                <button className="practice-btn-primary" onClick={handleStartRandomTopic}>
                  Start
                </button>
              </div>
            </div>
            <p className="practice-rand-hint">
              Get a surprise topic and practice speaking about it!
            </p>
          </div>
        )}

        {/* ”€”€ Generate tab ”€”€ */}
        {selectedTab === 'generate' && (
          <div className="practice-list">
            <button
              className="btn-primary training-generate-btn"
              onClick={() => navigate(ROUTES.GENERATE_SCRIPT)}
            >
              Generate Speech
            </button>

            {visibleScripts.length > 0 && (
              <p className="practice-section-label">Your Generated Scripts</p>
            )}
            {pagedScripts.map((script) => (
              <button
                key={script.id}
                className="practice-script-card"
                onClick={() => handleScriptPress(script)}
              >
                <span className="practice-script-title">{script.title}</span>
                <p className="practice-script-preview">
                  {(script.content || '').slice(0, 120)}
                  {(script.content || '').length > 120 ? '...' : ''}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {selectedTab !== 'randomizer' && totalPages > 1 && (
          <div className="practice-paged-nav">
            <button className="practice-paged-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>&#8249; Prev</button>
            <span className="practice-paged-info">{page} / {totalPages}</span>
            <button className="practice-paged-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next &#8250;</button>
          </div>
        )}

        {/* Cancel */}
        <button className="practice-cancel-link" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </div>

      {/* ”€”€ Teleprompter Preview Modal ”€”€ */}
      {showPreview && (
        <div
          className="practice-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Script preview"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false); }}
        >
          <div className="practice-modal">
            {/* Header */}
            <div className="practice-modal-header">
              <h3 className="practice-modal-script-title">
                {previewScript?.title || 'Script Preview'}
              </h3>
              <button
                className="practice-modal-close"
                onClick={() => setShowPreview(false)}
                aria-label="Close preview"
              >
                <IconClose />
              </button>
            </div>

            {/* Script content */}
            <div className="practice-modal-scroll">
              <p className="practice-modal-text">
                {previewScript?.content || previewScript?.body || 'No content available.'}
              </p>
            </div>

            {/* Copy-to-My-Scripts toast */}
            {copyToast && (
              <div className={`practice-copy-toast${copyToast === 'error' ? ' error' : ''}`}>
                {copyToast === 'success'
                  ? 'Successfully copied to My Scripts!'
                  : 'Failed to copy script. Please try again.'}
              </div>
            )}

            {/* Actions */}
            <div className="practice-modal-actions">
              <button className="practice-btn-outline" onClick={() => setShowPreview(false)}>
                Close
              </button>
              {previewIsSystem && (
                <button
                  className="practice-btn-copy"
                  onClick={handleCopyAndEdit}
                  disabled={isCopying}
                >
                  {isCopying
                    ? <span className="practice-copy-spinner" />
                    : <IconCopy />}
                  {isCopying ? 'Copying...' : 'Copy & Edit'}
                </button>
              )}
              <button className="practice-btn-primary" onClick={handleStartPractice}>
                Start Practice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
