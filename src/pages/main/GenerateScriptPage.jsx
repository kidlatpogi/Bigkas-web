import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { createScript } from '../../api/scriptsApi';
import BackButton from '../../components/common/BackButton';
import { ROUTES } from '../../utils/constants';
import './InnerPages.css';
import './GenerateScriptPage.css';

const VIBES      = ['Professional', 'Casual', 'Humorous', 'Inspirational'];
const DURATIONS  = ['Short', 'Medium', 'Long'];
const TOPICS     = [
  'The importance of communication', 'My favourite hobby', 'A memorable trip',
  'Technology in daily life', 'Health and wellness', 'Overcoming challenges',
];

function GenerateScriptPage() {
  const navigate  = useNavigate();
  const { user }  = useAuthContext();

  const [prompt,     setPrompt]     = useState('');
  const [vibe,       setVibe]       = useState('Professional');
  const [duration,   setDuration]   = useState('Medium');
  const [generated,  setGenerated]  = useState(null);   // { title, content }
  const [editTitle,  setEditTitle]  = useState('');
  const [editContent,setEditContent]= useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving,   setIsSaving]   = useState(false);
  const [error,      setError]      = useState('');

  const handleRandomTopic = () => {
    const t = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    setPrompt(t);
  };

  // Simple local generation (until a real AI endpoint is wired)
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt or pick a random topic.');
      return;
    }
    setError('');
    setIsGenerating(true);

    // Simulate a brief delay
    await new Promise((r) => setTimeout(r, 800));

    const wordCount = duration === 'Short' ? 60 : duration === 'Medium' ? 120 : 220;
    const content = generatePlaceholder(prompt.trim(), vibe.toLowerCase(), wordCount);
    const title   = `${vibe} — ${prompt.trim().slice(0, 40)}`;

    setGenerated({ title, content });
    setEditTitle(title);
    setEditContent(content);
    setIsGenerating(false);
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
      navigate(ROUTES.SCRIPTS);
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
      <div className="inner-page-header">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="inner-page-title">Generate Script</h1>
      </div>

      {error && <div className="page-error">{error}</div>}

      {/* Prompt */}
      <div className="form-group">
        <label className="form-label">Topic / Prompt</label>
        <div className="prompt-row">
          <textarea
            className="form-textarea"
            placeholder="Describe what you want to speak about…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          <button className="shuffle-btn" onClick={handleRandomTopic} title="Random topic">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
          </button>
        </div>
      </div>

      {/* Vibe chips */}
      <p className="section-label">Vibe</p>
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

      {/* Duration chips */}
      <p className="section-label">Duration</p>
      <div className="chip-group" style={{ marginBottom: 24 }}>
        {DURATIONS.map((d) => (
          <button
            key={d}
            className={`chip ${duration === d ? 'active' : ''}`}
            onClick={() => setDuration(d)}
          >
            {d}
          </button>
        ))}
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

// Rough placeholder generator until a real AI endpoint is wired
function generatePlaceholder(topic, vibe, words) {
  const intros = {
    professional: `Good day. Today, I would like to share my thoughts on ${topic}.`,
    casual:       `Hey everyone! So today I want to talk about something I really enjoy — ${topic}.`,
    humorous:     `Alright, buckle up! We're diving into the world of ${topic}, and I promise it's more fun than it sounds.`,
    inspirational:`Every great journey begins with a single step. Today, let's talk about ${topic} and why it matters.`,
  };
  const body = `This topic has always fascinated me because of the way it connects to our everyday lives. When we think about ${topic}, we often overlook how deeply it influences us. Whether it's through the choices we make or the habits we develop, ${topic} plays a central role. I encourage everyone to take a closer look and reflect on how they can apply these ideas in their own life.`;
  const outro = `In conclusion, ${topic} is something worth exploring further. Thank you for listening.`;

  const combined = `${intros[vibe] || intros.professional} ${body} ${outro}`;
  const w = combined.split(' ');
  return w.slice(0, words).join(' ') + (w.length > words ? '…' : '');
}

export default GenerateScriptPage;
