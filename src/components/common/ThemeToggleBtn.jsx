import { useTheme } from '../../context/useTheme';
import './ThemeToggleBtn.css';

/**
 * Floating theme toggle button — circular reveal animation identical to Navbar.
 * Drop onto any page that doesn't include the Navbar.
 */
function ThemeToggleBtn({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleToggle = (e) => {
    if (document.body.dataset.themeAnimating === '1') return;
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const radius = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy));

    const overlay = document.createElement('div');
    overlay.className = 'theme-anim';
    overlay.style.setProperty('--x', `${cx}px`);
    overlay.style.setProperty('--y', `${cy}px`);
    overlay.style.setProperty('--r', `${radius}px`);
    overlay.style.setProperty('--anim-bg', isDark ? '#F5F5F5' : '#121212');
    document.body.dataset.themeAnimating = '1';
    document.documentElement.setAttribute('data-no-transition', '');
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    const cleanup = () => {
      toggleTheme();
      overlay.remove();
      delete document.body.dataset.themeAnimating;
      requestAnimationFrame(() => {
        document.documentElement.removeAttribute('data-no-transition');
      });
    };

    overlay.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(() => {
      if (document.body.contains(overlay)) cleanup();
    }, 700);
  };

  return (
    <button
      className={`theme-toggle-btn ${className}`}
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        /* Sun icon */
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1"  x2="12" y2="3"  />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1"  y1="12" x2="3"  y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"  />
        </svg>
      ) : (
        /* Moon icon */
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export default ThemeToggleBtn;
