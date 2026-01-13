import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '../../context/useSessionContext';
import AudioRecordButton from '../../components/audio/AudioRecordButton';
import AudioWaveform from '../../components/audio/AudioWaveform';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';
import './MainPages.css';

/**
 * Practice Page Component
 * Where users record their pronunciation
 */
function PracticePage() {
  const navigate = useNavigate();
  const { currentSession, createSession, submitAudio, isLoading } = useSessionContext();
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [practiceText, setPracticeText] = useState('');

  // Sample practice prompts
  const prompts = [
    'Magandang umaga po.',
    'Kumusta ka na?',
    'Salamat sa iyong tulong.',
    'Mahal kita.',
    'Paalam, hanggang sa muli.',
  ];

  const handleSelectPrompt = (prompt) => {
    setPracticeText(prompt);
  };

  const handleRecordingComplete = (blob) => {
    setAudioBlob(blob);
    setIsRecording(false);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setAudioBlob(null);
  };

  const handleSubmit = async () => {
    if (!audioBlob || !practiceText) return;

    // Create session if not exists
    let session = currentSession;
    if (!session) {
      const result = await createSession({ text: practiceText });
      if (!result.success) return;
      session = result.data;
    }

    // Submit audio
    const result = await submitAudio(session.id, audioBlob);
    if (result.success) {
      navigate(`/session/${session.id}/result`);
    }
  };

  const handleReset = () => {
    setAudioBlob(null);
    setIsRecording(false);
  };

  return (
    <div className="practice-page">
      <div className="page-header">
        <h1 className="page-title">Practice Pronunciation</h1>
        <p className="page-subtitle">Select a phrase and record your pronunciation</p>
      </div>

      <div className="practice-content">
        <Card className="practice-prompts-card">
          <h2 className="card-title">Choose a Phrase</h2>
          <div className="prompts-list">
            {prompts.map((prompt, index) => (
              <button
                key={index}
                className={`prompt-item ${practiceText === prompt ? 'prompt-item-selected' : ''}`}
                onClick={() => handleSelectPrompt(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </Card>

        <Card className="practice-recording-card">
          <h2 className="card-title">Record Your Voice</h2>
          
          {practiceText ? (
            <>
              <div className="practice-text-display">
                <p className="practice-text">{practiceText}</p>
              </div>

              <div className="recording-area">
                <AudioRecordButton
                  isRecording={isRecording}
                  onStart={handleStartRecording}
                  onComplete={handleRecordingComplete}
                  disabled={isLoading}
                />
                
                {isRecording && (
                  <AudioWaveform isActive={isRecording} />
                )}
              </div>

              {audioBlob && !isRecording && (
                <div className="recording-preview">
                  <audio controls src={URL.createObjectURL(audioBlob)} />
                  <div className="recording-actions">
                    <PrimaryButton 
                      variant="secondary" 
                      onClick={handleReset}
                    >
                      Re-record
                    </PrimaryButton>
                    <PrimaryButton 
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Submitting...' : 'Submit'}
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="practice-placeholder">
              Select a phrase from the list to start practicing
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

export default PracticePage;
