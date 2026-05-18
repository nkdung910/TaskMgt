/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { prisma as db } from "@/lib/database"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { AuthOptionsCompat } from "@/lib/auth/types"
import type { Session } from "next-auth"

export interface NewsArticle {
  id: string
  title: string
  content: string
  summary?: string | null
  url: string
  source: string
  author?: string | null
  publishedAt: Date
  relevanceScore?: number | null
  tags: string[]
  category?: string | null
  imageUrl?: string | null
  createdAt: Date
  updatedAt: Date
  isBookmarked?: boolean
}

export interface NewsBookmark {
  id: string
  userId: string
  articleId: string
  createdAt: Date
  article: NewsArticle
}

export interface NewsDigest {
  id: string
  userId: string
  date: Date
  articles: string[]
  createdAt: Date
}

// Get news articles with optional filtering
export async function getNewsArticles(filters?: {
  category?: string
  source?: string
  tags?: string[]
  limit?: number
  offset?: number
  search?: string
}): Promise<{ articles: NewsArticle[]; total: number; error?: string }> {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    if (!session?.user?.id) {
      return { articles: [], total: 0, error: "Unauthorized" }
    }

    // Get user's role preferences
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { 
        rolePreferences: true, 
        minRelevance: true 
      } as any
    }) as any

    const userRoles = (user?.rolePreferences || ['developer']) as string[]
    const minRelevance = ((user?.minRelevance || 50) / 100) as number // Convert percentage to 0.0-1.0

    const {
      category,
      source,
      tags,
      limit = 20,
      offset = 0,
      search
    } = filters || {}

    // Build WHERE conditions with role filtering
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Role-based filtering using JSONB
    if (userRoles.length > 0) {
      const roleConditions = userRoles.map((role: string) => {
        const condition = `(role_scores->>'${role}')::float >= $${paramIndex}`
        params.push(minRelevance)
        paramIndex++
        return condition
      })
      conditions.push(`(${roleConditions.join(' OR ')})`)
    }

    // Category filter
    if (category) {
      conditions.push(`category = $${paramIndex}`)
      params.push(category)
      paramIndex++
    }

    // Source filter
    if (source) {
      conditions.push(`source = $${paramIndex}`)
      params.push(source)
      paramIndex++
    }

    // Tags filter
    if (tags && tags.length > 0) {
      conditions.push(`tags && $${paramIndex}::text[]`)
      params.push(tags)
      paramIndex++
    }

    // Search filter
    if (search) {
      conditions.push(`(
        title ILIKE $${paramIndex} OR 
        content ILIKE $${paramIndex} OR 
        summary ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Use raw SQL for JSONB queries
    const articlesQuery = `
      SELECT 
        na.*,
        COALESCE(
          json_agg(
            json_build_object('id', nb.id)
          ) FILTER (WHERE nb.id IS NOT NULL),
          '[]'
        ) as bookmarks
      FROM news_articles na
      LEFT JOIN news_bookmarks nb ON na.id = nb.article_id AND nb.user_id = $${paramIndex}
      ${whereClause}
      GROUP BY na.id
      ORDER BY na.published_at DESC
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `
    params.push(session.user.id, limit, offset)

    const countQuery = `
      SELECT COUNT(*)::int as count
      FROM news_articles na
      ${whereClause}
    `

    const [articles, totalResult] = await Promise.all([
      db.$queryRawUnsafe<any[]>(articlesQuery, ...params),
      db.$queryRawUnsafe<[{ count: number }]>(countQuery, ...params.slice(0, -2))
    ])

    const total = totalResult[0]?.count || 0

    const articlesWithBookmarks = articles.map(article => ({
      ...article,
      // Convert timestamp strings to Date objects
      publishedAt: new Date(article.published_at || article.publishedAt),
      createdAt: new Date(article.created_at || article.createdAt),
      updatedAt: new Date(article.updated_at || article.updatedAt),
      isBookmarked: article.bookmarks && article.bookmarks.length > 0
    }))

    return { articles: articlesWithBookmarks, total }
  } catch (error) {
    console.error("Error fetching news articles:", error)
    return { articles: [], total: 0, error: "Failed to fetch news articles" }
  }
}

// Get bookmarked articles for a user
export async function getBookmarkedArticles(): Promise<{ articles: NewsArticle[]; error?: string }> {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    if (!session?.user?.id) {
      return { articles: [], error: "Unauthorized" }
    }

    const bookmarks = await db.newsBookmark.findMany({
      where: { userId: session.user.id },
      include: {
        article: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const articles = bookmarks.map(bookmark => ({
      ...bookmark.article,
      isBookmarked: true
    }))

    return { articles }
  } catch (error) {
    console.error("Error fetching bookmarked articles:", error)
    return { articles: [], error: "Failed to fetch bookmarked articles" }
  }
}

// Bookmark an article
export async function bookmarkArticle(articleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if article exists
    const article = await db.newsArticle.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return { success: false, error: "Article not found" }
    }

    // Check if already bookmarked
    const existingBookmark = await db.newsBookmark.findUnique({
      where: {
        userId_articleId: {
          userId: session.user.id,
          articleId: articleId
        }
      }
    })

    if (existingBookmark) {
      return { success: false, error: "Article already bookmarked" }
    }

    await db.newsBookmark.create({
      data: {
        userId: session.user.id,
        articleId: articleId
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error bookmarking article:", error)
    return { success: false, error: "Failed to bookmark article" }
  }
}

// Remove bookmark
export async function removeBookmark(articleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    await db.newsBookmark.deleteMany({
      where: {
        userId: session.user.id,
        articleId: articleId
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error removing bookmark:", error)
    return { success: false, error: "Failed to remove bookmark" }
  }
}

// Get daily digest
export async function getDailyDigest(date?: Date): Promise<{ articles: NewsArticle[]; error?: string }> {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    if (!session?.user?.id) {
      return { articles: [], error: "Unauthorized" }
    }

    const targetDate = date || new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Get digest for the day
    const digest = await db.newsDigest.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: startOfDay
        }
      }
    })

    if (!digest) {
      return { articles: [], error: "No digest available for this date" }
    }

    // Get articles from digest
    const articles = await db.newsArticle.findMany({
      where: {
        id: { in: digest.articles }
      },
      orderBy: [
        { relevanceScore: 'desc' },
        { publishedAt: 'desc' }
      ],
      include: {
        bookmarks: {
          where: { userId: session.user.id },
          select: { id: true }
        }
      }
    })

    const articlesWithBookmarks = articles.map(article => ({
      ...article,
      isBookmarked: article.bookmarks.length > 0
    }))

    return { articles: articlesWithBookmarks }
  } catch (error) {
    console.error("Error fetching daily digest:", error)
    return { articles: [], error: "Failed to fetch daily digest" }
  }
}

// Get available news sources
export async function getNewsSources(): Promise<{ sources: string[]; error?: string }> {
  try {
    const sources = await db.newsArticle.findMany({
      select: { source: true },
      distinct: ['source'],
      orderBy: { source: 'asc' }
    })

    return { sources: sources.map(s => s.source) }
  } catch (error) {
    console.error("Error fetching news sources:", error)
    return { sources: [], error: "Failed to fetch news sources" }
  }
}

// Get available news categories
export async function getNewsCategories(): Promise<{ categories: string[]; error?: string }> {
  try {
    const categories = await db.newsArticle.findMany({
      select: { category: true },
      where: { category: { not: null } },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    })

    return { categories: categories.map(c => c.category!).filter(Boolean) }
  } catch (error) {
    console.error("Error fetching news categories:", error)
    return { categories: [], error: "Failed to fetch news categories" }
  }
}

// Get available news tags (top tags by frequency)
export async function getNewsTags(): Promise<{ tags: string[]; error?: string }> {
  try {
    const articles = await db.newsArticle.findMany({
      select: { tags: true }
    })

    // Count tag frequency
    const tagFrequency = new Map<string, number>()
    articles.forEach(article => {
      article.tags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1)
      })
    })

    // Sort by frequency (descending) and get top 20 tags
    const topTags = Array.from(tagFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([tag]) => tag)

    return { tags: topTags }
  } catch (error) {
    console.error("Error fetching news tags:", error)
    return { tags: [], error: "Failed to fetch news tags" }
  }
}
