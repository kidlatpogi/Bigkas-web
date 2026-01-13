/**
 * Theme configuration for styled-components or CSS-in-JS
 */

export const theme = {
  colors: {
    primary: {
      main: '#4F46E5',
      dark: '#4338CA',
      light: '#818CF8',
      contrast: '#FFFFFF',
    },
    secondary: {
      main: '#10B981',
      dark: '#059669',
      light: '#34D399',
      contrast: '#FFFFFF',
    },
    accent: '#F59E0B',
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
      hover: '#F3F4F6',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      muted: '#9CA3AF',
      disabled: '#D1D5DB',
    },
    border: '#E5E7EB',
    divider: '#D1D5DB',
    status: {
      error: '#EF4444',
      warning: '#F59E0B',
      success: '#10B981',
      info: '#3B82F6',
    },
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  transitions: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease',
  },
  
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
  },
};

// Dark theme overrides
export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: {
      default: '#111827',
      paper: '#1F2937',
      hover: '#374151',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      muted: '#9CA3AF',
      disabled: '#6B7280',
    },
    border: '#374151',
    divider: '#4B5563',
  },
};

export default theme;
