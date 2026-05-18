import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { AuthOptionsCompat } from "@/lib/auth"
import type { Session } from "next-auth"
import { prisma } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const minRelevance = Number(searchParams.get('minRelevance') || 50) / 100

    // Count articles for each role using JSONB queries
    const [developerCount, qcCount, baCount] = await Promise.all([
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::int as count 
        FROM news_articles 
        WHERE (role_scores->>'developer')::float >= ${minRelevance}
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::int as count 
        FROM news_articles 
        WHERE (role_scores->>'qc')::float >= ${minRelevance}
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::int as count 
        FROM news_articles 
        WHERE (role_scores->>'ba')::float >= ${minRelevance}
      `
    ])

    return NextResponse.json({
      success: true,
      counts: {
        developer: Number(developerCount[0]?.count || 0),
        qc: Number(qcCount[0]?.count || 0),
        ba: Number(baCount[0]?.count || 0)
      }
    })
  } catch (error) {
    console.error("Get role counts error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

