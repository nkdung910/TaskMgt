/**
 * RSS Feed Parser Service
 * 
 * This service handles parsing RSS feeds from major tech sources
 * with proper error handling and rate limiting.
 */

import Parser from 'rss-parser'

export interface RSSFeedItem {
  title: string
  content: string
  summary?: string
  url: string
  source: string
  author?: string
  publishedAt: Date
  imageUrl?: string
  tags: string[]
  category?: string
}

export interface RSSSource {
  id: string
  name: string
  url: string
  category: string
  enabled: boolean
  priority: number
  lastFetched?: Date
  fetchInterval: number // in minutes
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  delayMs: number
}

class RSSParserService {
  private parser: Parser
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map()
  private rateLimitConfig: RateLimitConfig = {
    maxRequests: 10, // Max requests per window
    windowMs: 60000, // 1 minute window
    delayMs: 1000 // 1 second delay between requests
  }

  // Software development & tech RSS sources (focused on Dev, QC, BA roles)
  private rssSources: RSSSource[] = [
    // Development-focused sources
    {
      id: 'hackernews',
      name: 'Hacker News',
      url: 'https://hnrss.org/frontpage',
      category: 'Technology',
      enabled: true,
      priority: 1,
      fetchInterval: 30
    },
    {
      id: 'github',
      name: 'GitHub Blog',
      url: 'https://github.blog/feed/',
      category: 'Development',
      enabled: true,
      priority: 1,
      fetchInterval: 60
    },
    {
      id: 'stackoverflow',
      name: 'Stack Overflow Blog',
      url: 'https://stackoverflow.blog/feed/',
      category: 'Development',
      enabled: true,
      priority: 1,
      fetchInterval: 60
    },
    {
      id: 'devto',
      name: 'DEV Community',
      url: 'https://dev.to/feed',
      category: 'Development',
      enabled: true,
      priority: 1,
      fetchInterval: 60
    },
    // QA/Testing-focused sources
    {
      id: 'ministryoftesting',
      name: 'Ministry of Testing',
      url: 'https://www.ministryoftesting.com/feeds/blogs',
      category: 'Software Testing',
      enabled: true,
      priority: 1,
      fetchInterval: 60
    },
    {
      id: 'stickyminds',
      name: 'StickyMinds',
      url: 'https://www.stickyminds.com/rss.xml',
      category: 'Software Testing',
      enabled: true,
      priority: 1,
      fetchInterval: 60
    },
    {
      id: 'softwaretestinghelp',
      name: 'Software Testing Help',
      url: 'https://www.softwaretestinghelp.com/feed/',
      category: 'Software Testing',
      enabled: true,
      priority: 1,
      fetchInterval: 60
    },
    {
      id: 'testingblog',
      name: 'Google Testing Blog',
      url: 'https://testing.googleblog.com/feeds/posts/default',
      category: 'Software Testing',
      enabled: true,
      priority: 1,
      fetchInterval: 60
    },
    {
      id: 'testautomationu',
      name: 'Test Automation University',
      url: 'https://testautomationu.applitools.com/blog/feed/',
      category: 'Test Automation',
      enabled: true,
      priority: 2,
      fetchInterval: 120
    },
    {
      id: 'seleniumhq',
      name: 'Selenium Blog',
      url: 'https://www.selenium.dev/blog/index.xml',
      category: 'Test Automation',
      enabled: true,
      priority: 2,
      fetchInterval: 120
    }
  ]

