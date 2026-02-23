import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('bigkas-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Add transitioning class to prevent flicker
    root.classList.add('theme-transitioning');
    
    // Set theme attribute
    root.setAttribute('data-theme', theme);
    
    // Set background color immediately to prevent white flash
    root.style.backgroundColor = theme === 'dark' ? '#121212' : '#F5F5F5';
    
    // Remove transitioning class after transition completes
    const timer = setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 300);
    
    localStorage.setItem('bigkas-theme', theme);
    
    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
