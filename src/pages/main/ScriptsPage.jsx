import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { getScripts, deleteScript } from '../../api/scriptsApi';
import { ROUTES, buildRoute } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import './InnerPages.css';
import './ScriptsPage.css';

function ScriptsPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [activeTab, setActiveTab] = useState('self');  // 'self' | 'generated'
  const [scripts, setScripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadScripts = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const type = activeTab === 'self' ? 'self-authored' : 'auto-generated';
      const data = await getScripts(user.id, type);
      setScripts(data || []);
    } catch {
      setError('Failed to load scripts.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    loadScripts();
  }, [loadScripts]);

  const handleDelete = async (scriptId) => {
    if (!window.confirm('Delete this script?')) return;
    setDeletingId(scriptId);
    try {
      await deleteScript(scriptId);
      setScripts(prev => prev.filter(s => s.id !== scriptId));
    } catch {
      alert('Failed to delete script.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="inner-page">
      {/* Header */}
      <div className="inner-page-header">
        <h1 className="inner-page-title">Scripts</h1>
        <div className="scripts-header-actions">
          <button
            className="btn-outline"
            onClick={() => navigate(ROUTES.GENERATE_SCRIPT)}
          >
            ✨ Generate Script
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate(ROUTES.SCRIPT_EDITOR)}
          >
            + Write Script
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'self' ? 'active' : ''}`}
          onClick={() => setActiveTab('self')}
        >
          Self-Authored
        </button>
        <button
          className={`tab-btn ${activeTab === 'generated' ? 'active' : ''}`}
          onClick={() => setActiveTab('generated')}
        >
          Auto-Generated
        </button>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="page-loading">Loading scripts…</div>
      )}

      {error && !isLoading && (
        <div className="page-error">{error}</div>
      )}

      {!isLoading && !error && scripts.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📄</span>
          <p className="empty-title">No scripts yet</p>
          <p className="empty-desc">
            {activeTab === 'self'
              ? 'Write your first script to get started.'
              : 'Use the Generate Script feature to create one.'}
          </p>
        </div>
      )}

      <div className="scripts-list">
        {scripts.map((script) => (
          <div key={script.id} className="script-card">
            <div
              className="script-card-body"
              onClick={() => navigate(buildRoute.scriptEditor(script.id))}
            >
              <h3 className="script-title">{script.title || 'Untitled Script'}</h3>
              <p className="script-preview">
                {script.content?.slice(0, 100)}
                {script.content?.length > 100 ? '…' : ''}
              </p>
              <span className="script-date">{formatDate(script.created_at)}</span>
            </div>
            <div className="script-card-actions">
              <button
                className="script-action-btn edit"
                onClick={() => navigate(buildRoute.scriptEditor(script.id))}
                title="Edit"
              >
                ✏️
              </button>
              <button
                className="script-action-btn delete"
                onClick={() => handleDelete(script.id)}
                disabled={deletingId === script.id}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScriptsPage;