  constructor() {
    this.parser = new Parser({
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'TaskMgt-NewsApp/1.0 (RSS Parser)'
      }
    })
  }

  /**
   * Check if we can make a request based on rate limiting
   */
  private async checkRateLimit(sourceId: string): Promise<boolean> {
    const now = Date.now()
    const limit = this.rateLimits.get(sourceId)

    if (!limit) {
      this.rateLimits.set(sourceId, { count: 1, resetTime: now + this.rateLimitConfig.windowMs })
      return true
    }

    // Reset counter if window has passed
    if (now > limit.resetTime) {
      this.rateLimits.set(sourceId, { count: 1, resetTime: now + this.rateLimitConfig.windowMs })
      return true
    }

    // Check if we've exceeded the limit
    if (limit.count >= this.rateLimitConfig.maxRequests) {
      return false
    }

    // Increment counter
    limit.count++
    return true
  }

  /**
   * Apply rate limiting delay
   */
  private async applyRateLimit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.rateLimitConfig.delayMs))
  }

  /**
   * Extract tags from content using keyword matching
   */
  private extractTags(content: string, title: string): string[] {
    const text = `${title} ${content}`.toLowerCase()
    const techKeywords = [
      // QA/Testing keywords
      'testing', 'qa', 'quality assurance', 'qc', 'quality control',
      'test automation', 'selenium', 'cypress', 'playwright', 'puppeteer',
      'unit testing', 'integration testing', 'e2e testing', 'regression testing',
      'performance testing', 'load testing', 'stress testing', 'security testing',
      'test driven development', 'tdd', 'bdd', 'behavior driven',
      'continuous testing', 'ci/cd', 'jenkins', 'github actions',
      'test coverage', 'code coverage', 'test cases', 'test plan',
      'bug', 'defect', 'issue tracking', 'jira', 'test management',
      'api testing', 'postman', 'rest api', 'graphql testing',
      'mobile testing', 'appium', 'espresso', 'xcuitest',
      // AI/ML keywords
      'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
      // Blockchain keywords
      'blockchain', 'cryptocurrency', 'crypto', 'bitcoin', 'ethereum',
      // General tech keywords
      'quantum', 'computing', 'software', 'programming', 'coding',
      'cybersecurity', 'security', 'hacking', 'privacy', 'encryption',
      'cloud', 'aws', 'azure', 'google cloud', 'kubernetes', 'docker',
      'mobile', 'ios', 'android', 'app', 'react native',
      'web', 'javascript', 'python', 'react', 'vue', 'angular',
      'data science', 'analytics', 'big data', 'database',
      'iot', 'internet of things', 'smart', 'automation',
      'vr', 'ar', 'virtual reality', 'augmented reality',
      '5g', '6g', 'network', 'connectivity', 'wireless',
      'startup', 'venture capital', 'funding', 'investment',
      'open source', 'github', 'git', 'api', 'microservices'
    ]

    return techKeywords.filter(keyword => text.includes(keyword)).slice(0, 5)
  }

  /**
   * Determine category based on content
   */
  private determineCategory(content: string, title: string, sourceCategory: string): string {
    const text = `${title} ${content}`.toLowerCase()

    // Check for QA/Testing content first (priority for QC users)
    if (text.includes('testing') || text.includes('qa') || text.includes('quality assurance') || 
        text.includes('test automation') || text.includes('selenium') || text.includes('cypress')) {
      return 'Software Testing'
    } else if (text.includes('quality control') || text.includes('qc') || text.includes('quality management')) {
      return 'Quality Assurance'
    } else if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('machine learning')) {
      return 'Software Development'
    } else if (text.includes('test') || text.includes('qa') || text.includes('quality') || text.includes('testing')) {
      return 'QA & Testing'
    } else if (text.includes('devops') || text.includes('ci/cd') || text.includes('deployment') || text.includes('infrastructure')) {
      return 'DevOps & Infrastructure'
    } else if (text.includes('security') || text.includes('cybersecurity') || text.includes('vulnerability')) {
      return 'Security & Testing'
    } else if (text.includes('frontend') || text.includes('react') || text.includes('angular') || text.includes('vue')) {
      return 'Frontend Development'
    } else if (text.includes('backend') || text.includes('api') || text.includes('microservice') || text.includes('database')) {
      return 'Backend Development'
    } else if (text.includes('programming') || text.includes('coding') || text.includes('development')) {
      return 'Software Development'
    }

    return sourceCategory
  }

  /**
   * Parse a single RSS feed
   */
  private async parseFeed(source: RSSSource): Promise<RSSFeedItem[]> {
    try {
      console.log(`📡 Parsing RSS feed: ${source.name}`)

      // Check rate limit
      if (!(await this.checkRateLimit(source.id))) {
        console.log(`⏳ Rate limit exceeded for ${source.name}, skipping`)
        return []
      }

      // Parse the RSS feed
      const feed = await this.parser.parseURL(source.url)
      
      if (!feed.items || feed.items.length === 0) {
        console.log(`⚠️ No items found in ${source.name}`)
        return []
      }

      console.log(`✅ Parsed ${feed.items.length} items from ${source.name}`)

      // Convert RSS items to our format
      const items: RSSFeedItem[] = feed.items
        .slice(0, 10) // Limit to 10 most recent items
        .map(item => {
          const content = item.contentSnippet || item.content || item.description || ''
          const itemTitle = item.title || 'Untitled'
          const tags = this.extractTags(content, itemTitle)
          const category = this.determineCategory(content, itemTitle, source.category)

          return {
            title: itemTitle,
            content: content,
            summary: item.contentSnippet || undefined,
            url: item.link || '',
            source: source.name,
            author: item.creator || item.author || undefined,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            imageUrl: item.enclosure?.url || item['media:content']?.['$']?.url || undefined,
            tags,
            category
          }
        })
        .filter(item => item.url && item.title !== 'Untitled') // Filter out invalid items

      // Update last fetched time
      source.lastFetched = new Date()

      return items
    } catch (error) {
      console.error(`❌ Error parsing ${source.name}:`, error)
      return []
    }
  }

  /**
   * Parse all enabled RSS feeds
   */
  async parseAllFeeds(): Promise<RSSFeedItem[]> {
    console.log('📡 Starting RSS feed parsing...')
    
    const enabledSources = this.rssSources.filter(source => source.enabled)
    const allItems: RSSFeedItem[] = []

    for (const source of enabledSources) {
      try {
        // Check if we should fetch this source (based on interval)
        if (source.lastFetched) {
          const timeSinceLastFetch = Date.now() - source.lastFetched.getTime()
          const intervalMs = source.fetchInterval * 60 * 1000
          
          if (timeSinceLastFetch < intervalMs) {
            console.log(`⏭️ Skipping ${source.name} (too recent)`)
            continue
          }
        }

        const items = await this.parseFeed(source)
        allItems.push(...items)

        // Apply rate limiting delay
        await this.applyRateLimit()
      } catch (error) {
        console.error(`❌ Failed to parse ${source.name}:`, error)
        continue
      }
    }

    console.log(`✅ RSS parsing complete: ${allItems.length} items from ${enabledSources.length} sources`)
    return allItems
  }

  /**
   * Parse a specific RSS feed by ID
   */
  async parseFeedById(sourceId: string): Promise<RSSFeedItem[]> {
    const source = this.rssSources.find(s => s.id === sourceId)
    if (!source) {
      throw new Error(`RSS source not found: ${sourceId}`)
    }

    return this.parseFeed(source)
  }

  /**
   * Get all configured RSS sources
   */
  getSources(): RSSSource[] {
    return [...this.rssSources]
  }

  /**
   * Enable/disable a specific source
   */
  setSourceEnabled(sourceId: string, enabled: boolean): void {
    const source = this.rssSources.find(s => s.id === sourceId)
    if (source) {
      source.enabled = enabled
    }
  }

  /**
   * Update rate limit configuration
   */
  updateRateLimit(config: Partial<RateLimitConfig>): void {
    this.rateLimitConfig = { ...this.rateLimitConfig, ...config }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): { [sourceId: string]: { count: number; resetTime: number } } {
    const status: { [sourceId: string]: { count: number; resetTime: number } } = {}
    
    for (const [sourceId, limit] of this.rateLimits.entries()) {
      status[sourceId] = { ...limit }
    }
    
    return status
  }

  /**
   * Clear rate limit counters
   */
  clearRateLimits(): void {
    this.rateLimits.clear()
  }
}

// Export singleton instance
export const rssParserService = new RSSParserService()
export default rssParserService
