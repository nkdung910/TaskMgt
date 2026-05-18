/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Daily Digest Generator Service
 * 
 * This service generates personalized daily news digests for users
 * based on their preferences and reading history.
 */

import { prisma as db } from "@/lib/database"
import { aiSummarizationService } from "@/lib/services"
import { formatDateDDMMYYYY } from "@/lib/utils"

export interface DigestArticle {
  id: string
  title: string
  summary: string
  url: string
  source: string
  publishedAt: string
  category: string
  tags: string[]
  relevanceScore: number
}

export interface DailyDigest {
  id: string
  date: string
  articles: DigestArticle[]
  summary: string
  categories: string[]
  totalArticles: number
  createdAt: string
}

export interface DigestPreferences {
  maxArticles: number
  categories: string[]
  sources: string[]
  minRelevanceScore: number
  includeSummaries: boolean
  personalizationLevel: 'basic' | 'advanced'
}

class DigestGenerator {
  private defaultPreferences: DigestPreferences = {
    maxArticles: 20,
    categories: [], // Don't filter by category by default - show all
    sources: [], // Don't filter by source by default - show all
    minRelevanceScore: 0.3,
    includeSummaries: true,
    personalizationLevel: 'basic'
  }

  /**
   * Generate a daily digest for a specific date
   */
  async generateDailyDigest(
    userId: string,
    date: string,
    preferences?: Partial<DigestPreferences>
  ): Promise<DailyDigest> {
    try {
      console.log(`📰 Generating daily digest for user ${userId} on ${date}`)
      
      const finalPreferences = { ...this.defaultPreferences, ...preferences }
      const targetDate = new Date(date)
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      // Get user's reading history and role preferences for personalization
      const userHistory = await this.getUserReadingHistory(userId, 30) // Last 30 days
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          rolePreferences: true, 
          minRelevance: true 
        } as any
      }) as any
      
      const userRoles = (user?.rolePreferences || ['developer']) as string[]
      // Use lower threshold for digest (30% instead of user's preference) to get more articles
      const userMinRelevance = Math.min(((user?.minRelevance || 50) / 100), 0.3) as number
      
      // Build role-based filter using JSONB
      const roleConditions = userRoles.map((role: string) => 
        `(role_scores->>'${role}')::float >= ${userMinRelevance}`
      ).join(' OR ')
      
      // Fetch articles for the specified date with role filtering
      // Use created_at instead of published_at to get articles added to our system on that date
      const articlesQuery = `
        SELECT * FROM news_articles
        WHERE created_at >= $1 AND created_at <= $2
          AND (${roleConditions})
          ${finalPreferences.categories.length > 0 ? `AND category = ANY($3::text[])` : ''}
          ${finalPreferences.sources.length > 0 ? `AND source = ANY($${finalPreferences.categories.length > 0 ? '4' : '3'}::text[])` : ''}
        ORDER BY relevance_score DESC NULLS LAST, published_at DESC
        LIMIT ${finalPreferences.maxArticles * 2}
      `
      
      const queryParams: any[] = [startOfDay, endOfDay]
      if (finalPreferences.categories.length > 0) queryParams.push(finalPreferences.categories)
      if (finalPreferences.sources.length > 0) queryParams.push(finalPreferences.sources)
      
      let articles = await db.$queryRawUnsafe<any[]>(articlesQuery, ...queryParams)

      // If no articles found for the specific date, get recent articles from the last 7 days
      let usedRecentArticles = false
      if (articles.length === 0) {
        console.log(`⚠️ No articles found for ${date}, fetching recent articles from last 7 days...`)
        
        const sevenDaysAgo = new Date(targetDate)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const recentArticlesQuery = `
          SELECT * FROM news_articles
          WHERE created_at >= $1 AND created_at <= $2
            AND (${roleConditions})
            ${finalPreferences.categories.length > 0 ? `AND category = ANY($3::text[])` : ''}
            ${finalPreferences.sources.length > 0 ? `AND source = ANY($${finalPreferences.categories.length > 0 ? '4' : '3'}::text[])` : ''}
          ORDER BY relevance_score DESC NULLS LAST, published_at DESC
          LIMIT ${finalPreferences.maxArticles * 2}
        `
        
        const recentQueryParams: any[] = [sevenDaysAgo, endOfDay]
        if (finalPreferences.categories.length > 0) recentQueryParams.push(finalPreferences.categories)
        if (finalPreferences.sources.length > 0) recentQueryParams.push(finalPreferences.sources)
        
        articles = await db.$queryRawUnsafe<any[]>(recentArticlesQuery, ...recentQueryParams)
        
        usedRecentArticles = articles.length > 0
        console.log(`   Found ${articles.length} recent articles from last 7 days`)
      }

      if (articles.length === 0) {
        console.log(`⚠️ No articles found even in last 7 days, returning empty digest`)
        // Return empty digest instead of throwing error
        return {
          id: `digest-${userId}-${date}`,
          date: date,
          articles: [],
          summary: `No tech news articles available for ${formatDateDDMMYYYY(date)} or the past week. Try fetching new articles first from the News Settings.`,
          categories: [],
          totalArticles: 0,
          createdAt: new Date().toISOString()
        }
      }

      // Personalize article selection
      const personalizedArticles = this.personalizeArticleSelection(
        articles,
        userHistory,
        finalPreferences
      )

      // Generate digest summary
      const digestSummary = usedRecentArticles
        ? `No articles were published on ${formatDateDDMMYYYY(date)}. Here's a digest of recent tech news from the past week: ` + 
          await this.generateDigestSummary(personalizedArticles)
        : await this.generateDigestSummary(personalizedArticles)

      // Create digest object
      const digest: DailyDigest = {
        id: `digest-${userId}-${date}`,
        date: date,
        articles: personalizedArticles.map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary || this.generateFallbackSummary(article.content),
          url: article.url,
          source: article.source,
          publishedAt: article.publishedAt instanceof Date 
            ? article.publishedAt.toISOString() 
            : new Date((article as any).published_at || article.publishedAt).toISOString(),
          category: article.category || 'Technology',
          tags: article.tags || [],
          relevanceScore: article.relevanceScore || (article as any).relevance_score || 0.5
        })),
        summary: digestSummary,
        categories: [...new Set(personalizedArticles.map(a => a.category).filter((c): c is string => c !== null))],
        totalArticles: personalizedArticles.length,
        createdAt: new Date().toISOString()
      }

      // Store digest in database
      await this.storeDigest(userId, digest)

      console.log(`✅ Generated digest with ${personalizedArticles.length} articles`)
      return digest

    } catch (error) {
      console.error('❌ Error generating daily digest:', error)
      throw error
    }
  }

  /**
   * Get user's reading history for personalization
   */
  private async getUserReadingHistory(userId: string, days: number): Promise<{
    categories: string[]
    sources: string[]
    tags: string[]
    avgRelevanceScore: number
  }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const bookmarks = await db.newsBookmark.findMany({
        where: {
          userId,
          createdAt: { gte: cutoffDate }
        },
        include: {
          article: true
        }
      })

      const categories = bookmarks.map(b => b.article.category).filter((c): c is string => c !== null)
      const sources = bookmarks.map(b => b.article.source).filter((s): s is string => s !== null)
      const tags = bookmarks.flatMap(b => b.article.tags || [])
      const relevanceScores = bookmarks.map(b => b.article.relevanceScore || 0.5)

      return {
        categories: [...new Set(categories)],
        sources: [...new Set(sources)],
        tags: [...new Set(tags)],
        avgRelevanceScore: relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length || 0.5
      }
    } catch (error) {
      console.error('Error getting user reading history:', error)
      return {
        categories: [],
        sources: [],
        tags: [],
        avgRelevanceScore: 0.5
      }
    }
  }

  /**
   * Personalize article selection based on user history
   */
  private personalizeArticleSelection(
    articles: Array<{
      id: string
      title: string
      content: string
      summary: string | null
      url: string
      source: string
      category: string | null
      tags: string[]
      relevanceScore: number | null
      publishedAt: Date
    }>,
    userHistory: { categories: string[], sources: string[], tags: string[] },
    preferences: DigestPreferences
  ): typeof articles {
    if (preferences.personalizationLevel === 'basic') {
      return articles.slice(0, preferences.maxArticles)
    }

    // Advanced personalization
    const scoredArticles = articles.map(article => {
      let score = article.relevanceScore || 0.5

      // Boost score based on user's preferred categories
      if (article.category && userHistory.categories.includes(article.category)) {
        score += 0.2
      }

      // Boost score based on user's preferred sources
      if (article.source && userHistory.sources.includes(article.source)) {
        score += 0.1
      }

      // Boost score based on user's preferred tags
      const commonTags = (article.tags || []).filter((tag: string) => 
        userHistory.tags.includes(tag)
      )
      score += commonTags.length * 0.05

      // Boost score for articles with summaries (user preference)
      if (preferences.includeSummaries && article.summary) {
        score += 0.1
      }

      return { ...article, personalizedScore: score }
    })

    // Sort by personalized score and take top articles
    return scoredArticles
      .sort((a, b) => b.personalizedScore - a.personalizedScore)
      .slice(0, preferences.maxArticles)
  }

  /**
   * Generate AI-powered digest summary
   */
  private async generateDigestSummary(articles: Array<{ title: string, summary: string | null, content: string }>): Promise<string> {
    try {
      if (!aiSummarizationService.isAvailable()) {
        return this.generateFallbackDigestSummary(articles)
      }

      const articleTitles = articles.map(a => a.title).join('\n')
      const articleSummaries = articles.map(a => a.summary || a.content.substring(0, 200)).join('\n')
      
      const prompt = `Create a brief daily digest summary for these tech news articles. 
      Focus on the most important trends and developments. Keep it concise (2-3 sentences):
      
      Articles:
      ${articleTitles}
      
      Summaries:
      ${articleSummaries}`

      const result = await aiSummarizationService.summarize(prompt, {
        maxLength: 150,
        style: 'brief',
        focus: 'technical'
      })

      return result.summary
    } catch (error) {
      console.error('Error generating AI digest summary:', error)
      return this.generateFallbackDigestSummary(articles)
    }
  }

  /**
   * Generate fallback digest summary
   */
  private generateFallbackDigestSummary(articles: Array<{ title: string, summary?: string | null, content?: string, category?: string | null, source?: string }>): string {
    const categories = [...new Set(articles.map(a => a.category).filter((c): c is string => c !== null && c !== undefined))]
    const sources = [...new Set(articles.map(a => a.source).filter((s): s is string => s !== null && s !== undefined))]
    
    return `Today's tech digest covers ${articles.length} articles${categories.length > 0 ? ` across ${categories.length} categories including ${categories.slice(0, 3).join(', ')}` : ''}${sources.length > 0 ? `. Key sources include ${sources.slice(0, 3).join(', ')}` : ''}.`
  }

  /**
   * Generate fallback article summary
   */
  private generateFallbackSummary(content: string): string {
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20)
      .slice(0, 2)
    
    let summary = sentences.join('. ')
    if (summary && !summary.endsWith('.')) {
      summary += '.'
    }
    if (summary.length > 150) {
      summary = summary.substring(0, 147) + '...'
    }
    
    return summary
  }

  /**
   * Store digest in database
   */
  private async storeDigest(userId: string, digest: DailyDigest): Promise<void> {
    try {
      await db.newsDigest.upsert({
        where: {
          userId_date: {
            userId,
            date: new Date(digest.date)
          }
        },
        update: {
          articles: digest.articles.map(a => a.id)
        },
        create: {
          userId,
          date: new Date(digest.date),
          articles: digest.articles.map(a => a.id)
        }
      })
    } catch (error) {
      console.error('Error storing digest:', error)
      // Don't throw - digest generation should continue even if storage fails
    }
  }

  /**
   * Get available digest dates for a user
   */
  async getAvailableDates(userId: string): Promise<string[]> {
    try {
      const digests = await db.newsDigest.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: 'desc' },
        take: 30 // Last 30 days
      })

      return digests.map(d => d.date.toISOString().split('T')[0])
    } catch (error) {
      console.error('Error getting available dates:', error)
      return []
    }
  }

  /**
   * Get a specific digest
   */
  async getDigest(userId: string, date: string): Promise<DailyDigest | null> {
    try {
      const digest = await db.newsDigest.findUnique({
        where: {
          userId_date: {
            userId,
            date: new Date(date)
          }
        }
      })

      if (!digest) {
        return null
      }

      // Get the actual articles
      const articles = await db.newsArticle.findMany({
        where: {
          id: { in: digest.articles }
        },
        orderBy: { publishedAt: 'desc' }
      })

      return {
        id: digest.id,
        date: date,
        articles: articles.map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary || this.generateFallbackSummary(article.content),
          url: article.url,
          source: article.source,
          publishedAt: article.publishedAt instanceof Date 
            ? article.publishedAt.toISOString() 
            : new Date((article as any).published_at || article.publishedAt).toISOString(),
          category: article.category || 'Technology',
          tags: article.tags || [],
          relevanceScore: article.relevanceScore || (article as any).relevance_score || 0.5
        })),
        summary: `Daily digest for ${formatDateDDMMYYYY(date)}`,
        categories: [...new Set(articles.map(a => a.category).filter((c): c is string => c !== null))],
        totalArticles: articles.length,
        createdAt: digest.createdAt.toISOString()
      }
    } catch (error) {
      console.error('Error getting digest:', error)
      return null
    }
  }
}

// Export singleton instance
export const digestGenerator = new DigestGenerator()
export default digestGenerator
