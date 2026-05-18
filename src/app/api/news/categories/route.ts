import { NextResponse } from "next/server"
import { getNewsCategories } from "@/lib/news"

export async function GET() {
  try {
    const result = await getNewsCategories()
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ categories: result.categories })
  } catch (error) {
    console.error("Categories API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
