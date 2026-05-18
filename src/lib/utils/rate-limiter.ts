/**
 * Rate Limiter Service
 * 
 * This service provides rate limiting for external API calls
 * to prevent hitting API limits and ensure fair usage.
 */

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  delayMs?: number
  retryAfterMs?: number
}

export interface RateLimitStatus {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

class RateLimiter {
  private limits: Map<string, { count: number; resetTime: number }> = new Map()
  private defaultConfig: RateLimitConfig = {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    delayMs: 1000, // 1 second
    retryAfterMs: 5000 // 5 seconds
  }

  /**
   * Check if a request is allowed for a given key
   */
  checkLimit(key: string, config?: Partial<RateLimitConfig>): RateLimitStatus {
    const finalConfig = { ...this.defaultConfig, ...config }
    const now = Date.now()
    const limit = this.limits.get(key)

    if (!limit) {
      // First request for this key
      this.limits.set(key, {
        count: 1,
        resetTime: now + finalConfig.windowMs
      })
      return {
        allowed: true,
        remaining: finalConfig.maxRequests - 1,
        resetTime: now + finalConfig.windowMs
      }
    }

    // Check if window has reset
    if (now > limit.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + finalConfig.windowMs
      })
      return {
        allowed: true,
        remaining: finalConfig.maxRequests - 1,
        resetTime: now + finalConfig.windowMs
      }
    }

    // Check if limit exceeded
    if (limit.count >= finalConfig.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: limit.resetTime,
        retryAfter: limit.resetTime - now
      }
    }

    // Increment counter
    limit.count++
    return {
      allowed: true,
      remaining: finalConfig.maxRequests - limit.count,
      resetTime: limit.resetTime
    }
  }

  /**
   * Wait for rate limit to reset
   */
  async waitForReset(key: string, config?: Partial<RateLimitConfig>): Promise<void> {
    const status = this.checkLimit(key, config)
    
    if (!status.allowed && status.retryAfter) {
      console.log(`⏳ Rate limit exceeded for ${key}, waiting ${status.retryAfter}ms`)
      await new Promise(resolve => setTimeout(resolve, status.retryAfter))
    }
  }

  /**
   * Apply delay between requests
   */
  async applyDelay(config?: Partial<RateLimitConfig>): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config }
    if (finalConfig.delayMs && finalConfig.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, finalConfig.delayMs))
    }
  }

  /**
   * Make a rate-limited request
   */
  async makeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    config?: Partial<RateLimitConfig>
  ): Promise<T> {
    // Check rate limit
    const status = this.checkLimit(key, config)
    
    if (!status.allowed) {
      await this.waitForReset(key, config)
    }

    try {
      const result = await requestFn()
      
      // Apply delay after successful request
      await this.applyDelay(config)
      
      return result
    } catch (error) {
      // If it's a rate limit error, wait and retry once
      if (error instanceof Error && error.message.includes('429')) {
        console.log(`🔄 Rate limit error for ${key}, retrying after delay`)
        await this.waitForReset(key, config)
        await this.applyDelay(config)
        return requestFn()
      }
      throw error
    }
  }

  /**
   * Get current status for a key
   */
  getStatus(key: string, config?: Partial<RateLimitConfig>): RateLimitStatus {
    return this.checkLimit(key, config)
  }

  /**
   * Reset rate limit for a key
   */
  resetLimit(key: string): void {
    this.limits.delete(key)
  }

  /**
   * Reset all rate limits
   */
  resetAllLimits(): void {
    this.limits.clear()
  }

  /**
   * Get all active rate limits
   */
  getAllLimits(): { [key: string]: { count: number; resetTime: number } } {
    const result: { [key: string]: { count: number; resetTime: number } } = {}
    for (const [key, limit] of this.limits.entries()) {
      result[key] = { ...limit }
    }
    return result
  }

  /**
   * Update default configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter()
export default rateLimiter
