import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LuRotateCcw } from 'react-icons/lu';
import { useSessionContext } from '../../context/useSessionContext';
import { buildRoute } from '../../utils/constants';
import BackButton from '../../components/common/BackButton';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import './TrainingPage.css';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function getSupportedMime() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}
function getSupportedVideoMime() {
  const types = [
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm',
    'video/mp4',
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600).toString().padStart(2, '0');
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/* ─── Silence Detection ─────────────────────────────────────────────────────── */
const SILENCE_THRESHOLD  = 0.02;  // 0–1 normalised amplitude
const SILENCE_TRIGGER_MS = 5000; // ms of silence before showing hint

/* ─── Icons ────────────────────────────────────────────────────────────────── */
function PauseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1"/>
      <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );
}

function RestartIcon() {
  return <LuRotateCcw size={22} strokeWidth={2.5} />;
}

function SettingsGearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor">
      <path d="M470.39 300l-.47-.38-31.56-18.22a188.78 188.78 0 000-51.83l31.56-18.22c6-3.51 9.19-10.51 7.68-17.19-10.13-42.86-29.47-80.87-56.84-110.43a14.87 14.87 0 00-17.37-2.93l-31.56 18.22a188.08 188.08 0 00-44.86-25.89V38.42a14.88 14.88 0 00-11.86-14.56c-44.16-9.59-89.86-9.16-132.29 0a14.88 14.88 0 00-11.86 14.56v36.13a188.08 188.08 0 00-44.86 25.89L95 82.22a14.87 14.87 0 00-17.37 2.93c-27.37 29.56-46.71 67.57-56.84 110.43-1.51 6.68 1.68 13.68 7.68 17.19l31.56 18.22a188.78 188.78 0 000 51.83L28.47 300.62c-6 3.51-9.19 10.51-7.68 17.19 10.12 42.86 29.46 80.87 56.84 110.43a14.87 14.87 0 0017.37 2.93l31.56-18.22a188.08 188.08 0 0044.86 25.89v36.13a14.88 14.88 0 0011.86 14.56c44.16 9.59 89.86 9.16 132.29 0a14.88 14.88 0 0011.86-14.56v-36.13a188.08 188.08 0 0044.86-25.89l31.56 18.22a14.87 14.87 0 0017.37-2.93c27.37-29.56 46.71-67.57 56.84-110.43 1.51-6.68-1.68-13.68-7.68-17.22zM256 336a80 80 0 110-160 80 80 0 010 160z"/>
    </svg>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */
function TrainingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const { analyseAndSave } = useSessionContext();

  const script    = state?.script    || null;
  const focus     = state?.focus     || 'scripted';
  const freeTopic = state?.freeTopic || '';
  const shouldAutoStart =
    state?.autoStartCountdown === true ||
    new URLSearchParams(location.search).get('autostart') === '1';

  /* Recording state */
  const [status, setStatus]         = useState('idle'); // idle | countdown | recording | paused | analysing | error
  const [countdown, setCountdown]   = useState(3);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [errorMsg, setErrorMsg]     = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  /* Settings modal */
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize]         = useState(16);
  const [wpm, setWpm]                   = useState(120);
  const [autoScroll, setAutoScroll]     = useState(true);
  const [scrollSpeed, setScrollSpeed]   = useState(5);

  /* Waveform — 50-bar history stored in ref, state triggers re-render */
  const [waveformBars, setWaveformBars] = useState(Array(50).fill(0));

  /* WPM highlighting */
  const [highlightIdx, setHighlightIdx] = useState(-1);

  /* Refs */
  const videoRef    = useRef(null);
  const scriptRef   = useRef(null);
  const timerRef    = useRef(null);
  const countRef    = useRef(null);
  const mediaRef    = useRef(null);
  const chunksRef   = useRef([]);
  const visualMediaRef = useRef(null);
  const visualChunksRef = useRef([]);
  const visualMimeRef = useRef('');
  const streamRef   = useRef(null);
  const analyserRef = useRef(null);
  const animRef     = useRef(null);
  const waveHistRef = useRef(Array(50).fill(0));
  const wpmTimerRef     = useRef(null);
  const silenceStartRef  = useRef(null);
  const hintDismissRef   = useRef(null);
  const frameworksRef    = useRef([]);
  const autoStartTriggeredRef = useRef(false);
  const countdownAudioCtxRef = useRef(null);

  /* Hint toast state */
  const [showHint, setShowHint]       = useState(false);
  const [hintContent, setHintContent] = useState('');

  const scriptWords = useMemo(() => {
    if (focus !== 'scripted' || !script?.content) return [];
    return script.content.split(/\s+/).filter(Boolean);
  }, [focus, script]);

  /* ── Lazy-load frameworks for silence hints ── */
  useEffect(() => {
    import('../../assets/data/frameworks.json')
      .then((m) => { frameworksRef.current = m.default ?? m; })
      .catch(() => {});
  }, []);

  /* ── Cleanup ── */
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(countRef.current);
      clearInterval(wpmTimerRef.current);
      cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (countdownAudioCtxRef.current) {
        countdownAudioCtxRef.current.close().catch(() => {});
        countdownAudioCtxRef.current = null;
      }
    };
  }, []);

  const playCountdownCue = useCallback((type = 'tick') => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!countdownAudioCtxRef.current || countdownAudioCtxRef.current.state === 'closed') {
      countdownAudioCtxRef.current = new AudioCtx();
    }

    const ctx = countdownAudioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const isStart = type === 'start';
    const duration = isStart ? 0.22 : 0.12;
    const freq = isStart ? 940 : 720;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(isStart ? 0.2 : 0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }, []);

  /* ── Auto-scroll teleprompter to highlighted word ── */
  useEffect(() => {
    if (!autoScroll || highlightIdx < 0 || !scriptRef.current) return;
    const el = scriptRef.current.querySelector(`[data-idx="${highlightIdx}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightIdx, autoScroll]);

  /* ── Waveform animation loop (shared by startRecording + resume) ── */
  const startWaveformLoop = useCallback(() => {
    const tick = () => {
      if (!analyserRef.current) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
      waveHistRef.current = [...waveHistRef.current.slice(1), avg];
      setWaveformBars([...waveHistRef.current]);

      if (avg < SILENCE_THRESHOLD) {
        if (!silenceStartRef.current) {
          silenceStartRef.current = Date.now();
        } else if (Date.now() - silenceStartRef.current >= SILENCE_TRIGGER_MS) {
          silenceStartRef.current = null;
          const fw = frameworksRef.current;
          if (Array.isArray(fw) && fw.length) {
            const pick = fw[Math.floor(Math.random() * fw.length)];
            setHintContent(`💡 Stuck? Try the ${pick.name}: "${pick.steps[0]}"`);
            setShowHint(true);
            clearTimeout(hintDismissRef.current);
            hintDismissRef.current = setTimeout(() => setShowHint(false), 5000);
          }
        }
      } else {
        silenceStartRef.current = null;
      }

      animRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, []);

  /* ── Start recording ── */
  const startRecording = useCallback(async () => {
    try {
      const constraints = { audio: true };
      if (focus === 'scripted') {
        constraints.video = { facingMode: 'user' };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      /* Attach video */
      if (videoRef.current && stream.getVideoTracks().length > 0) {
        videoRef.current.srcObject = stream;
      }

      /* Audio analyser → waveform history */
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      src.connect(analyser);
      startWaveformLoop();

      /* MediaRecorder records audio only; the camera stream is only for preview. */
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No microphone track available for recording.');
      }

      const recordingStream = new MediaStream(audioTracks);
      const recorderMime = getSupportedMime();
      const recorder = recorderMime
        ? new MediaRecorder(recordingStream, { mimeType: recorderMime })
        : new MediaRecorder(recordingStream);

      mediaRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(200);

      if (focus === 'scripted' && stream.getVideoTracks().length > 0) {
        const videoMime = getSupportedVideoMime();
        const videoRecorder = videoMime
          ? new MediaRecorder(stream, { mimeType: videoMime })
          : new MediaRecorder(stream);

        visualMediaRef.current = videoRecorder;
        visualChunksRef.current = [];
        visualMimeRef.current = videoRecorder.mimeType || videoMime || 'video/webm';

        videoRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) visualChunksRef.current.push(e.data);
        };
        videoRecorder.start(400);
      }

      setStatus('recording');
      setElapsedSec(0);
      timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);

      /* WPM word highlight (scripted only) */
      if (focus === 'scripted' && scriptWords.length > 0) {
        const msPerWord = (60 / wpm) * 1000;
        let idx = 0;
        setHighlightIdx(0);
        wpmTimerRef.current = setInterval(() => {
          idx += 1;
          if (idx < scriptWords.length) setHighlightIdx(idx);
          else clearInterval(wpmTimerRef.current);
        }, msPerWord);
      }

      setErrorMsg('');
    } catch (err) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setStatus('permission-denied');
      } else {
        setErrorMsg('Could not start audio recording. Please check your microphone and try again.');
        setStatus('error');
      }
    }
  }, [focus, scriptWords, startWaveformLoop, wpm]);

  /* ── Countdown → start ── */
  const startCountdown = useCallback(() => {
    setStatus('countdown');
    setCountdown(3);
    setHighlightIdx(-1);
    let c = 3;
    playCountdownCue('tick');
    countRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      playCountdownCue(c <= 0 ? 'start' : 'tick');
      if (c <= 0) {
        clearInterval(countRef.current);
        startRecording();
      }
    }, 1000);
  }, [playCountdownCue, startRecording]);

  /* ── Auto-start when launched from Start actions ── */
  useEffect(() => {
    if (!shouldAutoStart) return;

    // Guard is checked inside the callback so React StrictMode's
    // cleanup-and-remount cycle doesn't permanently consume the flag
    // before the timer actually fires.
    const autoStartTimer = setTimeout(() => {
      if (autoStartTriggeredRef.current) return;
      autoStartTriggeredRef.current = true;
      startCountdown();
    }, 300);

    return () => clearTimeout(autoStartTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoStart]);

  /* ── Stop → analyse ── */
  const stopRecording = () => {
    clearInterval(timerRef.current);
    clearInterval(wpmTimerRef.current);
    cancelAnimationFrame(animRef.current);
    silenceStartRef.current = null;
    clearTimeout(hintDismissRef.current);
    setShowHint(false);
    const recorder = mediaRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    recorder.onstop = async () => {
      const mime = recorder.mimeType || getSupportedMime() || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mime });

      let videoBlob = null;
      const videoRecorder = visualMediaRef.current;
      if (videoRecorder && videoRecorder.state !== 'inactive') {
        await new Promise((resolve) => {
          videoRecorder.onstop = () => resolve();
          videoRecorder.stop();
        });
      }
      if (visualChunksRef.current.length > 0) {
        videoBlob = new Blob(visualChunksRef.current, {
          type: visualMimeRef.current || 'video/webm',
        });
      }

      streamRef.current?.getTracks().forEach((t) => t.stop());
      setStatus('analysing');
      try {
        const result = await analyseAndSave({
          audioBlob:  blob,
          videoBlob,
          targetText: focus === 'scripted' ? (script?.content || '') : (freeTopic || 'Free speech session'),
          scriptType: focus,
        });
        if (result?.success && result?.data?.id) {
          navigate(buildRoute.sessionResult(result.data.id), { state: result.data });
        } else {
          setErrorMsg(result?.error || 'Analysis failed. Please try again.');
          setStatus('error');
        }
      } catch {
        setErrorMsg('An unexpected error occurred during analysis.');
        setStatus('error');
      }
    };
    recorder.stop();
  };

  /* ── Pause / Resume ── */
  const handlePause = () => {
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.pause();
      clearInterval(timerRef.current);
      clearInterval(wpmTimerRef.current);
      cancelAnimationFrame(animRef.current);
      setStatus('paused');
    } else if (mediaRef.current?.state === 'paused') {
      mediaRef.current.resume();
      timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
      startWaveformLoop();
      setStatus('recording');
    }
  };

  /* ── Restart ── */
  const handleRestart = () => {
    clearInterval(timerRef.current);
    clearInterval(countRef.current);
    clearInterval(wpmTimerRef.current);
    cancelAnimationFrame(animRef.current);
    if (mediaRef.current && mediaRef.current.state !== 'inactive') mediaRef.current.stop();
    if (visualMediaRef.current && visualMediaRef.current.state !== 'inactive') visualMediaRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    waveHistRef.current = Array(50).fill(0);
    setWaveformBars(Array(50).fill(0));
    silenceStartRef.current = null;
    clearTimeout(hintDismissRef.current);
    setShowHint(false);
    setStatus('idle');
    setElapsedSec(0);
    setHighlightIdx(-1);
    chunksRef.current = [];
    visualMediaRef.current = null;
    visualChunksRef.current = [];
    visualMimeRef.current = '';
  };

  const isRecording = status === 'recording';
  const isPaused    = status === 'paused';
  const isActive    = isRecording || isPaused;

  const handleBackPress = useCallback(() => {
    if (isActive) {
      setShowExitConfirm(true);
      return;
    }
    navigate(-1);
  }, [isActive, navigate]);

  useEffect(() => {
    if (!isActive) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isActive]);

  /* ── Guard: no script in scripted mode ── */
  if (!script && focus !== 'free') {
    return (
      <div className="tp-page">
        <div className="tp-header">
          <BackButton onClick={handleBackPress} />
          <span className="tp-header-title">Training</span>
          <div className="tp-header-spacer" />
        </div>
        <div className="tp-empty">
          <span className="tp-empty-icon">⚠️</span>
          <p className="tp-empty-title">No script selected</p>
          <p className="tp-empty-desc">Go back and select a script to start training.</p>
          <button className="tp-go-back-btn" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const title     = focus === 'scripted' ? (script?.title || 'Training') : 'Free Speech';
  const modeLabel  = focus === 'scripted' ? 'Scripted Mode' : 'Free Speech Mode';

  return (
    <div className="tp-page">
      {/* ── Dark Header ── */}
      <div className="tp-header">
        <BackButton onClick={handleBackPress} />
        <span className="tp-header-title">{title}</span>
        {focus === 'scripted' ? (
          <button className="tp-settings-btn" onClick={() => setShowSettings(true)} aria-label="Settings">
            <SettingsGearIcon />
          </button>
        ) : (
          <div className="tp-header-spacer" />
        )}
      </div>

      {/* ── Main Content ── */}
      <div className={`tp-content${focus === 'scripted' ? ' tp-content--split' : ''}`}>

        {/* ── Left / Main Column ── */}
        <div className="tp-left">
          {/* Mode label + REC badge */}
          <div className="tp-cam-header">
            <span className="tp-mode-label">{modeLabel}</span>
            {isActive && (
              <span className="tp-rec-badge">
                <span className="tp-rec-dot" />
                REC {formatTime(elapsedSec)}
              </span>
            )}
          </div>

          {/* Camera */}
          <div className="tp-camera-wrap">
            {focus === 'scripted' ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="tp-camera"
                  aria-label="Camera preview"
                />
                {/* Placeholder shown before recording starts */}
                {!isActive && (
                  <div className="tp-camera-idle">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 7l-7 5 7 5V7z"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    <span className="tp-camera-idle-label">Camera starts on record</span>
                  </div>
                )}
              </>
            ) : (
              <div className="tp-camera-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
            )}
          </div>

          {/* Waveform history — 50 bars */}
          <div className="tp-waveform">
            {waveformBars.map((lvl, i) => (
              <div
                key={i}
                className="tp-wave-bar"
                style={{ height: `${Math.max(4, lvl * 64)}px` }}
              />
            ))}
          </div>

          {/* Status label */}
          <div className="tp-status-label">
            {isRecording && <><span className="tp-pulse-dot" /><span>Recording</span></>}
            {isPaused    && <><span className="tp-paused-dot" /><span>Paused</span></>}
            {status === 'idle' && <span className="tp-idle-label">Tap record to start</span>}
          </div>

          {/* Controls */}
          <div className="tp-controls">
            {/* Pause / Resume */}
            <div className="tp-ctrl-col">
              <button
                className="tp-ctrl-btn"
                onClick={handlePause}
                disabled={!isActive}
                aria-label={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <PlayIcon /> : <PauseIcon />}
              </button>
              <span className="tp-ctrl-label">{isPaused ? 'Resume' : 'Pause'}</span>
            </div>

            {/* Record / Stop */}
            <div className="tp-ctrl-col">
              <button
                className={`tp-record-btn${isActive ? ' tp-record-btn--active' : ''}${status === 'idle' && !shouldAutoStart ? ' tp-record-btn--hint' : ''}`}
                onClick={isActive ? stopRecording : startCountdown}
                aria-label={isActive ? 'Stop and analyse' : 'Start recording'}
              >
                <div className="tp-record-inner">
                  <div className={`tp-record-dot${isActive ? ' tp-record-dot--active' : ''}`} />
                </div>
              </button>
              {status === 'idle' && !shouldAutoStart && (
                <div className="tp-record-tooltip" role="status" aria-live="polite">
                  Click Record to start
                </div>
              )}
              <span className="tp-ctrl-label">{isActive ? 'Stop' : 'Record'}</span>
            </div>

            {/* Restart */}
            <div className="tp-ctrl-col">
              <button
                className="tp-ctrl-btn"
                onClick={handleRestart}
                disabled={status === 'idle' || status === 'countdown'}
                aria-label="Restart"
              >
                <RestartIcon />
              </button>
              <span className="tp-ctrl-label">Restart</span>
            </div>
          </div>
        </div>

        {/* ── Right Column — Teleprompter (scripted only) ── */}
        {focus === 'scripted' && (
          <div className="tp-right">
            <div className="tp-script-header">
              <span className="tp-script-label">AUTO-SCROLLING SCRIPT</span>
              <span className="tp-script-sub">AI-Paced Teleprompter Active</span>
            </div>

            <div className="tp-teleprompter" ref={scriptRef} style={{ fontSize: `${fontSize}px` }}>
              {scriptWords.map((word, idx) => (
                <span
                  key={idx}
                  data-idx={idx}
                  className={`tp-word${idx < highlightIdx ? ' tp-word--passed' : ''}${idx === highlightIdx ? ' tp-word--current' : ''}`}
                >
                  {word}{' '}
                </span>
              ))}
              {scriptWords.length === 0 && (
                <p className="tp-script-empty">{script?.content || ''}</p>
              )}
            </div>

            <div className="tp-scroll-speed-row">
              <span className="tp-scroll-label">SCROLL SPEED</span>
              <span className="tp-wpm-value">{wpm} WPM</span>
              <input
                type="range"
                min="60"
                max="200"
                step="5"
                value={wpm}
                onChange={(e) => setWpm(Number(e.target.value))}
                className="tp-wpm-slider"
                aria-label="Words per minute"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Countdown Overlay ── */}
      {status === 'countdown' && (
        <div className="tp-overlay">
          <div className="tp-countdown-box">
            <span className="tp-countdown-num">{countdown > 0 ? countdown : 'Start!'}</span>
          </div>
        </div>
      )}

      {/* ── Analysing Overlay ── */}
      {status === 'analysing' && (
        <div className="tp-overlay">
          <div className="tp-countdown-box">
            <span className="tp-analysing-spinner" />
            <span className="tp-analysing-text">Analysing…</span>
          </div>
        </div>
      )}

      {/* ── Error Banner ── */}
      {status === 'error' && (
        <div className="tp-error-banner">
          <span>{errorMsg}</span>
          <button className="tp-error-retry" onClick={handleRestart}>Retry</button>
        </div>
      )}

      {/* ── Settings Modal ── */}
        {/* ── Permission Denied Overlay ── */}
        {status === 'permission-denied' && (
          <div className="tp-overlay tp-permission-overlay">
            <div className="tp-permission-box">
              <div className="tp-permission-icon" aria-hidden="true">🎙️</div>
              <h2 className="tp-permission-title">
                {focus === 'scripted' ? 'Microphone & Camera Required' : 'Microphone Required'}
              </h2>
              <p className="tp-permission-desc">
                Bigkas needs access to your {focus === 'scripted' ? 'microphone and camera' : 'microphone'} to record your session.
              </p>
              <ol className="tp-permission-steps">
                <li>Click the <strong>lock 🔒</strong> icon in your browser&rsquo;s address bar</li>
                <li>Set <strong>Microphone{focus === 'scripted' ? ' and Camera' : ''}</strong> to <strong>Allow</strong></li>
                <li>Tap <strong>Try Again</strong> below</li>
              </ol>
              <div className="tp-permission-actions">
                <button
                  className="tp-permission-retry"
                  onClick={() => {
                    autoStartTriggeredRef.current = false;
                    startCountdown();
                  }}
                >
                  Try Again
                </button>
                <button className="tp-permission-back" onClick={() => navigate(-1)}>
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Settings Modal ── */}
      {showSettings && (
        <div className="tp-modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="tp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tp-modal-header">
              <span className="tp-modal-title">Training Settings</span>
              <button className="tp-modal-close" onClick={() => setShowSettings(false)}>✕</button>
            </div>

            <div className="tp-modal-row">
              <label className="tp-modal-label">Font Size</label>
              <span className="tp-modal-val">{fontSize}px</span>
              <input type="range" min="12" max="24" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="tp-modal-slider" />
            </div>

            <div className="tp-modal-row">
              <label className="tp-modal-label">WPM Speed</label>
              <span className="tp-modal-val">{wpm} WPM</span>
              <input type="range" min="60" max="200" step="5" value={wpm} onChange={(e) => setWpm(Number(e.target.value))} className="tp-modal-slider" />
            </div>

            <div className="tp-modal-row tp-modal-row--toggle">
              <label className="tp-modal-label">Auto-Scroll</label>
              <button
                className={`tp-toggle-btn${autoScroll ? ' tp-toggle-btn--on' : ''}`}
                onClick={() => setAutoScroll((v) => !v)}
                aria-checked={autoScroll}
                role="switch"
              >
                <span className="tp-toggle-thumb" />
              </button>
            </div>

            <div className="tp-modal-row">
              <label className="tp-modal-label">Scroll Speed</label>
              <span className="tp-modal-val">{scrollSpeed}</span>
              <input type="range" min="0" max="10" value={scrollSpeed} onChange={(e) => setScrollSpeed(Number(e.target.value))} className="tp-modal-slider" />
            </div>

            <button className="tp-modal-done" onClick={() => setShowSettings(false)}>Done</button>
          </div>
        </div>
      )}

      {/* ── Silence-intervention hint toast ── */}
      {showHint && (
        <div
          className="tp-hint-toast"
          role="status"
          aria-live="polite"
          onClick={() => setShowHint(false)}
        >
          <span className="tp-hint-text">{hintContent}</span>
          <button
            className="tp-hint-dismiss"
            aria-label="Dismiss hint"
            onClick={(e) => { e.stopPropagation(); setShowHint(false); }}
          >
            ✕
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={showExitConfirm}
        title="Quit session?"
        message="You have an ongoing recording. If you leave now, this recording will be discarded."
        confirmLabel="Quit"
        cancelLabel="Stay"
        type="warning"
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => {
          handleRestart();
          setShowExitConfirm(false);
          navigate(-1);
        }}
      />
    </div>
  );
}

export default TrainingPage;
