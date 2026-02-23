import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { useTheme } from '../../context/useTheme';
import bigkasLogo from '../../assets/Temporary Logo.png';
import './LandingPage.css';

/* ═══════════════════════════════════════════════════════
   SVG COMPONENTS — matching Bigkas-mobile design tokens
   Colors: primary #FBAF00 · secondary #010101 · bg #F5F5F5
   ═══════════════════════════════════════════════════════ */

/* Circular Progress Ring for Confidence Score */
function CircularProgress({ score = 85, size = 200, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
    }, 600);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(1,1,1,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <circle
          className="progress-ring"
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="url(#progressGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBAF00" />
            <stop offset="100%" stopColor="#D59300" />
          </linearGradient>
        </defs>
      </svg>
      <div className="score-overlay">
        <div className="score-value">
          <span className="score-number">{score}</span>
          <span className="score-percent">%</span>
        </div>
        <span className="score-label">Confidence</span>
      </div>
    </div>
  );
}

/* Waveform visualization — Vocal Stability card */
function WaveformViz() {
  const bars = [0.3, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7, 0.85, 0.5, 0.65, 0.9, 0.35, 0.7, 0.55, 0.8, 0.4, 0.6, 0.75, 0.5, 0.85];
  return (
    <div className="waveform-viz">
      {bars.map((h, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{
            height: `${h * 100}%`,
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}

/* Heatmap visualization — Visual Engagement card */
const HEATMAP_DOTS = Array.from({ length: 24 }, (_, i) => {
  const seed = ((i * 7 + 13) * 17) % 100;
  return {
    x: 12 + (i % 6) * 16,
    y: 12 + Math.floor(i / 6) * 16,
    opacity: 0.15 + (seed / 100) * 0.85,
    size: 4 + (seed / 100) * 8,
  };
});

function HeatmapViz() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="heatmap-viz">
      <svg viewBox="0 0 100 72" preserveAspectRatio="xMidYMid meet">
        <ellipse cx="50" cy="36" rx="28" ry="34" fill="none" stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(1,1,1,0.08)'} strokeWidth="0.5" />
        <ellipse cx="38" cy="28" rx="6" ry="4" fill="rgba(251,175,0,0.15)" />
        <ellipse cx="62" cy="28" rx="6" ry="4" fill="rgba(251,175,0,0.15)" />
        {HEATMAP_DOTS.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.size / 2}
            fill={d.opacity > 0.6 ? 'rgba(251,175,0,0.5)' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(1,1,1,0.1)')}
            className="heatmap-dot"
            style={{ animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </svg>
    </div>
  );
}

/* Filler word counter — Fluency Tracking card */
function FluencyViz() {
  return (
    <div className="fluency-viz">
      <div className="fluency-stat">
        <span className="fluency-count">3</span>
        <span className="fluency-word">um</span>
      </div>
      <div className="fluency-divider" />
      <div className="fluency-stat">
        <span className="fluency-count">1</span>
        <span className="fluency-word">uh</span>
      </div>
      <div className="fluency-divider" />
      <div className="fluency-stat">
        <span className="fluency-count">12%</span>
        <span className="fluency-word">silence</span>
      </div>
    </div>
  );
}

/* Mini growth chart — progression section */
function GrowthChart() {
  const data = [42, 48, 55, 52, 63, 68, 72, 78, 85];
  const max = 100;
  const w = 280;
  const h = 100;
  const stepX = w / (data.length - 1);

  const points = data.map((v, i) => `${i * stepX},${h - (v / max) * h}`).join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg className="growth-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(251,175,0,0.25)" />
          <stop offset="100%" stopColor="rgba(251,175,0,0)" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#chartGrad)" />
      <polyline points={points} fill="none" stroke="#FBAF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={i * stepX} cy={h - (v / max) * h} r="3" fill="#010101" stroke="#FBAF00" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   FEATURE CARD
   ═══════════════════════════════════════════════════════ */
function FeatureCard({ icon, title, description, children, delay = 0 }) {
  return (
    <div className="feature-card" style={{ transitionDelay: `${delay}s` }}>
      <div className="feature-card-visual">{children}</div>
      <div className="feature-card-body">
        <div className="feature-card-icon">{icon}</div>
        <h3 className="feature-card-title">{title}</h3>
        <p className="feature-card-desc">{description}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STAT PILL — Hero stats
   ═══════════════════════════════════════════════════════ */
function StatPill({ value, label }) {
  return (
    <div className="stat-pill">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  const problemRef = useRef(null);
  const solutionRef = useRef(null);
  const featuresRef = useRef(null);
  const trustRef = useRef(null);
  const growthRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in-view');
      }),
      { threshold: 0.12 }
    );
    [problemRef, solutionRef, featuresRef, trustRef, growthRef, ctaRef].forEach((r) => {
      if (r.current) observer.observe(r.current);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">

      {/* ══════ NAVIGATION ══════ */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={bigkasLogo} alt="Bigkas logo" className="logo-img" />
            <span className="logo-text">Bigkas</span>
          </div>

          <ul className="nav-links">
            <li><a href="#problem">About</a></li>
            <li><a href="#solution">Solution</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#trust">Science</a></li>
            <li><a href="#growth">Progress</a></li>
          </ul>

          <div className="nav-actions">
            <button className="btn-nav-outline" onClick={() => navigate(ROUTES.LOGIN)}>
              Log In
            </button>
            <button className="btn-nav-solid" onClick={() => navigate(ROUTES.REGISTER)}>
              Get Started
            </button>
          </div>

          <button
            className="nav-hamburger"
            aria-label="Menu"
            onClick={(e) => e.currentTarget.closest('.landing-nav').classList.toggle('nav-open')}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ══════ HERO — 100vh ══════ */}
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="hero-inner">
          <div className="hero-content">
            <span className="hero-badge">AI-Powered Speech Coach</span>
            <h1 className="hero-heading">
              Master the Stage,<br />
              <span className="accent-text">Minus the Stage Fright.</span>
            </h1>
            <p className="hero-sub">
              Fail in private, shine in public. Bigkas gives you a safe, 
              judgment-free space to practice speaking — powered by acoustic 
              biomarkers and computer vision calibrated for Filipino learners.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate(ROUTES.REGISTER)}>
                Start Practicing — It&apos;s Free
              </button>
              <a href="#features" className="btn-ghost">See How It Works</a>
            </div>
            <div className="hero-stats">
              <StatPill value="200+" label="Behavioral Indicators" />
              <StatPill value="85%" label="Avg. Score Improvement" />
              <StatPill value="0" label="Special Hardware Needed" />
            </div>
          </div>

          {/* Dashboard Mockup — mirrors mobile DashboardScreen */}
          <div className="hero-dashboard">
            <div className="dashboard-card">
              <div className="dashboard-header">
                <span className="dashboard-title">Speaking Confidence Score</span>
                <span className="dashboard-session">Session #14</span>
              </div>
              <CircularProgress score={85} size={200} strokeWidth={10} />
              <div className="dashboard-metrics">
                <div className="metric">
                  <span className="metric-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a2 2 0 00-2 2v4a2 2 0 004 0V4a2 2 0 00-2-2z" stroke="#FBAF00" strokeWidth="1.2"/><path d="M13 7v1a5 5 0 01-10 0V7M8 13v2" stroke="#FBAF00" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </span>
                  <span className="metric-val">92</span>
                  <span className="metric-lbl">Vocal</span>
                </div>
                <div className="metric-divider" />
                <div className="metric">
                  <span className="metric-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="#FBAF00" strokeWidth="1.2"/><path d="M1 8s3-6 7-6 7 6 7 6-3 6-7 6-7-6-7-6z" stroke="#FBAF00" strokeWidth="1.2"/></svg>
                  </span>
                  <span className="metric-val">78</span>
                  <span className="metric-lbl">Visual</span>
                </div>
                <div className="metric-divider" />
                <div className="metric">
                  <span className="metric-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M3 8h7M3 11h9" stroke="#FBAF00" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </span>
                  <span className="metric-val">88</span>
                  <span className="metric-lbl">Fluency</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-hint" style={{ opacity: scrollY > 100 ? 0 : 1 }}>
          <div className="scroll-line" />
          <span className="scroll-text">Scroll to explore</span>
        </div>
      </section>

      {/* ══════ THE PROBLEM — 100vh ══════ */}
      <section id="problem" className="problem-section" ref={problemRef}>
        <div className="section-wrap">
          <div className="problem-grid">
            <div className="problem-text">
              <span className="section-overline">The Problem</span>
              <h2 className="section-heading">
                Stage Fright Is the #1 Fear —<br />
                <span className="accent-text">Even Above Death.</span>
              </h2>
              <p className="section-body">
                In Filipino classrooms, glossophobia — the fear of public speaking — 
                is a silent epidemic. Students freeze during oral recitations. Young 
                professionals struggle transitioning from text-based digital 
                communication to face-to-face workplace presentations.
              </p>
              <p className="section-body">
                The mental block isn&apos;t about ability. It&apos;s about the 
                <strong> fear of judgment</strong>. What if you could practice 
                endlessly, with zero audience, and get <em>real</em> feedback?
              </p>
            </div>
            <div className="problem-visual">
              <div className="problem-stats-card">
                <div className="prob-stat">
                  <span className="prob-num">75%</span>
                  <span className="prob-lbl">of people experience glossophobia</span>
                </div>
                <div className="prob-divider" />
                <div className="prob-stat">
                  <span className="prob-num">3 in 4</span>
                  <span className="prob-lbl">Filipino students avoid oral tasks</span>
                </div>
                <div className="prob-divider" />
                <div className="prob-stat">
                  <span className="prob-num">#1</span>
                  <span className="prob-lbl">barrier to career advancement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ THE SOLUTION — 100vh ══════ */}
      <section id="solution" className="solution-section" ref={solutionRef}>
        <div className="section-wrap">
          <span className="section-overline center">The Solution</span>
          <h2 className="section-heading center">
            Your Private AI Speaking Coach —<br />
            <span className="accent-text">No Stage Required.</span>
          </h2>
          <p className="section-body center max-w-prose">
            Bigkas combines <strong>acoustic analysis</strong> and <strong>computer 
            vision</strong> into a multi-modal diagnostic tool that fits in your 
            pocket. It doesn&apos;t just record — it <em>understands</em> your voice, 
            your face, and your flow.
          </p>

          <div className="solution-pillars">
            <div className="pillar">
              <div className="pillar-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="13" stroke="#FBAF00" strokeWidth="1.5" fill="rgba(251,175,0,0.08)" />
                  <path d="M14 8v8M10 12h8" stroke="#FBAF00" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h4 className="pillar-title">Multi-Modal Analysis</h4>
              <p className="pillar-desc">Audio + Video processed simultaneously for a complete picture of your delivery.</p>
            </div>
            <div className="pillar">
              <div className="pillar-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="13" stroke="#FBAF00" strokeWidth="1.5" fill="rgba(251,175,0,0.08)" />
                  <path d="M9 14l3 3 7-7" stroke="#FBAF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="pillar-title">Standard Hardware</h4>
              <p className="pillar-desc">No VR headset, no pro microphone. Just your laptop or phone&apos;s built-in camera and mic.</p>
            </div>
            <div className="pillar">
              <div className="pillar-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="13" stroke="#FBAF00" strokeWidth="1.5" fill="rgba(251,175,0,0.08)" />
                  <path d="M14 9v6l4 2" stroke="#FBAF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="pillar-title">Self-Paced Growth</h4>
              <p className="pillar-desc">Practice anytime. No scheduling, no waiting. Track your improvement over weeks and months.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ FEATURES — 100vh ══════ */}
      <section id="features" className="features-section" ref={featuresRef}>
        <div className="section-wrap">
          <span className="section-overline center">Diagnostic Features</span>
          <h2 className="section-heading center">
            Three Pillars of<br />
            <span className="accent-text">Speaking Intelligence.</span>
          </h2>

          <div className="features-grid">
            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" stroke="#FBAF00" strokeWidth="1.5" />
                  <path d="M19 10v1a7 7 0 01-14 0v-1M12 18v4m-4 0h8" stroke="#FBAF00" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
              title="Vocal Stability"
              description="Acoustic biomarkers like Jitter and Shimmer reveal micro-variations in your voice that indicate nervousness, fatigue, or confidence."
              delay={0}
            >
              <WaveformViz />
              <div className="feature-metric-row">
                <span className="fm">Jitter: <strong>0.42%</strong></span>
                <span className="fm">Shimmer: <strong>1.8 dB</strong></span>
                <span className="fm">HNR: <strong>22.4</strong></span>
              </div>
            </FeatureCard>

            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="#FBAF00" strokeWidth="1.5" />
                  <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" stroke="#FBAF00" strokeWidth="1.5" />
                </svg>
              }
              title="Visual Engagement"
              description="Facial landmark tracking and eye-contact heatmaps measure your non-verbal cues — ensuring your body speaks as powerfully as your words."
              delay={0.12}
            >
              <HeatmapViz />
              <div className="feature-metric-row">
                <span className="fm">Eye Contact: <strong>74%</strong></span>
                <span className="fm">Engagement: <strong>High</strong></span>
              </div>
            </FeatureCard>

            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h10M4 18h14" stroke="#FBAF00" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
              title="Fluency Tracking"
              description="Real-time detection of filler words, prolonged pauses, and silence ratios. Know exactly where your flow breaks — and fix it."
              delay={0.24}
            >
              <FluencyViz />
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* ══════ TRUST / SCIENCE — 100vh ══════ */}
      <section id="trust" className="trust-section" ref={trustRef}>
        <div className="section-wrap">
          <div className="trust-grid">
            <div className="trust-text">
              <span className="section-overline">Scientific Credibility</span>
              <h2 className="section-heading">
                Not Just a Recorder —<br />
                <span className="accent-text">A Diagnostic Instrument.</span>
              </h2>
              <p className="section-body">
                Bigkas leverages peer-reviewed acoustic biomarkers used in clinical 
                speech pathology. Jitter and Shimmer analysis — the same metrics 
                used to diagnose voice disorders — are repurposed here to measure 
                speaking confidence and vocal control.
              </p>
              <div className="trust-badge">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 1l2.5 5 5.5.8-4 3.9.9 5.3L10 13.5 5.1 16l.9-5.3-4-3.9 5.5-.8L10 1z" fill="#FBAF00" />
                </svg>
                <span>Specifically calibrated for Standard English in a Filipino educational context.</span>
              </div>
            </div>
            <div className="trust-visual">
              <div className="trust-card">
                <h4 className="trust-card-title">Acoustic Biomarkers</h4>
                <div className="biomarker-list">
                  <div className="biomarker">
                    <span className="bio-name">Jitter (frequency perturbation)</span>
                    <div className="bio-bar"><div className="bio-fill" style={{ width: '35%' }} /></div>
                    <span className="bio-val">0.42%</span>
                  </div>
                  <div className="biomarker">
                    <span className="bio-name">Shimmer (amplitude perturbation)</span>
                    <div className="bio-bar"><div className="bio-fill" style={{ width: '55%' }} /></div>
                    <span className="bio-val">1.8 dB</span>
                  </div>
                  <div className="biomarker">
                    <span className="bio-name">HNR (harmonics-to-noise)</span>
                    <div className="bio-bar"><div className="bio-fill" style={{ width: '72%' }} /></div>
                    <span className="bio-val">22.4 dB</span>
                  </div>
                  <div className="biomarker">
                    <span className="bio-name">Speech Rate (syllables/sec)</span>
                    <div className="bio-bar"><div className="bio-fill" style={{ width: '60%' }} /></div>
                    <span className="bio-val">4.2 syl/s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ GROWTH / PROGRESSION — 100vh ══════ */}
      <section id="growth" className="growth-section" ref={growthRef}>
        <div className="section-wrap">
          <span className="section-overline center">Progression Tracking</span>
          <h2 className="section-heading center">
            Watch Yourself Improve —<br />
            <span className="accent-text">Session After Session.</span>
          </h2>
          <p className="section-body center max-w-prose">
            Every practice session is scored and logged. See your Speaking 
            Confidence Score climb over time through a personalized growth chart. 
            It&apos;s not about being perfect — it&apos;s about getting 1% better every day.
          </p>

          <div className="growth-card">
            <div className="growth-card-header">
              <span className="growth-title">Your Growth Over 9 Sessions</span>
              <span className="growth-badge-up">+43% improvement</span>
            </div>
            <GrowthChart />
            <div className="growth-labels">
              <span>Session 1</span>
              <span>Session 5</span>
              <span>Session 9</span>
            </div>
          </div>

          <div className="bridge-text">
            <p>
              <strong>The Bridge:</strong> Whether you&apos;re a student preparing for oral exams 
              or a young professional moving from text-based habits to face-to-face presentations — 
              Bigkas is your bridge to confident, articulate communication.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ CTA — 100vh ══════ */}
      <section className="cta-section" ref={ctaRef}>
        <div className="cta-inner">
          <div className="cta-card">
            <span className="cta-overline">Ready to Begin?</span>
            <h2 className="cta-heading">
              Your Stage Is Waiting.<br />
              <span className="cta-heading-accent">Practice in Private. Perform With Confidence.</span>
            </h2>
            <p className="cta-sub">
              No sign-up fees. No special equipment. Just you, your voice, and an 
              AI coach that never judges.
            </p>
            <button className="btn-cta-main" onClick={() => navigate(ROUTES.REGISTER)}>
              Start Practicing Now
            </button>
            <span className="cta-note">Free forever for students &bull; No credit card required</span>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <div className="footer-logo-group">
              <img src={bigkasLogo} alt="Bigkas logo" className="footer-logo-img" />
              <span className="footer-logo">Bigkas</span>
            </div>
            <p className="footer-copy">&copy; 2026 Bigkas AI &mdash; Built for Filipino Speakers.</p>
          </div>
          <div className="footer-links">
            <a href="#problem">About</a>
            <a href="#solution">Solution</a>
            <a href="#features">Features</a>
            <a href="#trust">Science</a>
            <a href="#growth">Progress</a>
          </div>
          <div className="footer-right">
            <a
              href="https://expo.dev/accounts/kidlatpogi/projects/Bigkas/builds"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-android"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17.523 2.226l1.392-2.415a.288.288 0 00-.499-.288L17.01 1.953C15.5 1.235 13.81.84 12 .84s-3.5.395-5.01 1.113L5.584-.477a.288.288 0 00-.499.288l1.392 2.415C3.038 4.267.72 8.168.72 12.6h22.56c0-4.432-2.318-8.333-5.757-10.374zM7.2 9.6a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4zm9.6 0a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4zM.72 13.8v8.4a1.8 1.8 0 003.6 0v-8.4H.72zm19.56 0v8.4a1.8 1.8 0 003.6 0v-8.4h-3.6zm-16.2 0v10.2a2.1 2.1 0 002.1 2.1h1.2v3.3a1.8 1.8 0 003.6 0v-3.3h2.04v3.3a1.8 1.8 0 003.6 0v-3.3h1.2a2.1 2.1 0 002.1-2.1V13.8H4.08z" fill="currentColor"/>
              </svg>
              Download for Android
            </a>
            <button className="btn-nav-solid small" onClick={() => navigate(ROUTES.REGISTER)}>
              Get Started
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
