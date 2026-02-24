import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

/** Deterministic daily tip — same tip all day, rotates at midnight */
function getDailyTip() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86_400_000);
  return TIPS[dayOfYear % TIPS.length];
}

/**
 * Fetches a daily motivational quote from ZenQuotes API.
 * API: https://zenquotes.io/api/today | Docs: https://docs.zenquotes.io
 * Falls back to a hardcoded Churchill quote on failure.
 */
async function fetchDailyQuote() {
  try {
    const res = await fetch('https://zenquotes.io/api/today');
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return { text: data[0].q, author: data[0].a };
    }
    throw new Error('Empty response');
  } catch {
    return {
      text: 'Courage is what it takes to stand up and speak.',
      author: 'Winston Churchill',
    };
  }
}

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

/** Ionicons "flame" icon */
function FlameIcon({ size = 14, color = '#FBAF00' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 2C9 7.5 6 11.5 6 15.5a6 6 0 0012 0c0-2.8-1.6-5.5-3.2-8-1.1 2-1.4 3.8-1.8 5.5C11.2 10.5 10.5 7 12 2z" />
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

  /* ── Daily content state ── */
  const [quote, setQuote] = useState({
    text: 'Courage is what it takes to stand up and speak.',
    author: 'Winston Churchill',
  });
  const tip = useMemo(() => getDailyTip(), []);

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
    const today = new Date().toDateString();
    return sessions.filter((s) => new Date(s.created_at).toDateString() === today).length;
  }, [sessions]);

  const averageScore = 84;   // placeholder — will use real data when API is wired
  const streakCount  = 3;    // placeholder

  /* ── Load data on mount ── */
  useEffect(() => {
    fetchSessions?.();
    fetchDailyQuote().then(setQuote);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(() => {
    fetchSessions?.();
    fetchDailyQuote().then(setQuote);
  }, [fetchSessions]);

  return (
    <div className="dashboard-page-new">

      {/* ── Greeting ── */}
      <div className="dash-greeting">
        <p className="dash-greeting-text">{greeting}</p>
        <h1 className="dash-greeting-name">{displayName}</h1>
      </div>

      {/* ── Hero card — "Ready to speak?" (black card, centered) ── */}
      <div className="dash-hero-card">
        {/* Copy */}
        <h2 className="dash-hero-title">Ready to speak?</h2>
        <p className="dash-hero-sub">Ready when you are.</p>

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
          onClick={() => navigate(ROUTES.PRACTICE)}
        >
          Start Training
        </button>
      </div>

      {/* ── Stats row (Today · Avg Score · Streak) ── */}
      <div className="dash-stats-card">
        <div className="dash-stat">
          <span className="dash-stat-value">{String(todayCount).padStart(2, '0')}</span>
          <span className="dash-stat-label">TODAY</span>
        </div>
        <div className="dash-stat-divider" />
        <div className="dash-stat">
          <span className="dash-stat-value">{averageScore}</span>
          <span className="dash-stat-label">AVG SCORE</span>
        </div>
        <div className="dash-stat-divider" />
        <div className="dash-stat">
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

