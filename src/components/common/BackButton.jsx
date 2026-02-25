import { useNavigate } from 'react-router-dom';
import './BackButton.css';

/**
 * BackButton — reusable circular back navigation button.
 * If `onClick` is provided, calls that; otherwise calls navigate(-1).
 */
function BackButton({ onClick, label = 'Go back', className = '', style }) {
  const navigate = useNavigate();

  const handleClick = onClick || (() => navigate(-1));

  return (
    <button
      type="button"
      className={`back-btn ${className}`.trim()}
      onClick={handleClick}
      aria-label={label}
      style={style}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default BackButton;
