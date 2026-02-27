import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoShuffle } from 'react-icons/io5';
import { useAuthContext } from '../../context/useAuthContext';
import { createScript } from '../../api/scriptsApi';
import { generateSpeech } from '../../api/aiService';
import BackButton from '../../components/common/BackButton';
import { ROUTES, WORDS_PER_MINUTE } from '../../utils/constants';
import './InnerPages.css';
import './GenerateScriptPage.css';

const VIBES      = ['Professional', 'Casual', 'Humorous', 'Inspirational'];
const COOLDOWN_MS = 60000;

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
  const [lastGenTime, setLastGenTime] = useState(0);

  const handleRandomTopic = async () => {
    try {
      const { default: allTopics } = await import('../../assets/topics.json');
      const randomIndex = Math.floor(Math.random() * allTopics.length);
      setPrompt(allTopics[randomIndex]);
    } catch (err) {
      console.error('Error loading topics:', err);
      setError('Failed to load random topics. Please try again.');
    }
  };

  const handleGenerate = async () => {
    const now = Date.now();
    if (now - lastGenTime < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (now - lastGenTime)) / 1000);
      setError(`Please wait ${wait}s to prevent API exhaustion.`);
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt or pick a random topic.');
      return;
    }
    setError('');
    setIsGenerating(true);
    const targetWordCount = Math.round(duration * WORDS_PER_MINUTE);

    try {
      const result = await generateSpeech({
        prompt: prompt.trim(),
        vibe,
        wordCount: targetWordCount,
        durationMinutes: duration,
      });
      setGenerated(result);
      setEditTitle(result.title);
      setEditContent(result.content);
      setLastGenTime(now);
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
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating…' : 'Generate Script'}
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
