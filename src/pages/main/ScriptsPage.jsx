import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { getScripts, deleteScript } from '../../api/scriptsApi';
import { ROUTES, buildRoute } from '../../utils/constants';
import { formatEditedTime } from '../../utils/formatters';
import FilterTabs from '../../components/common/FilterTabs';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import './InnerPages.css';
import './ScriptsPage.css';

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M13.5 13.5l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function ScriptsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();

  const requestedTab = location.state?.initialTab || location.state?.filter;
  const initialTab = requestedTab === 'auto-generated' ? 'generated' : 'self';
  const [activeTab, setActiveTab] = useState(initialTab);  // 'self' | 'generated'
  const [scripts, setScripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuButtonRefs = useRef({});

  const [query, setQuery]         = useState('');
  const [sortOrder, setSortOrder] = useState('recent');
  const [glowId, setGlowId]       = useState(location.state?.newScriptId || null);
  const glowTimerRef = useRef(null);

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

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

  // Reset search/sort/page when switching tabs
  useEffect(() => {
    setQuery('');
    setSortOrder('recent');
    setPage(1);
  }, [activeTab]);

  // Reset page when search or sort changes
  useEffect(() => { setPage(1); }, [query, sortOrder]);

  // Start the 5-second glow timer once the target script appears in the loaded list
  useEffect(() => {
    if (glowId && scripts.some(s => s.id === glowId)) {
      clearTimeout(glowTimerRef.current);
      glowTimerRef.current = setTimeout(() => setGlowId(null), 5000);
      return () => clearTimeout(glowTimerRef.current);
    }
  }, [scripts, glowId]);

  // Filtered + sorted view of scripts
  const displayedScripts = useMemo(() => {
    let list = [...scripts];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(s => (s.title || '').toLowerCase().includes(q));
    }
    if (sortOrder === 'az') list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else if (sortOrder === 'za') list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    // 'recent' preserves backend order (updated_at desc)
    return list;
  }, [scripts, query, sortOrder]);

  const handleDelete = async (scriptId) => {
    setDeleteTargetId(scriptId);
  };

  const handleConfirmDelete = async () => {
    const scriptId = deleteTargetId;
    setDeleteTargetId(null);
    setDeletingId(scriptId);
    try {
      await deleteScript(scriptId);
      setScripts(prev => prev.filter(s => s.id !== scriptId));
    } catch {
      // error is shown via ConfirmationModal's context; swallow silently
    } finally {
      setDeletingId(null);
    }
  };

  const handleMenuOpen = (scriptId, event) => {
    event.stopPropagation();
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setMenuOpenId(scriptId);
    setMenuPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
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
      <div style={{ marginBottom: '16px' }}>
        <FilterTabs
          tabs={[
            { label: 'Self-Authored', value: 'self' },
            { label: 'Auto-Generated', value: 'generated' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Search + Sort */}
      <div className="sc-controls">
        <div className="sc-search-wrap">
          <span className="sc-search-icon"><IconSearch /></span>
          <input
            className="sc-search"
            type="search"
            placeholder="Search scripts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search scripts"
          />
          {query && (
            <button className="sc-search-clear" onClick={() => setQuery('')} aria-label="Clear search">✕</button>
          )}
        </div>
        <div className="sc-sort-wrap">
          <svg className="sc-sort-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <select
            className="sc-sort"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            aria-label="Sort order"
          >
            <option value="recent">Most Recent</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
          <svg className="sc-sort-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
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

      {!isLoading && !error && scripts.length > 0 && displayedScripts.length === 0 && (
        <div className="empty-state">
          <p className="empty-title">No results</p>
          <p className="empty-desc">No scripts match "{query}". Try a different search.</p>
        </div>
      )}

      <div className="scripts-list">
        {displayedScripts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((script) => (
          <div
            key={script.id}
            className={`script-card${script.id === glowId ? ' script-card--glow' : ''}`}
            onClick={() => navigate(buildRoute.scriptEditor(script.id))}
          >
            {/* Top row: type badge + menu */}
            <div className="script-card-top">
              <span className={`script-badge ${script.type === 'auto-generated' ? 'generated' : 'self'}`}>
                {script.type === 'auto-generated' ? 'Auto-Generated' : 'Self-Authored'}
              </span>
              <button
                className="script-menu-btn"
                onClick={(e) => handleMenuOpen(script.id, e)}
                ref={(el) => { menuButtonRefs.current[script.id] = el; }}
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

      {Math.ceil(displayedScripts.length / PAGE_SIZE) > 1 && (
        <div className="paged-nav">
          <button className="paged-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>&#8249; Prev</button>
          <span className="paged-info">{page} / {Math.ceil(displayedScripts.length / PAGE_SIZE)}</span>
          <button className="paged-btn" disabled={page >= Math.ceil(displayedScripts.length / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>Next &#8250;</button>
        </div>
      )}

      {/* ── Script options modal (ellipsis menu) ── */}
      {menuOpenId && (
        <>
          <div className="script-menu-overlay" onClick={() => setMenuOpenId(null)} />
          <div
            className="script-menu-box"
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
              zIndex: 1000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
        </>
      )}

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteTargetId)}
        title="Delete script?"
        message="This action cannot be undone. The script will be permanently removed from your library."
        confirmLabel="Delete"
        cancelLabel="Keep it"
        type="danger"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default ScriptsPage;
