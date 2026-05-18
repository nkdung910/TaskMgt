"use server"

import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { AuthOptionsCompat } from "@/lib/auth/types"
import { prisma } from "@/lib/database"
import { getUserConfig } from "@/lib/config/actions"

export async function createTask(data: {
  title: string
  description?: string
  dueDate?: string | null
  priority?: string
  type?: string
  timeFrame?: string
  category?: string
  assignee?: string
  tags?: string[]
}) {
  try {
    // Add timeout to prevent hanging
    const sessionPromise = getServerSession(authOptions as AuthOptionsCompat)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session timeout')), 10000)
    )
    
    const session = (await Promise.race([sessionPromise, timeoutPromise])) as Session | null
    
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    // Add timeout to database operation as well
        const dbPromise = prisma.task.create({
          data: {
            title: data.title,
            description: data.description || null,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            priority: data.priority || "medium",
            type: data.type || "development",
            timeFrame: data.timeFrame || "this-week",
            category: data.category || "general",
            assignee: data.assignee || null,
            tags: data.tags || [],
            userId: session.user.id,
            status: "todo"
          }
        })
    
    const dbTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 15000)
    )
    
    const task = await Promise.race([dbPromise, dbTimeoutPromise])
    return { success: true, task }
  } catch (error) {
    console.error("Error creating task:", error)
    return { error: `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

export async function getTasks(filters?: {
  status?: string
  tags?: string[]
  search?: string
  priority?: string
  assignee?: string
  type?: string
  category?: string
  timeFrame?: string
  dueDateFrom?: string
  dueDateTo?: string
}) {
  try {
    // Add timeout to prevent hanging
    const sessionPromise = getServerSession(authOptions as AuthOptionsCompat)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session timeout')), 5000)
    )
    
    const session = (await Promise.race([sessionPromise, timeoutPromise])) as Session | null
    
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    const whereClause: Record<string, unknown> = {
      userId: session.user.id
    }

    // Add filters
    if (filters?.status) {
      whereClause.status = filters.status
    }

    if (filters?.priority) {
      whereClause.priority = filters.priority
    }

    if (filters?.assignee) {
      whereClause.assignee = filters.assignee
    }

    if (filters?.type) {
      whereClause.type = filters.type
    }

    if (filters?.category) {
      whereClause.category = filters.category
    }

    if (filters?.timeFrame) {
      whereClause.timeFrame = filters.timeFrame
    }

    if (filters?.tags && filters.tags.length > 0) {
      whereClause.tags = {
        hasSome: filters.tags
      }
    }

    if (filters?.dueDateFrom || filters?.dueDateTo) {
      whereClause.dueDate = {} as Record<string, Date>
      if (filters.dueDateFrom) {
        (whereClause.dueDate as Record<string, Date>).gte = new Date(filters.dueDateFrom)
      }
      if (filters.dueDateTo) {
        (whereClause.dueDate as Record<string, Date>).lte = new Date(filters.dueDateTo)
      }
    }

    if (filters?.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } }
      ]
    }

    // Add timeout to database query
    const dbPromise = prisma.task.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc"
      },
      take: 100 // Limit to 100 tasks to prevent performance issues
    })
    
    const dbTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 10000)
    )
    
    const tasks = await Promise.race([dbPromise, dbTimeoutPromise]) as Record<string, unknown>[]

    return { success: true, tasks }
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return { error: `Failed to fetch tasks: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

export async function updateTaskField(taskId: string, field: string, value: string | string[]) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    // Prepare update data
    const updateData: Record<string, string | Date | null | string[]> = {}
    if (field === "dueDate" && value) {
      updateData[field] = new Date(value as string)
    } else {
      updateData[field] = value
    }
    
    // If status is being changed to "done" or "completed", set completedAt
    if (field === "status" && (value === "done" || value === "completed")) {
      updateData.completedAt = new Date()
    }
    // If status is being changed from "done" or "completed" to something else, clear completedAt
    else if (field === "status" && value !== "done" && value !== "completed") {
      updateData.completedAt = null
    }

    const task = await prisma.task.update({
      where: {
        id: taskId,
        userId: session.user.id // Ensure user can only update their own tasks
      },
      data: updateData
    })

    return { success: true, task }
  } catch (error) {
    console.error("Error updating task:", error)
    return { error: "Failed to update task" }
  }
}

// Backward compatibility function
export async function updateTaskStatus(taskId: string, status: string) {
  return updateTaskField(taskId, "status", status)
}

export async function getUniqueStatusValues() {
  try {
    // Get user configuration instead of querying tasks
    const configResult = await getUserConfig()
    if (configResult.error) {
      return { error: configResult.error }
    }

    const statusValues = configResult.config?.statuses || ["todo", "in-progress", "review", "testing", "done"]
    return { success: true, statusValues }
  } catch (error) {
    console.error("Error fetching unique status values:", error)
    return { error: `Failed to fetch status values: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Get available values for all configuration categories
export async function getAvailableValues() {
  try {
    const configResult = await getUserConfig()
    if (configResult.error) {
      return { error: configResult.error }
    }

    const config = configResult.config!
    return {
      success: true,
      values: {
        statuses: config.statuses,
        priorities: config.priorities,
        types: config.types,
        timeFrames: config.timeFrames,
        categories: config.categories,
        assignees: config.assignees
      }
    }
  } catch (error) {
    console.error("Error fetching available values:", error)
    return { error: `Failed to fetch available values: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

export async function deleteTask(taskId: string) {
  try {
    // Add timeout to prevent hanging
    const sessionPromise = getServerSession(authOptions as AuthOptionsCompat)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session timeout')), 5000)
    )
    
    const session = (await Promise.race([sessionPromise, timeoutPromise])) as Session | null
    
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    // Add timeout to database operation
    const dbPromise = prisma.task.delete({
      where: {
        id: taskId,
        userId: session.user.id // Ensure user can only delete their own tasks
      }
    })
    
    const dbTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 10000)
    )
    
    await Promise.race([dbPromise, dbTimeoutPromise])
    
    return { success: true }
  } catch (error) {
    console.error("Error deleting task:", error)
    return { error: `Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}
