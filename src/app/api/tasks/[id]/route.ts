import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { AuthOptionsCompat } from "@/lib/auth"
import { prisma } from "@/lib/database"

// GET /api/tasks/[id] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const userId = session.user.id

    const task = await prisma.task.findFirst({
      where: {
        id: id,
        userId: userId // Ensure user can only access their own tasks
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}

// PUT /api/tasks/[id] - Update a specific task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const userId = session.user.id
    const body = await request.json()
    const { title, description, status } = body

    // Validate status if provided
    if (status && !["todo", "in-progress", "done"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Validate title if provided
    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 })
    }

    const updateData: {
      title?: string
      description?: string | null
      status?: string
    } = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (status !== undefined) updateData.status = status

    const task = await prisma.task.updateMany({
      where: {
        id: id,
        userId: userId // Ensure user can only update their own tasks
      },
      data: updateData
    })

    if (task.count === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Fetch the updated task
    const updatedTask = await prisma.task.findFirst({
      where: {
        id: id,
        userId: userId
      }
    })

    return NextResponse.json({ success: true, task: updatedTask })
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Delete a specific task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const userId = session.user.id

    const task = await prisma.task.deleteMany({
      where: {
        id: id,
        userId: userId // Ensure user can only delete their own tasks
      }
    })

    if (task.count === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Task deleted successfully" })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
