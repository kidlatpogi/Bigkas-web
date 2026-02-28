import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IoMic,
  IoFlame,
  IoCalendar,
  IoStar,
  IoPersonOutline,
} from 'react-icons/io5';
import { useAuthContext } from '../../context/useAuthContext';
import { useSessions } from '../../hooks/useSessions';
import { ENV } from '../../config/env';
import { ROUTES } from '../../utils/constants';
import temporaryLogo from '../../assets/Temporary Logo.png';
import './DashboardPage.css';

/* ─────────────────────────────────────────────────────────────
   Daily content helpers — mirrors DashboardScreen in Bigkas-mobile
   ───────────────────────────────────────────────────────────── */

/** 10-tip curated list from the mobile repo */
const TIPS = [
  { title: 'Start with a hook', body: 'Open with a surprising fact, question, or story to grab attention in the first 30 seconds.' },
  { title: 'Pace yourself', body: 'Speak slowly and clearly. Pausing between key points gives listeners time to absorb your message.' },
  { title: 'Record yourself', body: 'Listening to recordings of your speech helps you catch filler words and improve cadence.' },
  { title: 'Practice tongue twisters', body: 'Start each session with a quick tongue twister to warm up your mouth muscles and improve clarity.' },
  { title: 'Focus on breathing', body: 'Deep diaphragmatic breathing before speaking reduces anxiety and gives your voice more power.' },
  { title: 'Use simple words', body: 'Clear communication comes from choosing everyday words over complicated vocabulary.' },
  { title: 'Make eye contact', body: 'Even when practicing alone, look into the camera or mirror to build the habit of engagement.' },
  { title: 'Emphasise key words', body: 'Stressing important words in a sentence adds variety and keeps your listener engaged.' },
  { title: 'Read aloud daily', body: 'Reading newspaper articles or books aloud for 10 minutes a day greatly improves fluency.' },
  { title: 'Smile while speaking', body: 'A natural smile changes the shape of your mouth and makes your pronunciation warmer and clearer.' },
];

const FALLBACK_QUOTE = {
  text: 'Courage is what it takes to stand up and speak.',
  author: 'Winston Churchill',
};

let cachedQuote = null;
let cachedQuoteDateKey = null;
let quoteRequestPromise = null;

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fetches a daily motivational quote from the backend endpoint.
 * Uses a per-day cache so multiple renders/mounts don't overwrite
 * the card with a different quote a second later.
 * Falls back to a hardcoded quote on failure.
 */
async function fetchDailyQuote() {
  const dateKey = getLocalDateKey();

  if (cachedQuote && cachedQuoteDateKey === dateKey) {
    return cachedQuote;
  }

  if (quoteRequestPromise) {
    return quoteRequestPromise;
  }

  quoteRequestPromise = (async () => {
    try {
      if (!ENV.ENABLE_DAILY_QUOTE_FETCH) {
        cachedQuote = FALLBACK_QUOTE;
        cachedQuoteDateKey = dateKey;
        return FALLBACK_QUOTE;
      }

      const proxyRes = await fetch(`${ENV.API_BASE_URL}/api/content/daily-quote`);
      if (!proxyRes.ok) throw new Error(`Quote fetch failed: ${proxyRes.status}`);

      const proxyData = await proxyRes.json();
      const nextQuote =
        proxyData?.text && proxyData?.author
          ? { text: proxyData.text, author: proxyData.author }
          : FALLBACK_QUOTE;

      cachedQuote = nextQuote;
      cachedQuoteDateKey = dateKey;
      return nextQuote;
    } catch {
      cachedQuote = FALLBACK_QUOTE;
      cachedQuoteDateKey = dateKey;
      return FALLBACK_QUOTE;
    } finally {
      quoteRequestPromise = null;
    }
  })();

  return quoteRequestPromise;
}

/** Deterministic daily selection — same all day, rotates at midnight */
function getDailyIndex(dateKey = getLocalDateKey()) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86_400_000);
}

