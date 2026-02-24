import { useTheme } from '../../context/useTheme';
import './ThemeToggleBtn.css';

/**
 * ThemeToggleBtn — 1:1 clone of the Portfolio ModeSwitcher.
 * Circular reveal animation from the button's position.
 * Placed on any page that does NOT include the Navbar.
 *
 * Source: kidlatpogi/Portfolio  src/JS/ModeSwitcher.jsx
 */
function ThemeToggleBtn({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  function handleToggle(e) {
    if (document.body.dataset.themeAnimating === '1') return;

    const nextIsDark = !isDark;

    const btn  = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const vw   = Math.max(document.documentElement.clientWidth  || 0, window.innerWidth  || 0);
    const vh   = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const radius = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy));

    const overlay = document.createElement('div');
    overlay.className = 'theme-anim';
    overlay.style.setProperty('--x', `${cx}px`);
    overlay.style.setProperty('--y', `${cy}px`);
    overlay.style.setProperty('--r', `${radius}px`);
    // Target theme's background colour
    const targetBg = nextIsDark ? '#121212' : '#F5F5F5';
    overlay.style.setProperty('--anim-bg', targetBg);

    document.body.dataset.themeAnimating = '1';
    document.body.appendChild(overlay);

    requestAnimationFrame(() => { overlay.classList.add('active'); });

    const cleanup = () => {
      // Suppress colour transitions while the theme switches under the overlay
      document.documentElement.setAttribute('data-no-transition', '');
      toggleTheme();
      overlay.remove();
      delete document.body.dataset.themeAnimating;
      requestAnimationFrame(() => {
        document.documentElement.removeAttribute('data-no-transition');
      });
    };

    let cleaned = false;
    const onEnd = (ev) => {
      // Only react to the clip-path transition ending, not opacity or others
      if (ev?.propertyName && ev.propertyName !== 'clip-path') return;
      if (cleaned) return;
      cleaned = true;
      cleanup();
      overlay.removeEventListener('transitionend', onEnd);
      overlay.removeEventListener('animationend',  onEnd);
      clearTimeout(timer);
    };

    overlay.addEventListener('transitionend', onEnd);
    overlay.addEventListener('animationend',  onEnd);

    // Fallback in case neither event fires
    const timer = setTimeout(() => {
      if (document.body.dataset.themeAnimating === '1') onEnd();
    }, 1000);
  }

  return (
    <div className={`theme-toggle-wrap ${className}`}>
      <button
        type="button"
        className={`theme-toggle-btn ${isDark ? 'mode-dark' : 'mode-light'}`}
        onClick={handleToggle}
        aria-pressed={!isDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? (
          /* Sun — shown in dark mode to switch to light */
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1"  x2="12" y2="3"  />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22"   x2="5.64"  y2="5.64"  />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1"  y1="12" x2="3"  y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
            <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
          </svg>
        ) : (
          /* Moon — shown in light mode to switch to dark */
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default ThemeToggleBtn;
