import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { getScript, createScript, updateScript } from '../../api/scriptsApi';
import { ROUTES } from '../../utils/constants';
import './InnerPages.css';

const MAX_CHARS = 2000;

function ScriptEditorPage() {
  const navigate = useNavigate();
  const { scriptId } = useParams();
  const { user } = useAuthContext();

  const isEditing = Boolean(scriptId);

  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error,   setError]   = useState('');
  const [isLoading, setIsLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      setIsLoading(true);
      try {
        const { data, error: sbErr } = await getScript(scriptId);
        if (sbErr) throw sbErr;
        setTitle(data?.title || '');
        setContent(data?.content || '');
      } catch {
        setError('Failed to load script.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [scriptId, isEditing]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!content.trim()) {
      setError('Content cannot be empty.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      if (isEditing) {
        await updateScript(scriptId, { title: title.trim(), content: content.trim() });
      } else {
        await createScript({
          userId: user.id,
          title: title.trim(),
          content: content.trim(),
          type: 'self-authored',
        });
      }
      navigate(ROUTES.SCRIPTS);
    } catch {
      setError('Failed to save script. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="inner-page">
        <div className="page-loading">Loading…</div>
      </div>
    );
  }

  return (
    <div className="inner-page">
      {/* Header */}
      <div className="inner-page-header">
        <button className="inner-page-back" onClick={() => navigate(-1)}>‹</button>
        <h1 className="inner-page-title">{isEditing ? 'Edit Script' : 'New Script'}</h1>
      </div>

      {error && <div className="page-error">{error}</div>}

      {/* Title */}
      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          className="form-input"
          placeholder="Script title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Content */}
      <div className="form-group">
        <label className="form-label">Content</label>
        <textarea
          className="form-textarea"
          placeholder="Write your script here…"
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
          rows={12}
        />
        <span className="char-count">{content.length} characters</span>
      </div>

      {/* Actions */}
      <div className="btn-row">
        <button className="btn-secondary" onClick={() => navigate(-1)} disabled={isSaving}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Script'}
        </button>
      </div>
    </div>
  );
}

export default ScriptEditorPage;
