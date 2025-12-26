import DOMPurify from 'dompurify';

// Helper to get DOMPurify instance
function getDOMPurify() {
  if (typeof window !== 'undefined') {
    // Client-side: use browser DOMPurify
    return DOMPurify;
  } else {
    // Server-side: create JSDOM instance
    try {
      const { JSDOM } = require('jsdom');
      const window = new JSDOM('').window;
      return DOMPurify(window as any);
    } catch (error) {
      // Fallback: return basic DOMPurify (may not work perfectly on server)
      return DOMPurify;
    }
  }
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(dirty: string): string {
  const purify = getDOMPurify();
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text (remove all HTML)
 */
export function sanitizeText(dirty: string): string {
  const purify = getDOMPurify();
  return purify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize user input for display
 */
export function sanitizeUserInput(input: string | null | undefined): string {
  if (!input) return '';
  return sanitizeText(String(input));
}

/**
 * Sanitize object with string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeUserInput(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  return sanitized;
}
