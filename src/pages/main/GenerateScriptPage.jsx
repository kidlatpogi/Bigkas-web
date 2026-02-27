import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoShuffle } from 'react-icons/io5';
import { useAuthContext } from '../../context/useAuthContext';
import { createScript } from '../../api/scriptsApi';
import BackButton from '../../components/common/BackButton';
import { ROUTES, WORDS_PER_MINUTE } from '../../utils/constants';
import { ENV } from '../../config/env';
import './InnerPages.css';
import './GenerateScriptPage.css';

const VIBES      = ['Professional', 'Casual', 'Humorous', 'Inspirational'];

function GenerateScriptPage() {
  const navigate  = useNavigate();
  const { user }  = useAuthContext();

  const [prompt,     setPrompt]     = useState('');
  const [vibe,       setVibe]       = useState('Professional');
  const [duration,   setDuration]   = useState(3);
  const [generated,  setGenerated]  = useState(null);   // { title, content }
  const [editTitle,  setEditTitle]  = useState('');
  const [editContent,setEditContent]= useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving,   setIsSaving]   = useState(false);
  const [error,      setError]      = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleRandomTopic = async () => {
    try {
      const { default: allTopics } = await import('../../assets/topics.json');
      const randomIndex = Math.floor(Math.random() * allTopics.length);
      setPrompt(allTopics[randomIndex]);
    } catch (err) {
      setError('Failed to load random topics. Please try again.');
    }
  };

  const handleGenerate = async () => {
    if (cooldownSeconds > 0) {
      setError(`Please wait ${cooldownSeconds}s before generating another script.`);
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt or pick a random topic.');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to generate a script.');
      return;
    }

    setError('');
    setIsGenerating(true);
    const targetWordCount = Math.round(duration * WORDS_PER_MINUTE);

    try {
      const response = await fetch(`${ENV.API_BASE_URL}/api/ai/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          prompt: prompt.trim(),
          vibe,
          target_word_count: targetWordCount,
          duration_minutes: duration,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Cooldown active
          const errorData = await response.json();
          const remainingSeconds = errorData?.detail?.remaining_seconds || 60;
          setCooldownSeconds(Math.max(1, remainingSeconds));
          setError(errorData?.detail?.error || `Please wait ${remainingSeconds}s before generating another script.`);
          return;
        }

        const errorData = await response.json();
        throw new Error(errorData?.detail?.error || 'Failed to generate script. Please try again.');
      }

      const result = await response.json();
      setGenerated(result);
      setEditTitle(result.title);
      setEditContent(result.content);
    } catch (err) {
      setError(err.message || 'Failed to generate script. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await createScript({
        userId: user.id,
        title:   editTitle.trim() || generated.title,
        content: editContent.trim(),
        type:    'auto-generated',
      });
      navigate(ROUTES.SCRIPTS, { state: { initialTab: 'auto-generated' } });
    } catch {
      setError('Failed to save script.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndStart = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const saved = await createScript({
        userId: user.id,
        title:   editTitle.trim() || generated.title,
        content: editContent.trim(),
        type:    'auto-generated',
      });
      navigate(ROUTES.TRAINING, { state: { script: saved, focus: 'scripted' } });
    } catch {
      setError('Failed to save script.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="inner-page">
      {/* Header */}
      <div className="inner-page-header" style={{ position: 'relative', justifyContent: 'center' }}>
        <BackButton style={{ position: 'absolute', left: 0 }} onClick={() => navigate(-1)} />
        <h1 className="inner-page-title">Generate Script</h1>
      </div>

      {error && <div className="page-error">{error}</div>}

      {/* Prompt */}
      <div className="form-group">
        <label className="form-label">Topic / Prompt</label>
        <div className="prompt-row">
          <textarea
            className="form-textarea"
            placeholder="What are you talking about? Be specific about your main message and who the audience is."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          <button className="random-topic-btn" onClick={handleRandomTopic} title="Random topic">
            <IoShuffle size={14} />
            <span>Random Topic</span>
          </button>
        </div>
      </div>

      {/* Vibe chips */}
      <p className="section-label">What's the vibe?</p>
      <div className="chip-group">
        {VIBES.map((v) => (
          <button
            key={v}
            className={`chip ${vibe === v ? 'active' : ''}`}
            onClick={() => setVibe(v)}
          >
            {v}
          </button>
        ))}
      </div>

      <p className="section-label">Duration: {duration} Minute{duration > 1 ? 's' : ''}</p>
      <div className="duration-slider-container" style={{ marginBottom: 24 }}>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={duration}
          onChange={(e) => setDuration(parseFloat(e.target.value))}
          className="form-slider"
        />
        <div className="slider-labels">
          <span>~{Math.round(duration * WORDS_PER_MINUTE)} words</span>
        </div>
      </div>

      <button
        className="btn-primary"
        style={{ width: '100%' }}
        onClick={handleGenerate}
        disabled={isGenerating || cooldownSeconds > 0}
      >
        {isGenerating ? 'Generating…' : cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Generate Script'}
      </button>

      {/* Preview / edit modal */}
      {generated && (
        <div className="modal-overlay">
          <div className="modal-box generate-modal">
            <h2 className="modal-title">Review Your Script</h2>

            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea
                className="form-textarea"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
              />
            </div>

            <div className="btn-row">
              <button className="btn-secondary" onClick={() => { setGenerated(null); handleGenerate(); }}>
                Regenerate
              </button>
              <button className="btn-secondary" onClick={handleSave} disabled={isSaving}>
                Save
              </button>
              <button className="btn-primary" onClick={handleSaveAndStart} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save &amp; Start'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerateScriptPage;
