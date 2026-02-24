import { useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { useSessions } from '../../hooks/useSessions';
import { ROUTES } from '../../utils/constants';
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

/** Curated motivational quotes — rotates daily, no external API needed */
const QUOTES = [
  { text: 'Courage is what it takes to stand up and speak.', author: 'Winston Churchill' },
  { text: 'All great speakers were bad speakers at first.', author: 'Ralph Waldo Emerson' },
  { text: 'The human brain starts working the moment you are born and never stops until you stand up to speak in public.', author: 'George Jessel' },
  { text: 'It usually takes me more than three weeks to prepare a good impromptu speech.', author: 'Mark Twain' },
  { text: 'There are always three speeches for every one you actually gave. The one you practiced, the one you gave, and the one you wish you gave.', author: 'Dale Carnegie' },
  { text: 'Speech is power: speech is to persuade, to convert, to compel.', author: 'Ralph Waldo Emerson' },
  { text: 'The right word may be effective, but no word was ever as effective as a rightly timed pause.', author: 'Mark Twain' },
  { text: 'Take advantage of every opportunity to practice your communication skills.', author: 'Jim Rohn' },
  { text: 'Think before you speak. Read before you think.', author: 'Fran Lebowitz' },
  { text: 'To speak and to speak well are two things. A fool may talk, but a wise man speaks.', author: 'Ben Jonson' },
  { text: 'Kind words can be short and easy to speak, but their echoes are truly endless.', author: 'Mother Teresa' },
  { text: 'The most precious things in speech are the pauses.', author: 'Ralph Richardson' },
  { text: 'Words are, of course, the most powerful drug used by mankind.', author: 'Rudyard Kipling' },
  { text: 'You can speak well if your tongue can deliver the message of your heart.', author: 'John Ford' },
];

/** Deterministic daily selection — same all day, rotates at midnight */
function getDailyIndex() {
  const today = new Date();
  return Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86_400_000);
}

function getDailyTip()   { return TIPS[getDailyIndex()   % TIPS.length]; }
function getDailyQuote() { return QUOTES[getDailyIndex() % QUOTES.length]; }

/* ─────────────────────────────────────────────────────────────
   Icon components (Ionicons-style SVG — from mobile app)
   ───────────────────────────────────────────────────────────── */

/** Ionicons "mic" icon */
function MicIcon({ size = 28, color = '#FBAF00' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" fill={color} />
      <path d="M19 10v1a7 7 0 01-14 0v-1M12 18v4m-4 0h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Ionicons "flame" icon (streak) */
function FlameIcon({ size = 14, color = '#FBAF00' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 2C9 7.5 6 11.5 6 15.5a6 6 0 0012 0c0-2.8-1.6-5.5-3.2-8-1.1 2-1.4 3.8-1.8 5.5C11.2 10.5 10.5 7 12 2z" />
    </svg>
  );
}

/** Ionicons "calendar" icon — TODAY stat (color=#FBAF00 matching mobile) */
function CalendarIcon({ size = 22, color = '#FBAF00' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="dash-stat-icon">
      <rect x="3" y="4" width="18" height="18" rx="3" ry="3"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

/** Ionicons "star" icon — AVG SCORE stat (filled, color=#FBAF00 matching mobile) */
function StarIcon({ size = 22, color = '#FBAF00' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" className="dash-stat-icon">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

/** Ionicons "flame" icon — STREAK stat (filled, color=#FBAF00 matching mobile) */
function FlameStatIcon({ size = 22, color = '#FBAF00' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" className="dash-stat-icon">
      <path d="M12 2C9 7.5 6 11.5 6 15.5a6 6 0 0012 0c0-2.8-1.6-5.5-3.2-8-1.1 2-1.4 3.8-1.8 5.5C11.2 10.5 10.5 7 12 2z" />
    </svg>
  );
}

/** Person icon for avatar button */
function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   DashboardPage — 1:1 copy of the mobile DashboardScreen
   ───────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { sessions, fetchSessions } = useSessions();

  /* ── Daily content (no external API — computed locally, no CORS) ── */
  const quote = useMemo(() => getDailyQuote(), []);
  const tip   = useMemo(() => getDailyTip(),   []);

  /* ── Derived display values ── */
  const displayName = user?.nickname || user?.name?.split(' ')[0] || 'Speaker';

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
      const d = new Date(s.created_at); d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length;
  }, [sessions]);

  /**
   * averageScore — computed from sessions' confidence_score (0–100 scale).
   * Mirrors mobile DashboardScreen.jsx averageScore logic.
   */
  const averageScore = useMemo(() => {
    if (!sessions?.length) return 0;
    const total = sessions.reduce((sum, s) => sum + (s.confidence_score ?? s.score ?? 0), 0);
    return Math.round(total / sessions.length);
  }, [sessions]);

  /**
   * streakCount — consecutive days with at least one session, counting
   * backward from today. Mirrors mobile DashboardScreen.jsx streakCount logic.
   */
  const streakCount = useMemo(() => {
    if (!sessions?.length) return 0;
    const dateSet = new Set(
      sessions.map((s) => {
        const d = new Date(s.created_at);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(() => {
    fetchSessions?.();
  }, [fetchSessions]);

  return (
    <div className="dashboard-page-new">

      {/* ── Top bar: profile avatar button ── */}
      <div className="dash-top-bar">
        <div className="dash-top-bar-spacer" />
        <Link to={ROUTES.PROFILE} className="dash-profile-btn" aria-label="Go to Profile">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Profile"
              className="dash-profile-avatar"
            />
          ) : (
            <PersonIcon />
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
          <div className="dash-hero-icon"><MicIcon /></div>
          <div className="dash-streak-badge">
            <FlameIcon />
            <span>{streakCount} day streak</span>
          </div>
        </div>

        {/* Copy */}
        <h2 className="dash-hero-title">Ready to speak?</h2>
        <p className="dash-hero-sub">Practice makes perfect! Start your daily session and improve your public speaking skills.</p>

        {/* CTA buttons */}
        <button
          className="dash-btn-practice"
          onClick={() => navigate(ROUTES.TRAINING_SETUP)}
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
          <CalendarIcon size={24} />
          <span className="dash-stat-value">{String(todayCount).padStart(2, '0')}</span>
          <span className="dash-stat-label">TODAY</span>
        </div>
        <div className="dash-stat-divider" />
        <div className="dash-stat">
          <StarIcon size={24} />
          <span className="dash-stat-value">{averageScore}</span>
          <span className="dash-stat-label">AVG SCORE</span>
        </div>
        <div className="dash-stat-divider" />
        <div className="dash-stat">
          <FlameStatIcon size={24} />
          <span className="dash-stat-value">{String(streakCount).padStart(2, '0')}</span>
          <span className="dash-stat-label">STREAK</span>
        </div>
      </div>

      {/* ── Info cards row (Motivation + Tip of the Day) ── */}
      <div className="dash-info-row">
        {/* Motivation — daily quote from ZenQuotes API */}
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