function getDailyTip(dateKey) { return TIPS[getDailyIndex(dateKey) % TIPS.length]; }

/* ─────────────────────────────────────────────────────────────
   DashboardPage — 1:1 copy of the mobile DashboardScreen
   ───────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { sessions, fetchSessions } = useSessions();
  const [avatarError, setAvatarError] = useState(false);
  const [quote, setQuote] = useState(FALLBACK_QUOTE);
  const [dateKey, setDateKey] = useState(() => getLocalDateKey());
  const [featuredFramework, setFeaturedFramework] = useState(null);

  /* ── Daily content (mobile-synced quote source + deterministic tip) ── */
  const tip = useMemo(() => getDailyTip(dateKey), [dateKey]);

  /* ── Derived display values ── */
  const displayName = user?.nickname || user?.name || 'Speaker';

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 18) return 'Good afternoon,';
    return 'Good evening,';
  }, []);

  const todayCount = useMemo(() => {
    if (!sessions?.length) return 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return sessions.filter((s) => {
      const d = new Date(s.createdAt || s.created_at); d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length;
  }, [sessions]);

  /** @type {number} averageScore — average pronunciation score (0-100) */
  const averageScore = useMemo(() => {
    if (!sessions?.length) return 0;
    const total = sessions.reduce((sum, s) => sum + (s.score || 0), 0);
    return Math.round((total / sessions.length) * 100);
  }, [sessions]);

  /**
   * streakCount — consecutive days with at least one session, counting
   * backward from today. Mirrors mobile DashboardScreen.jsx streakCount logic.
   */
  const streakCount = useMemo(() => {
    if (!sessions?.length) return 0;
    const dateSet = new Set(
      sessions.map((s) => {
        const d = new Date(s.createdAt || s.created_at);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    const todayKey = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (!dateSet.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
    while (true) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (dateSet.has(key)) { streak++; cursor.setDate(cursor.getDate() - 1); }
      else break;
    }
    return streak;
  }, [sessions]);

  /* ── Load sessions on mount (once) ── */
  useEffect(() => {
    fetchSessions?.();
  }, [fetchSessions]);

  useEffect(() => {
    const syncDateKey = () => {
      const nextKey = getLocalDateKey();
      setDateKey((prevKey) => (prevKey === nextKey ? prevKey : nextKey));
    };

    const minuteTick = window.setInterval(syncDateKey, 60_000);
    window.addEventListener('focus', syncDateKey);
    document.addEventListener('visibilitychange', syncDateKey);

    return () => {
      window.clearInterval(minuteTick);
      window.removeEventListener('focus', syncDateKey);
      document.removeEventListener('visibilitychange', syncDateKey);
    };
  }, []);

  /* ── Load daily motivation quote (same source/behavior as mobile) ── */
  useEffect(() => {
    fetchDailyQuote().then(setQuote);
  }, [dateKey]);

  /* ── Lazily load frameworks and pick a daily featured one ── */
  useEffect(() => {
    import('../../assets/framework.json')
      .then((mod) => {
        const raw = mod.default;
        const data = Array.isArray(raw) ? raw : Object.values(raw);
        if (!data.length) return;
        const idx = getDailyIndex(dateKey) % data.length;
        setFeaturedFramework(data[idx]);
      })
      .catch(() => {});
  }, [dateKey]);

  return (
    <div className="dashboard-page-new">

      {/* ── Top bar: Bigkas logo (left) + profile avatar (right) ── */}
      <div className="dash-top-bar">
        <div className="dash-logo">
          <img src={temporaryLogo} alt="Bigkas logo" className="dash-logo-image" />
          <span className="dash-logo-text">Bigkas</span>
        </div>
        <Link to={ROUTES.PROFILE} className="dash-profile-btn" aria-label="Go to Profile">
          {user?.avatar_url && !avatarError ? (
            <img
              src={user.avatar_url}
              alt="Profile"
              className="dash-profile-avatar"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <IoPersonOutline size={22} aria-hidden="true" />
          )}
        </Link>
      </div>

      {/* ── Greeting ── */}
      <div className="dash-greeting">
        <p className="dash-greeting-text">{greeting}</p>
        <h1 className="dash-greeting-name">{displayName}</h1>
      </div>

      {/* ── Hero card — "Ready to speak?" (black card, centered) ── */}
      <div className="dash-hero-card">
        {/* Header row — mic icon circle + streak badge */}
        <div className="dash-hero-header">
          <div className="dash-hero-icon"><IoMic size={28} color="#FFFFFF" aria-hidden="true" /></div>
          <div className="dash-streak-badge">
            <IoFlame size={14} color="#FBAF00" aria-hidden="true" />
            <span>{streakCount} day streak</span>
          </div>
        </div>

        {/* Copy */}
        <h2 className="dash-hero-title">Ready to speak?</h2>
        <p className="dash-hero-sub">Practice makes perfect! Start your daily session and improve your public speaking skills.</p>

        {/* CTA buttons */}
        <button
          className="dash-btn-practice"
          onClick={() => navigate(ROUTES.PRACTICE)}
        >
          Start Practice
        </button>
        <p className="dash-hero-or">or</p>
        <button
          className="dash-btn-training"
          onClick={() => navigate(ROUTES.TRAINING_SETUP)}
        >
          Start Training
        </button>
      </div>

      {/* ── Stats row (Today · Avg Score · Streak) ── */}
      <div className="dash-stats-card">
        <div className="dash-stat">
          <IoCalendar size={24} color="#FBAF00" className="dash-stat-icon" aria-hidden="true" />
          <span className="dash-stat-value">{String(todayCount).padStart(2, '0')}</span>
          <span className="dash-stat-label">TODAY</span>
        </div>
        <div className="dash-stat-divider" />
        <div className="dash-stat">
          <IoStar size={24} color="#FBAF00" className="dash-stat-icon" aria-hidden="true" />
          <span className="dash-stat-value">{averageScore}</span>
          <span className="dash-stat-label">AVG SCORE</span>
        </div>
        <div className="dash-stat-divider" />
        <div className="dash-stat">
          <IoFlame size={24} color="#FBAF00" className="dash-stat-icon" aria-hidden="true" />
          <span className="dash-stat-value">{String(streakCount).padStart(2, '0')}</span>
          <span className="dash-stat-label">STREAK</span>
        </div>
      </div>

      {/* ── Quick-Learn card (daily featured framework) ── */}
      {featuredFramework && (
        <div className="dash-quicklearn-card">
          <div className="dash-quicklearn-badge">FRAMEWORK OF THE DAY</div>
          <h3 className="dash-quicklearn-name">{featuredFramework.name}</h3>
          <p className="dash-quicklearn-summary">{featuredFramework.summary}</p>
          <button
            className="dash-quicklearn-btn"
            onClick={() => navigate(ROUTES.FRAMEWORKS)}
          >
            Learn this Style
          </button>
        </div>
      )}

      {/* ── Info cards row (Motivation + Tip of the Day) ── */}
      <div className="dash-info-row">
        {/* Motivation — mobile-synced daily quote */}
        <div className="dash-info-card">
          <span className="dash-card-label">MOTIVATION</span>
          <p className="dash-quote-text">&ldquo;{quote.text}&rdquo;</p>
          <span className="dash-quote-author">- {quote.author}</span>
        </div>

        {/* Tip of the Day — curated list, rotates daily */}
        <div className="dash-info-card">
          <span className="dash-card-label">TIP OF THE DAY</span>
          <p className="dash-tip-title">{tip.title}</p>
          <p className="dash-tip-body">{tip.body}</p>
        </div>
      </div>

    </div>
  );
}

