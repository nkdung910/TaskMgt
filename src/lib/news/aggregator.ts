/**
 * News Aggregation Service
 * 
 * This service fetches news from various sources and processes them
 * for the TaskMgt platform. In a production environment, this would
 * integrate with real news APIs like NewsAPI, RSS feeds, etc.
 */

import { prisma as db } from "@/lib/database"
import { newsAPIService } from "@/lib/news/newsapi"
import { aiSummarizationService } from "@/lib/services"
import { rssParserService } from "@/lib/news/rss-parser"
import { rateLimiter } from "@/lib/utils"
import { calculateRoleScores } from "@/lib/news/categorizer"

export interface NewsSource {
  id: string
  name: string
  url: string
  rssUrl?: string
  apiKey?: string
  enabled: boolean
}

export interface RawNewsArticle {
  title: string
  content: string
  url: string
  source: string
  author?: string
  publishedAt: Date
  imageUrl?: string
  tags?: string[]
  category?: string
}

// Mock news sources for development
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_SOURCES: NewsSource[] = [
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    enabled: true
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    enabled: true
  },
  {
    id: 'arstechnica',
    name: 'Ars Technica',
    url: 'https://arstechnica.com',
    enabled: true
  },
  {
    id: 'wired',
    name: 'Wired',
    url: 'https://wired.com',
    enabled: true
  },
  {
    id: 'theverge',
    name: 'The Verge',
    url: 'https://theverge.com',
    enabled: true
  }
]

// Mock news articles for development
const MOCK_ARTICLES: RawNewsArticle[] = [
  {
    title: "AI Revolution: New Language Model Breaks Performance Records",
    content: "A groundbreaking new language model has achieved unprecedented performance in natural language understanding tasks, potentially revolutionizing how we interact with AI systems. The model, developed by a team of researchers, demonstrates significant improvements in reasoning, creativity, and contextual understanding compared to previous generations.",
    url: "https://example.com/ai-revolution",
    source: "TechCrunch",
    author: "Sarah Johnson",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
    tags: ["AI", "Machine Learning", "Development"],
    category: "Software Development"
  },
  {
    title: "New Testing Framework: Automated QA Tools Revolutionize Development",
    content: "A revolutionary new testing framework has been released that automates quality assurance processes across multiple programming languages. The framework integrates seamlessly with CI/CD pipelines and provides comprehensive test coverage reporting, reducing manual testing time by 80% and improving code quality significantly.",
    url: "https://example.com/testing-framework",
    source: "Ars Technica",
    author: "Dr. Michael Chen",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop",
    tags: ["Testing", "QA", "Automation"],
    category: "QA & Testing"
  },
  {
    title: "DevOps Revolution: New CI/CD Pipeline Tools Streamline Development",
    content: "Major cloud providers are introducing next-generation CI/CD pipeline tools that streamline the development process. These tools integrate seamlessly with popular version control systems and provide real-time feedback, reducing deployment time by 90% and improving developer productivity significantly.",
    url: "https://example.com/devops-tools",
    source: "Wired",
    author: "Emma Rodriguez",
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    imageUrl: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&h=400&fit=crop",
    tags: ["DevOps", "CI/CD", "Cloud Computing"],
    category: "DevOps & Infrastructure"
  },
  {
    title: "Security Testing: New Penetration Testing Tools for Developers",
    content: "Security researchers have released new penetration testing tools specifically designed for developers. These tools integrate directly into the development workflow, automatically scanning code for vulnerabilities and providing real-time security feedback during the coding process.",
    url: "https://example.com/security-testing",
    source: "The Verge",
    author: "Alex Thompson",
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop",
    tags: ["Security", "Testing", "Development"],
    category: "Security & Testing"
  },
  {
    title: "Frontend Development: New React Testing Library Updates",
    content: "The React Testing Library team has released major updates that simplify frontend testing workflows. The new features include improved accessibility testing, better component isolation, and enhanced debugging tools that make frontend development more efficient and reliable.",
    url: "https://example.com/frontend-testing",
    source: "Hacker News",
    author: "Dr. Lisa Park",
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    imageUrl: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=400&fit=crop",
    tags: ["Frontend", "React", "Testing"],
    category: "Frontend Development"
  },
  {
    title: "Backend Development: New Microservices Architecture Patterns",
    content: "Leading tech companies are adopting new microservices architecture patterns that improve scalability and maintainability. These patterns include event-driven architecture, CQRS implementation, and advanced service mesh configurations that streamline backend development processes.",
    url: "https://example.com/backend-microservices",
    source: "TechCrunch",
    author: "John Smith",
    publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000), // 14 hours ago
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop",
    tags: ["Backend", "Microservices", "Architecture"],
    category: "Backend Development"
  },
  {
    title: "Database Testing: New Performance Optimization Tools",
    content: "Database performance testing has been revolutionized with new tools that automatically identify bottlenecks and suggest optimizations. These tools integrate with popular databases and provide real-time performance metrics, helping developers write more efficient database queries.",
    url: "https://example.com/database-testing",
    source: "Ars Technica",
    author: "Maria Garcia",
    publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000), // 16 hours ago
    imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=400&fit=crop",
    tags: ["Database", "Performance", "Testing"],
    category: "QA & Testing"
  }
]

