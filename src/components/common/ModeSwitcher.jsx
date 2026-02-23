/**
 * ModeSwitcher — 1:1 from Portfolio repo (kidlatpogi/Portfolio)
 * Adapted to use Bigkas ThemeContext (data-theme on <html>)
 * Features: Fixed-position Sun/Moon toggle with expanding circular animation
 */
import React, { useState, useCallback } from 'react';
import { useTheme } from '../../context/useTheme';
import MoonImg from '../../assets/Moon.png';
import SunImg from '../../assets/Sun.png';
import './ModeSwitcher.css';

export default function ModeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const [animating, setAnimating] = useState(false);

  const toggle = useCallback((e) => {
    // prevent toggle if an animation is already running
    if (animating) return;

    const nextIsLight = !isLight;

    // compute click / button center coords
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // compute radius to farthest corner
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const distX = Math.max(cx, vw - cx);
    const distY = Math.max(cy, vh - cy);
    const radius = Math.hypot(distX, distY);

    // create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'theme-anim';
    overlay.style.setProperty('--x', `${cx}px`);
    overlay.style.setProperty('--y', `${cy}px`);
    overlay.style.setProperty('--r', `${radius}px`);

    // set the overlay color to the target theme's background
    const targetBg = nextIsLight ? '#F5F5F5' : '#121212';
    overlay.style.setProperty('--anim-bg', targetBg);

    // mark animating
    setAnimating(true);
    document.body.appendChild(overlay);

    // trigger the transition on the next frame
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    const cleanup = () => {
      // actually toggle the theme now that the animation covered the screen
      toggleTheme();

      // remove overlay and unset animating
      overlay.remove();
      setAnimating(false);
    };

    // prefer transitionend but also set a timeout as a fallback
    const onEnd = () => {
      cleanup();
      overlay.removeEventListener('transitionend', onEnd);
      overlay.removeEventListener('animationend', onEnd);
      clearTimeout(timer);
    };

    overlay.addEventListener('transitionend', onEnd);
    overlay.addEventListener('animationend', onEnd);

    const timer = setTimeout(() => {
      // fallback if events don't fire
      if (animating) onEnd();
    }, 1000);
  }, [isLight, animating, toggleTheme]);

  return (
    <div className="ModeSwitcher">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={isLight}
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        title={isLight ? 'Dark mode' : 'Light mode'}
        className={`mode-btn ${isLight ? 'light' : 'dark'}`}
      >
        {isLight ? (
          <img src={MoonImg} alt="Moon" />
        ) : (
          <img src={SunImg} alt="Sun" />
        )}
      </button>
    </div>
  );
}
