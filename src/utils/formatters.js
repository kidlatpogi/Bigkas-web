/**
 * Formatting utility functions
 */

/**
 * Format date to readable string
 * @param {Date|string} date 
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date));
}

/**
 * Format date with time
 * @param {Date|string} date 
 * @returns {string}
 */
export function formatDateTime(date) {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format duration in seconds to mm:ss
 * @param {number} seconds 
 * @returns {string}
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format percentage
 * @param {number} value - Value between 0 and 1, or 0 and 100
 * @param {number} decimals 
 * @returns {string}
 */
export function formatPercentage(value, decimals = 0) {
  const percentage = value <= 1 ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Capitalize first letter
 * @param {string} str 
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