/**
 * Generate AI summary for an article
 * Uses AI summarization service with fallback options
 */
export async function generateAISummary(content: string): Promise<string> {
  try {
    console.log('🤖 Generating AI summary...')
    
    const result = await aiSummarizationService.summarize(content, {
      maxLength: 200,
      style: 'brief',
      focus: 'technical'
    })
    
    console.log(`✅ AI summary generated using ${result.provider} (${result.processingTime}ms)`)
    return result.summary
  } catch (error) {
    console.error('❌ AI summarization failed:', error)
    
    // Fallback to simple extractive summarization
    const sentences = content.split('.').filter(s => s.trim().length > 0)
    const summary = sentences.slice(0, 2).join('.') + '.'
    return summary
  }
}

/**
 * Calculate relevance score for an article
 * In production, this would use ML models to score relevance
 */
export async function calculateRelevanceScore(article: RawNewsArticle): Promise<number> {
  // Mock relevance scoring
  // In production, this would use ML models to score based on user preferences, trending topics, etc.
  const baseScore = 0.5
  
  // Boost score for recent articles
  const hoursSincePublished = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60)
  const recencyBoost = Math.max(0, 0.3 - (hoursSincePublished / 24) * 0.1)
  
  // Boost score for certain keywords
  const keywords = ['AI', 'quantum', 'breakthrough', 'revolution', 'innovation']
  const keywordBoost = keywords.some(keyword => 
    article.title.toLowerCase().includes(keyword.toLowerCase()) ||
    article.content.toLowerCase().includes(keyword.toLowerCase())
  ) ? 0.2 : 0
  
  return Math.min(1, baseScore + recencyBoost + keywordBoost)
}

/**
 * Fetch news from RSS feeds
 */
export async function fetchNewsFromRSS(): Promise<RawNewsArticle[]> {
  try {
    console.log('📡 Fetching news from RSS feeds...')
    
    const rssItems = await rateLimiter.makeRequest(
      'rss-feeds',
      () => rssParserService.parseAllFeeds(),
      {
        maxRequests: 5,
        windowMs: 300000, // 5 minutes
        delayMs: 2000 // 2 seconds between feeds
      }
    )

    if (rssItems.length > 0) {
      console.log(`✅ Fetched ${rssItems.length} articles from RSS feeds`)
      
      // Convert RSS items to our internal format
      const articles = rssItems.map(rssItem => ({
        title: rssItem.title,
        content: rssItem.content,
        url: rssItem.url,
        source: rssItem.source,
        author: rssItem.author,
        publishedAt: rssItem.publishedAt,
        imageUrl: rssItem.imageUrl,
        tags: rssItem.tags,
        category: rssItem.category
      }))

      return articles
    } else {
      console.log('⚠️ No articles found in RSS feeds')
      return []
    }
  } catch (error) {
    console.error('❌ Error fetching news from RSS feeds:', error)
    return []
  }
}

/**
 * Fetch news from all enabled sources
 */
export async function fetchNewsFromSources(): Promise<RawNewsArticle[]> {
  const allArticles: RawNewsArticle[] = []
  
  try {
    // Fetch from RSS feeds first (more reliable)
    console.log('📡 Fetching from RSS feeds...')
    const rssArticles = await fetchNewsFromRSS()
    allArticles.push(...rssArticles)
    
    // Then try NewsAPI if configured
    if (newsAPIService.isConfigured()) {
      console.log('📰 Fetching news from NewsAPI...')
      
      const newsAPIArticles = await rateLimiter.makeRequest(
        'newsapi',
        async () => {
          const response = await newsAPIService.getTechNews({
            pageSize: 10, // Reduced to avoid rate limits
            page: 1
          })
          return response
        },
        {
          maxRequests: 3,
          windowMs: 300000, // 5 minutes
          delayMs: 3000 // 3 seconds delay
        }
      )

      if (newsAPIArticles.status === 'ok' && newsAPIArticles.articles) {
        console.log(`✅ Fetched ${newsAPIArticles.articles.length} articles from NewsAPI`)
        
        // Convert NewsAPI articles to our internal format
        const articles = newsAPIArticles.articles.map(apiArticle => {
          const converted = newsAPIService.convertToInternalFormat(apiArticle)
          return {
            title: converted.title,
            content: converted.content,
            url: converted.url,
            source: converted.source,
            author: converted.author,
            publishedAt: converted.publishedAt,
            imageUrl: converted.imageUrl,
            tags: converted.tags,
            category: converted.category
          }
        })

        allArticles.push(...articles)
      } else {
        console.warn('⚠️ NewsAPI returned invalid response')
      }
    } else {
      console.log('⚠️ NewsAPI not configured')
    }

    // If we have articles from any source, return them
    if (allArticles.length > 0) {
      console.log(`✅ Total articles fetched: ${allArticles.length}`)
      return allArticles
    } else {
      console.log('⚠️ No articles from any source, using mock data')
      return MOCK_ARTICLES
    }
  } catch (error) {
    console.error('❌ Error fetching news from sources:', error)
    console.log('🔄 Falling back to mock data')
    return MOCK_ARTICLES
  }
}

