import { NextResponse } from "next/server"
import { getNewsSources } from "@/lib/news"

export async function GET() {
  try {
    const result = await getNewsSources()
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ sources: result.sources })
  } catch (error) {
    console.error("Sources API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
