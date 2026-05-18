/**
 * Simple in-memory rate limiting for password reset requests
 * Prevents abuse by limiting requests per email
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 10 * 60 * 1000)

/**
 * Check if request is rate limited
 * @param email - Email address
 * @param maxRequests - Maximum requests allowed (default: 3)
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns true if request should be allowed, false if rate limited
 */
export function checkRateLimit(
  email: string,
  maxRequests: number = 3,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; retryAfter?: number } {
  const key = email.toLowerCase()
  const now = Date.now()
  
  const entry = rateLimitMap.get(key)
  
  if (!entry) {
    // First request
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs
    })
    return { allowed: true }
  }
  
  // Check if window has expired
  if (now > entry.resetAt) {
    // Reset the counter
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs
    })
    return { allowed: true }
  }
  
  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000) // seconds
    return { 
      allowed: false, 
      retryAfter 
    }
  }
  
  // Increment counter
  entry.count++
  return { allowed: true }
}

/**
 * Clear rate limit for an email (useful for testing)
 */
export function clearRateLimit(email: string): void {
  rateLimitMap.delete(email.toLowerCase())
}