/**
 * Process and store news articles
 */
export async function processAndStoreNews(): Promise<{ processed: number; errors: number }> {
  try {
    const rawArticles = await fetchNewsFromSources()
    let processed = 0
    let errors = 0

    for (const rawArticle of rawArticles) {
      try {
        // Check if article already exists
        const existingArticle = await db.newsArticle.findUnique({
          where: { url: rawArticle.url }
        })

        if (existingArticle) {
          console.log(`⏭️  Skipping duplicate article: ${rawArticle.title}`)
          continue // Skip if already exists
        }

        // Generate AI summary
        const summary = await generateAISummary(rawArticle.content)

        // Calculate relevance score
        const relevanceScore = await calculateRelevanceScore(rawArticle)

        // Calculate role scores for role-based filtering
        const roleScores = calculateRoleScores({
          ...rawArticle,
          tags: rawArticle.tags || []
        })
        
        console.log(`📊 Role scores for "${rawArticle.title.substring(0, 40)}": Dev=${(roleScores.developer*100).toFixed(0)}% QC=${(roleScores.qc*100).toFixed(0)}% BA=${(roleScores.ba*100).toFixed(0)}%`)

        // Store in database using upsert to handle race conditions
        await db.newsArticle.upsert({
          where: { url: rawArticle.url },
          create: {
            title: rawArticle.title,
            content: rawArticle.content,
            summary: summary,
            url: rawArticle.url,
            source: rawArticle.source,
            author: rawArticle.author,
            publishedAt: rawArticle.publishedAt,
            relevanceScore: relevanceScore,
            roleScores: roleScores as unknown as Record<string, number>, // Cast to satisfy Prisma JSON type
            tags: rawArticle.tags || [],
            category: rawArticle.category,
            imageUrl: rawArticle.imageUrl
          },
          update: {} // Don't update if exists
        })

        processed++
      } catch (error) {
        // Handle unique constraint error gracefully
        if (error instanceof Error && 'code' in error && error.code === 'P2002') {
          console.log(`⏭️  Skipping duplicate article (race condition): ${rawArticle.title}`)
          continue
        }
        console.error(`Error processing article "${rawArticle.title}":`, error)
        errors++
      }
    }

    return { processed, errors }
  } catch (error) {
    console.error("Error in processAndStoreNews:", error)
    return { processed: 0, errors: 1 }
  }
}

/**
 * Generate daily digest for a user
 */
export async function generateDailyDigest(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if digest already exists for today
    const existingDigest = await db.newsDigest.findUnique({
      where: {
        userId_date: {
          userId: userId,
          date: today
        }
      }
    })

    if (existingDigest) {
      return { success: true } // Digest already exists
    }

    // Get top articles from today
    const topArticles = await db.newsArticle.findMany({
      where: {
        publishedAt: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      orderBy: [
        { relevanceScore: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: 10,
      select: { id: true }
    })

    if (topArticles.length === 0) {
      return { success: false, error: "No articles available for today" }
    }

    // Create digest
    await db.newsDigest.create({
      data: {
        userId: userId,
        date: today,
        articles: topArticles.map(article => article.id)
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error generating daily digest:", error)
    return { success: false, error: "Failed to generate daily digest" }
  }
}

/**
 * Clean up old articles (older than 30 days)
 */
export async function cleanupOldArticles(): Promise<{ deleted: number; error?: string }> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await db.newsArticle.deleteMany({
      where: {
        publishedAt: {
          lt: thirtyDaysAgo
        }
      }
    })

    return { deleted: result.count }
  } catch (error) {
    console.error("Error cleaning up old articles:", error)
    return { deleted: 0, error: "Failed to cleanup old articles" }
  }
}

