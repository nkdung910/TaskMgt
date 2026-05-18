import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { AuthOptionsCompat } from "@/lib/auth"
import type { Session } from "next-auth"
import { aiSummarizationService } from "@/lib/services/ai"
import { prisma as db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, articleId, options } = await request.json()

    switch (action) {
      case 'status':
        const status = aiSummarizationService.getStatus()
        return NextResponse.json({ status })

      case 'summarize_article':
        if (!articleId) {
          return NextResponse.json({ error: "Article ID is required" }, { status: 400 })
        }

        // Get article from database
        const article = await db.newsArticle.findUnique({
          where: { id: articleId },
          select: { id: true, title: true, content: true, summary: true }
        })

        if (!article) {
          return NextResponse.json({ error: "Article not found" }, { status: 404 })
        }

        // Generate AI summary
        const result = await aiSummarizationService.summarize(article.content, options || {})
        
        // Update article with new summary
        await db.newsArticle.update({
          where: { id: articleId },
          data: { summary: result.summary }
        })

        return NextResponse.json({
          success: true,
          summary: result.summary,
          provider: result.provider,
          confidence: result.confidence,
          processingTime: result.processingTime
        })

      case 'summarize_all':
        // Get articles without summaries
        const articlesToSummarize = await db.newsArticle.findMany({
          where: {
            OR: [
              { summary: null },
              { summary: '' }
            ]
          },
          select: { id: true, title: true, content: true },
          take: 10 // Limit to 10 articles at a time
        })

        if (articlesToSummarize.length === 0) {
          return NextResponse.json({
            success: true,
            message: "No articles need summarization",
            processed: 0
          })
        }

        // Summarize articles in batch
        const summaries = await aiSummarizationService.summarizeBatch(
          articlesToSummarize,
          options || {}
        )

        // Update articles with summaries
        let processed = 0
        for (const summary of summaries) {
          try {
            await db.newsArticle.update({
              where: { id: summary.id },
              data: { summary: summary.summary }
            })
            processed++
          } catch (error) {
            console.error(`Failed to update article ${summary.id}:`, error)
          }
        }

        return NextResponse.json({
          success: true,
          message: `Summarized ${processed} articles`,
          processed,
          summaries: summaries.map(s => ({
            id: s.id,
            provider: s.provider,
            confidence: s.confidence
          }))
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("AI summarization API error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process summarization request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
