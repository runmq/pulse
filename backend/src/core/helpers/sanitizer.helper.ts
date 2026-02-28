const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization', 'accessToken'];
const REDACTED = '**********';

/**
 * Redacts sensitive fields from an object for safe logging.
 */
export function sanitizeBody(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      sanitized[key] = REDACTED;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
