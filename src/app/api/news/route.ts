import { NextRequest, NextResponse } from "next/server"
import { getNewsArticles } from "@/lib/news"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      category: searchParams.get('category') || undefined,
      source: searchParams.get('source') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      search: searchParams.get('search') || undefined,
    }

    const result = await getNewsArticles(filters)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    return NextResponse.json({
      articles: result.articles,
      total: result.total,
      limit: filters.limit || 20,
      offset: filters.offset || 0
    })
  } catch (error) {
    console.error("News API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
