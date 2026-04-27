/**
 * Debounce a function call
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Common class combining utility 
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Re-initialize Lucide icons in a given container
 */
export function renderIcons(root = document) {
  if (window.lucide && window.lucide.createIcons && window.lucide.icons) {
    window.lucide.createIcons({
      icons: window.lucide.icons,
      root: root
    });
  }
}



