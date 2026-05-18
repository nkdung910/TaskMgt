import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { AuthOptionsCompat } from "@/lib/auth"
import { prisma } from "@/lib/database"

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Retrieves all tasks for the authenticated user, sorted by creation date (newest first)
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id

    const tasks = await prisma.task.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ success: true, tasks })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     description: Creates a new task for the authenticated user
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Complete project documentation
 *               description:
 *                 type: string
 *                 example: Write comprehensive API documentation
 *               status:
 *                 type: string
 *                 example: todo
 *               priority:
 *                 type: string
 *                 example: high
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-10-20T00:00:00Z
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [documentation, api]
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Not authenticated
 */
export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { title, description } = body

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        userId: userId,
        status: "todo"
      }
    })

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
