/**
 * Utility functions for formatting values
 */

/**
 * Format a number with K/M suffixes for readability
 */
export const formatNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Escape HTML to prevent XSS attacks
 */
export const escapeHtml = (str: string): string => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Get current date/time formatted for display
 */
export const getFormattedDateTime = (): { date: string; time: string } => {
  const d = new Date();
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString();
  return {
    date,
    time,
  };
};
