import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sessionApi } from '../../api/sessionApi';
import { formatPercentage } from '../../utils/formatters';
import Card from '../../components/common/Card';
import './SessionPages.css';

/**
 * Session Result Page
 * Shows pronunciation analysis results
 */
function SessionResultPage() {
  const { sessionId } = useParams();
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await sessionApi.getSessionResults(sessionId);
        setResults(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load results');
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchResults();
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="session-page">
        <div className="loading-state">Analyzing pronunciation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-page">
        <div className="error-state">
          <p>{error}</p>
          <Link to="/history" className="back-link">← Back to History</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="session-page">
      <div className="page-header">
        <Link to={`/session/${sessionId}`} className="back-link">← Back to Session</Link>
        <h1 className="page-title">Analysis Results</h1>
      </div>

      <div className="results-content">
        {/* Overall Score */}
        <Card className="score-card">
          <div className="overall-score">
            <div className={`score-circle score-${getScoreLevel(results?.overallScore || 0)}`}>
              <span className="score-number">{Math.round(results?.overallScore || 0)}</span>
              <span className="score-label">Score</span>
            </div>
            <div className="score-message">
              {getScoreMessage(results?.overallScore || 0)}
            </div>
          </div>
        </Card>

        {/* Detailed Metrics */}
        <Card className="metrics-card">
          <h2 className="card-title">Detailed Analysis</h2>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">Pronunciation Accuracy</span>
              <div className="metric-bar">
                <div 
                  className="metric-fill" 
                  style={{ width: formatPercentage(results?.pronunciationAccuracy || 0) }}
                />
              </div>
              <span className="metric-value">
                {formatPercentage(results?.pronunciationAccuracy || 0)}
              </span>
            </div>
            
            <div className="metric-item">
              <span className="metric-label">Fluency</span>
              <div className="metric-bar">
                <div 
                  className="metric-fill" 
                  style={{ width: formatPercentage(results?.fluency || 0) }}
                />
              </div>
              <span className="metric-value">
                {formatPercentage(results?.fluency || 0)}
              </span>
            </div>

            <div className="metric-item">
              <span className="metric-label">Intonation</span>
              <div className="metric-bar">
                <div 
                  className="metric-fill" 
                  style={{ width: formatPercentage(results?.intonation || 0) }}
                />
              </div>
              <span className="metric-value">
                {formatPercentage(results?.intonation || 0)}
              </span>
            </div>
          </div>
        </Card>

        {/* Feedback */}
        {results?.feedback && (
          <Card className="feedback-card">
            <h2 className="card-title">Feedback</h2>
            <p className="feedback-text">{results.feedback}</p>
          </Card>
        )}

        {/* Actions */}
        <div className="result-actions">
          <Link to="/practice" className="action-btn action-btn-primary">
            Practice Again
          </Link>
          <Link to="/history" className="action-btn action-btn-secondary">
            View All History
          </Link>
        </div>
      </div>
    </div>
  );
}

function getScoreLevel(score) {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function getScoreMessage(score) {
  if (score >= 90) return 'Excellent! Your pronunciation is outstanding!';
  if (score >= 80) return 'Great job! Keep up the good work!';
  if (score >= 70) return 'Good progress! A little more practice will help.';
  if (score >= 50) return 'Nice try! Focus on the highlighted areas.';
  return 'Keep practicing! Every attempt makes you better.';
}

export default SessionResultPage;
