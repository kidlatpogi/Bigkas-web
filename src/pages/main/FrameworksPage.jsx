import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import './FrameworksPage.css';

/* ─── Category definitions ──────────────────────────────────────────────────── */
const CATEGORIES = [
  {
    id: 'frameworks',
    label: 'Frameworks',
    file: () => import('../../assets/data/frameworks.json'),
  },
  {
    id: 'tips_and_tricks',
    label: 'Tips & Tricks',
    file: () => import('../../assets/data/tips_and_tricks.json'),
  },
  {
    id: 'communication_cheats',
    label: 'Comm. Cheats',
    file: () => import('../../assets/data/communication_cheats.json'),
  },
  {
    id: 'communication_skills',
    label: 'Skills',
    file: () => import('../../assets/data/communication_skills.json'),
  },
];

const PAGE_SIZE = 6;

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'az',     label: 'A → Z' },
  { value: 'za',     label: 'Z → A' },
];

/* Per-category lazy cache */
const dataCache = {};

/* ─── SVG Icons ─────────────────────────────────────────────────────────────── */
function IconSearch() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconExternal() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/* ─── Item Card ──────────────────────────────────────────────────────────────── */
function ItemCard({ item, onLearnMore }) {
  const previewSteps = item.steps?.slice(0, 3) ?? [];

  return (
    <div className="fh-card">
      {item.author && (
        <span className="fh-card-author">{item.author}</span>
      )}
      <h3 className="fh-card-name">{item.name}</h3>
      <p className="fh-card-summary">{item.summary}</p>

      {previewSteps.length > 0 && (
        <div className="fh-card-steps">
          {previewSteps.map((step, i) => (
            <span key={i} className="fh-step-pill">
              <span className="fh-step-num">{i + 1}</span>
              {step}
            </span>
          ))}
          {(item.steps?.length ?? 0) > 3 && (
            <span className="fh-step-more">+{item.steps.length - 3} more</span>
          )}
        </div>
      )}

      <button
        className="fh-card-btn"
        onClick={() => onLearnMore(item)}
        aria-label={`Learn more about ${item.name}`}
      >
        <IconPlay />
        Learn More
      </button>
    </div>
  );
}

/* ─── Learn More Modal ───────────────────────────────────────────────────────── */
function ItemModal({ item, onClose }) {
  const hasVideo = Boolean(item.youtubeId);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fh-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Learn ${item.name}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="fh-modal">
        <div className="fh-modal-header">
          <div className="fh-modal-title-block">
            {item.author && <span className="fh-modal-author">{item.author}</span>}
            <h2 className="fh-modal-title">{item.name}</h2>
          </div>
          <button className="fh-modal-close" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        {hasVideo ? (
          <div className="fh-video-wrapper">
            <iframe
              className="fh-video"
              src={`https://www.youtube.com/embed/${item.youtubeId}?rel=0&modestbranding=1`}
              title={`${item.name} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="fh-video-placeholder">No video available yet.</div>
        )}

        <p className="fh-modal-summary">{item.summary}</p>

        {item.steps?.length > 0 && (
          <div className="fh-modal-steps">
            <p className="fh-modal-steps-label">STEPS</p>
            {item.steps.map((step, i) => (
              <div key={i} className="fh-modal-step-row">
                <span className="fh-modal-step-num">{i + 1}</span>
                <span className="fh-modal-step-text">{step}</span>
              </div>
            ))}
          </div>
        )}

        {item.studyLink && (
          <a
            className="fh-modal-link"
            href={item.studyLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read full guide <IconExternal />
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function FrameworksPage() {
  const location = useLocation();

  /* Lazy-init: read deep-link lesson from navigation state on first render */
  const [activeTab, setActiveTab] = useState(() => {
    const catId = location.state?.lessonItem?._categoryId;
    return (catId && CATEGORIES.find((c) => c.id === catId)) ? catId : CATEGORIES[0].id;
  });
  const [activeModal, setActiveModal] = useState(() => location.state?.lessonItem ?? null);

  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [query, setQuery]           = useState('');
  const [sortOrder, setSortOrder]   = useState('recent');
  const [page, setPage]             = useState(1);

  /* Clear location state so manual refresh does not re-open the modal */
  useEffect(() => {
    if (location.state?.lessonItem) window.history.replaceState({}, '', location.pathname);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Load items when tab changes ── */
  useEffect(() => {
    let cancelled = false;
    const cat = CATEGORIES.find((c) => c.id === activeTab);

    // Resolve from cache (immediate) or dynamic import (async) — same async chain
    const load = dataCache[activeTab]
      ? Promise.resolve(dataCache[activeTab])
      : cat.file().then((mod) => {
          const raw = mod.default ?? mod;
          const data = Array.isArray(raw) ? raw : Object.values(raw);
          dataCache[activeTab] = data;
          return data;
        });

    // Show spinner and clear stale items only for non-cached loads (deferred = async setState)
    if (!dataCache[activeTab]) {
      Promise.resolve().then(() => { if (!cancelled) { setLoading(true); setItems([]); } });
    }

    load
      .then((data) => { if (!cancelled) { setItems(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeTab]);

  /* ── Filtered + sorted list (memoised) ── */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? items.filter(
          (it) =>
            it.name?.toLowerCase().includes(q) ||
            it.author?.toLowerCase().includes(q) ||
            it.summary?.toLowerCase().includes(q),
        )
      : [...items];

    if (sortOrder === 'az') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOrder === 'za') list.sort((a, b) => b.name.localeCompare(a.name));
    // 'recent' keeps JSON insertion order

    return list;
  }, [items, query, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openModal  = useCallback((item) => setActiveModal(item), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  const switchTab = (id) => {
    setActiveTab(id);
    setQuery('');
    setSortOrder('recent');
    setPage(1);
  };

  return (
    <div className="fh-page">

      {/* ── Page Header ── */}
      <div className="fh-header">
        <h1 className="fh-title">Training Hub</h1>
      </div>

      {/* ── Search + Sort row ── */}
      <div className="fh-controls">
        <div className="fh-search-wrap">
          <span className="fh-search-icon"><IconSearch /></span>
          <input
            className="fh-search"
            type="search"
            placeholder="Search by name or author…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            aria-label="Search items"
          />
          {query && (
            <button
              className="fh-search-clear"
              onClick={() => { setQuery(''); setPage(1); }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="fh-sort-wrap">
          <svg className="fh-sort-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <select
            className="fh-sort"
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
            aria-label="Sort order"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg className="fh-sort-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="fh-tabs" role="tablist" aria-label="Content categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeTab === cat.id}
            className={`fh-tab${activeTab === cat.id ? ' fh-tab--active' : ''}`}
            onClick={() => switchTab(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="fh-loading" aria-live="polite">
          <div className="fh-spinner" aria-label="Loading" />
        </div>
      ) : pageItems.length === 0 ? (
        <div className="fh-empty" aria-live="polite">
          {query ? `No results for "${query}"` : 'Nothing here yet.'}
        </div>
      ) : (
        <div className="fh-grid">
          {pageItems.map((item) => (
            <ItemCard key={item.id} item={item} onLearnMore={openModal} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && !loading && (
        <div className="fh-pagination" role="navigation" aria-label="Pagination">
          <button
            className="fh-page-btn"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ‹ Prev
          </button>
          <span className="fh-page-info">
            {page} <span className="fh-page-sep">/</span> {totalPages}
          </span>
          <button
            className="fh-page-btn"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </button>
        </div>
      )}

      {/* ── Modal ── */}
      {activeModal && <ItemModal item={activeModal} onClose={closeModal} />}
    </div>
  );
}
