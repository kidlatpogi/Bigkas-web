import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { getScripts, deleteScript } from '../../api/scriptsApi';
import { ROUTES, buildRoute } from '../../utils/constants';
import { formatEditedTime } from '../../utils/formatters';
import FilterTabs from '../../components/common/FilterTabs';
import './InnerPages.css';
import './ScriptsPage.css';

function ScriptsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();

  const initialTab = location.state?.filter === 'auto-generated' ? 'generated' : 'self';
  const [activeTab, setActiveTab] = useState(initialTab);  // 'self' | 'generated'
  const [scripts, setScripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const loadScripts = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const type = activeTab === 'self' ? 'self-authored' : 'auto-generated';
      const { data, error: sbErr } = await getScripts(user.id, type);
      if (sbErr) throw sbErr;
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
            Generate Script
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate(ROUTES.SCRIPT_EDITOR)}
          >
            Write Script
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <FilterTabs
          tabs={[
            { label: 'Self-Authored', value: 'self' },
            { label: 'Auto-Generated', value: 'generated' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
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
          <div key={script.id} className="script-card" onClick={() => navigate(buildRoute.scriptEditor(script.id))}>
            {/* Top row: type badge + menu */}
            <div className="script-card-top">
              <span className={`script-badge ${script.type === 'auto-generated' ? 'generated' : 'self'}`}>
                {script.type === 'auto-generated' ? 'Auto-Generated' : 'Self-Authored'}
              </span>
              <button
                className="script-menu-btn"
                onClick={(e) => { e.stopPropagation(); setMenuOpenId(script.id); }}
                aria-label="Script options"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="5" r="1.5"/>
                  <circle cx="12" cy="12" r="1.5"/>
                  <circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <h3 className="script-title">{script.title || 'Untitled Script'}</h3>
            <p className="script-preview">
              {script.content?.slice(0, 120)}
              {script.content?.length > 120 ? ' …' : ''}
            </p>
            <span className="script-date">{formatEditedTime(script.updated_at)}</span>
          </div>
        ))}
      </div>

      {/* ── Script options modal (ellipsis menu) ── */}
      {menuOpenId && (
        <div className="script-menu-overlay" onClick={() => setMenuOpenId(null)}>
          <div className="script-menu-box" onClick={(e) => e.stopPropagation()}>
            {/* Edit */}
            <button
              className="script-menu-item"
              onClick={() => { setMenuOpenId(null); navigate(buildRoute.scriptEditor(menuOpenId)); }}
            >
              {/* Pencil icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            {/* Delete */}
            <button
              className="script-menu-item danger"
              onClick={() => { setMenuOpenId(null); handleDelete(menuOpenId); }}
              disabled={deletingId === menuOpenId}
            >
              {/* Trash icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScriptsPage;
