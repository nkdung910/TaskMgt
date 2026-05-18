import { NextResponse } from "next/server"
import { getNewsTags } from "@/lib/news"

export async function GET() {
  try {
    const result = await getNewsTags()
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ tags: result.tags })
  } catch (error) {
    console.error("Tags API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
