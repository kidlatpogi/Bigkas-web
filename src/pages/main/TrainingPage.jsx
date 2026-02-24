import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionContext } from '../../context/useSessionContext';
import { buildRoute } from '../../utils/constants';
import './InnerPages.css';
import './TrainingPage.css';

function TrainingPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { analyseAndSave } = useSessionContext();

  const script     = state?.script     || null;
  const focus      = state?.focus      || 'scripted';
  const freeTopic  = state?.freeTopic  || '';

  const [status, setStatus]         = useState('idle');    // idle | countdown | recording | analysing | error
  const [countdown, setCountdown]   = useState(3);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [errorMsg, setErrorMsg]     = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  // Teleprompter scroll
  const scriptRef  = useRef(null);
  const timerRef   = useRef(null);
  const countRef   = useRef(null);
  const mediaRef   = useRef(null);   // MediaRecorder
  const chunksRef  = useRef([]);
  const streamRef  = useRef(null);
  const analyserRef = useRef(null);
  const animRef    = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(countRef.current);
      cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio level analyser
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyserRef.current = analyser;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(100, avg * 2));
        animRef.current = requestAnimationFrame(tick);
      };
      tick();

      const recorder = new MediaRecorder(stream, { mimeType: getSupportedMime() });
      mediaRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(200);
      setStatus('recording');
      setElapsedSec(0);

      timerRef.current = setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);
    } catch {
      setErrorMsg('Microphone access denied. Please allow microphone access and try again.');
      setStatus('error');
    }
  }, []);

  const startCountdown = useCallback(() => {
    setStatus('countdown');
    setCountdown(3);
    let c = 3;
    countRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countRef.current);
        startRecording();
      }
    }, 1000);
  }, [startRecording]);

  const stopRecording = () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animRef.current);
    const recorder = mediaRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    recorder.onstop = async () => {
      const mime = getSupportedMime();
      const blob = new Blob(chunksRef.current, { type: mime });
      streamRef.current?.getTracks().forEach(t => t.stop());
      setStatus('analysing');

      try {
        const result = await analyseAndSave({
          audioBlob:    blob,
          targetText:   focus === 'scripted' ? (script?.content || '') : (freeTopic || 'Free speech session'),
          scriptType:   focus,
          difficulty:   'medium',
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

  const handlePause = () => {
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.pause();
      clearInterval(timerRef.current);
      setStatus('paused');
    } else if (mediaRef.current?.state === 'paused') {
      mediaRef.current.resume();
      timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
      setStatus('recording');
    }
  };

  const handleRestart = () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animRef.current);
    mediaRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setStatus('idle');
    setElapsedSec(0);
    setAudioLevel(0);
    chunksRef.current = [];
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!script && focus !== 'free') {
    return (
      <div className="inner-page">
        <div className="inner-page-header">
          <button className="inner-page-back" onClick={() => navigate(-1)}>‹</button>
          <h1 className="inner-page-title">Training</h1>
        </div>
        <div className="empty-state">
          <span className="empty-icon">⚠️</span>
          <p className="empty-title">No script selected</p>
          <p className="empty-desc">Go back and select a script to start training.</p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="training-page">
      {/* Header */}
      <div className="training-header">
        <button className="inner-page-back" onClick={() => navigate(-1)}>‹</button>
        <span className="training-header-title">
          {focus === 'scripted' ? (script?.title || 'Training') : 'Free Speech'}
        </span>
      </div>

      {/* Script / topic display */}
      <div className="teleprompter" ref={scriptRef}>
        {focus === 'scripted' ? (
          <p className="teleprompter-text">{script?.content || ''}</p>
        ) : (
          <p className="teleprompter-topic">
            {freeTopic ? `Topic: ${freeTopic}` : 'Speak freely on any topic.'}
          </p>
        )}
      </div>

      {/* Audio waveform bars */}
      <div className="audio-visualiser">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="vis-bar"
            style={{
              height: `${Math.max(6, (audioLevel / 100) * 40 * (0.5 + Math.abs(Math.sin(i * 1.5)) * 0.5))}px`,
              opacity: status === 'recording' ? 1 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="training-timer">{formatTime(elapsedSec)}</div>

      {/* Countdown overlay */}
      {status === 'countdown' && (
        <div className="countdown-overlay">
          <span className="countdown-num">{countdown}</span>
        </div>
      )}

      {/* Analysing overlay */}
      {status === 'analysing' && (
        <div className="countdown-overlay">
          <span style={{ color: '#FFF', fontSize: 20, fontWeight: 700 }}>Analysing…</span>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="page-error" style={{ margin: '0 24px 16px' }}>{errorMsg}</div>
      )}

      {/* Controls */}
      <div className="training-controls">
        {status === 'idle' && (
          <button className="ctrl-btn record" onClick={startCountdown}>
            ● Record
          </button>
        )}

        {(status === 'recording' || status === 'paused') && (
          <>
            <button className="ctrl-btn pause" onClick={handlePause}>
              {status === 'paused' ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button className="ctrl-btn stop" onClick={stopRecording}>
              ■ Stop &amp; Analyse
            </button>
            <button className="ctrl-btn restart" onClick={handleRestart}>
              ↺ Restart
            </button>
          </>
        )}

        {status === 'error' && (
          <button className="ctrl-btn record" onClick={handleRestart}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

function getSupportedMime() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

export default TrainingPage;
