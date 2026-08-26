/**
 * Simple in-memory rate limiter for auth endpoints.
 * For production, consider using a Redis-backed store.
 */

const windowMs = 15 * 60 * 1000; // 15 minutes
const maxAttempts = 10; // 10 attempts per window

const store = new Map();

function cleanup() {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now - value.resetAt > windowMs) {
      store.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

/**
 * Check if a key (IP or email) has exceeded the rate limit.
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(key) {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now - existing.resetAt > windowMs) {
    store.set(key, { count: 1, resetAt: now });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
  }

  if (existing.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt + windowMs };
  }

  existing.count += 1;
  return { allowed: true, remaining: maxAttempts - existing.count, resetAt: existing.resetAt + windowMs };
}

/**
 * Get the reset timestamp for a key (for client-side display)
 */
export function getRateLimitReset(key) {
  const existing = store.get(key);
  if (!existing) return null;
  return existing.resetAt + windowMs;
}
