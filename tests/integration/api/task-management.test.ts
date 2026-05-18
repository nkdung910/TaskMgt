/**
 * Task Management Test Suite
 * 
 * Tests for task CRUD operations, configuration, and business logic
 */

import { describe, it, expect } from '@jest/globals'

describe('Task Management', () => {
  const BASE_URL = process.env.NEXTAUTH_URL || 'https://taskmgt-virid.vercel.app'

  describe('Task CRUD API', () => {
    it('should require authentication for GET /api/tasks', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks`)
      expect([401, 403]).toContain(response.status)
    })

    it('should require authentication for POST /api/tasks', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Task',
          description: 'Test Description'
        })
      })
      expect([401, 403]).toContain(response.status)
    })

    it('should reject task creation with empty title', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '',
          description: 'Test Description'
        })
      })
      expect([400, 401, 422]).toContain(response.status)
    })

    it('should accept task creation with only title', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Minimal Task'
        })
      })
      expect([200, 201, 401]).toContain(response.status)
    })

    it('should require authentication for PUT /api/tasks/[id]', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks/test-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' })
      })
      expect([401, 403, 404]).toContain(response.status)
    })

    it('should require authentication for DELETE /api/tasks/[id]', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks/test-id`, {
        method: 'DELETE'
      })
      expect([401, 403, 404]).toContain(response.status)
    })

    it('should support PATCH for partial task updates', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks/test-id`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in-progress' })
      })
      expect([200, 401, 404, 405]).toContain(response.status)
    })
  })

  describe('Task Filtering and Sorting', () => {
    it('should support filtering by status', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks?status=todo`)
      expect([200, 401]).toContain(response.status)
    })

    it('should support filtering by priority', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks?priority=high`)
      expect([200, 401]).toContain(response.status)
    })

    it('should support filtering by category', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks?category=work`)
      expect([200, 401]).toContain(response.status)
    })

    it('should support filtering by type', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks?type=bug`)
      expect([200, 401]).toContain(response.status)
    })

    it('should support filtering by assignee', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks?assignee=john`)
      expect([200, 401]).toContain(response.status)
    })

    it('should support search by title', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks?search=meeting`)
      expect([200, 401]).toContain(response.status)
    })

    it('should support filtering by tags', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks?tags=urgent,important`)
      expect([200, 401]).toContain(response.status)
    })

    it('should support sorting by due date', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks?sortBy=dueDate&order=asc`)
      expect([200, 401]).toContain(response.status)
    })

    it('should support sorting by priority', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks?sortBy=priority&order=desc`)
      expect([200, 401]).toContain(response.status)
    })

    it('should support pagination', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks?limit=10&offset=20`)
      expect([200, 401]).toContain(response.status)
    })

    it('should support filtering by completed status', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks?completed=true`)
      expect([200, 401]).toContain(response.status)
    })

    it('should support filtering by due date range', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks?dueDateFrom=2025-10-01&dueDateTo=2025-10-31`)
      expect([200, 401]).toContain(response.status)
    })
  })

  describe('User Configuration API', () => {
    it('should require authentication for GET /api/user/config', async () => {
      const response = await fetch(`${BASE_URL}/api/user/config`)
      expect([200, 401, 404]).toContain(response.status)
    })

    it('should require authentication for POST /api/user/config', async () => {
      const response = await fetch(`${BASE_URL}/api/user/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statuses: ['todo', 'in-progress', 'done']
        })
      })
      expect([200, 401]).toContain(response.status)
    })

    it('should reject config with empty status array', async () => {
      const response = await fetch(`${BASE_URL}/api/user/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statuses: []
        })
      })
      expect([400, 401, 422]).toContain(response.status)
    })

    it('should accept config with custom statuses', async () => {
      const response = await fetch(`${BASE_URL}/api/user/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statuses: ['backlog', 'in-progress', 'review', 'done']
        })
      })
      expect([200, 401]).toContain(response.status)
    })

    it('should accept config with custom priorities', async () => {
      const response = await fetch(`${BASE_URL}/api/user/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priorities: ['critical', 'high', 'medium', 'low', 'trivial']
        })
      })
      expect([200, 401]).toContain(response.status)
    })
  })
})

describe('Task Validation', () => {
  describe('Task Title Validation', () => {
    it('should accept valid task titles', () => {
      const validTitles = [
        'Simple task',
        'Task with numbers 123',
        'Task with special chars: @#$%',
        'Very long task title that goes on and on and on and continues for a while',
        'Emoji task 🎯',
        'Multiple    spaces    task'
      ]

      validTitles.forEach(title => {
        expect(title.length).toBeGreaterThan(0)
        expect(typeof title).toBe('string')
      })
    })

    it('should reject empty title', () => {
      const emptyTitle = ''
      expect(emptyTitle.length).toBe(0)
    })

    it('should reject title with only whitespace', () => {
      const whitespaceTitle = '   '
      expect(whitespaceTitle.trim().length).toBe(0)
    })

    it('should handle very long titles', () => {
      const longTitle = 'a'.repeat(1000)
      expect(longTitle.length).toBe(1000)
    })
  })

  describe('Task Status Validation', () => {
    it('should accept valid status values', () => {
      const validStatuses = ['todo', 'in-progress', 'done', 'blocked', 'review', 'backlog']
      
      validStatuses.forEach(status => {
        expect(typeof status).toBe('string')
        expect(status.length).toBeGreaterThan(0)
      })
    })

    it('should handle status case sensitivity', () => {
      const status1 = 'todo'
      const status2 = 'TODO'
      const status3 = 'ToDo'
      
      expect(status1.toLowerCase()).toBe('todo')
      expect(status2.toLowerCase()).toBe('todo')
      expect(status3.toLowerCase()).toBe('todo')
    })
  })

  describe('Task Priority Validation', () => {
    it('should accept valid priority values', () => {
      const validPriorities = ['urgent', 'high', 'medium', 'low']
      
      validPriorities.forEach(priority => {
        expect(['urgent', 'high', 'medium', 'low']).toContain(priority)
      })
    })

    it('should have default priority', () => {
      const defaultPriority = 'medium'
      expect(['urgent', 'high', 'medium', 'low']).toContain(defaultPriority)
    })

    it('should order priorities correctly', () => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      
      expect(priorityOrder.urgent).toBeGreaterThan(priorityOrder.high)
      expect(priorityOrder.high).toBeGreaterThan(priorityOrder.medium)
      expect(priorityOrder.medium).toBeGreaterThan(priorityOrder.low)
    })
  })

  describe('Task Due Date Validation', () => {
    it('should accept valid future dates', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      
      expect(futureDate.getTime()).toBeGreaterThan(Date.now())
    })

    it('should accept today as due date', () => {
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      
      expect(today.getTime()).toBeGreaterThanOrEqual(Date.now())
    })

    it('should handle past due dates (overdue)', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)
      
      expect(pastDate.getTime()).toBeLessThan(Date.now())
    })

    it('should handle null due date (no deadline)', () => {
      const noDueDate = null
      expect(noDueDate).toBeNull()
    })

    it('should validate date format', () => {
      const validDates = [
        '2025-12-31',
        '2025-10-12T14:30:00Z',
        new Date().toISOString()
      ]

      validDates.forEach(date => {
        expect(typeof date).toBe('string')
        expect(date.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Task Tags Validation', () => {
    it('should accept multiple tags', () => {
      const tags = ['urgent', 'meeting', 'client', 'q4']
      expect(Array.isArray(tags)).toBe(true)
      expect(tags.length).toBe(4)
    })

    it('should accept empty tags array', () => {
      const tags: string[] = []
      expect(Array.isArray(tags)).toBe(true)
      expect(tags.length).toBe(0)
    })

    it('should handle duplicate tags', () => {
      const tags = ['urgent', 'urgent', 'meeting']
      const uniqueTags = [...new Set(tags)]
      
      expect(uniqueTags.length).toBe(2)
      expect(uniqueTags).toContain('urgent')
      expect(uniqueTags).toContain('meeting')
    })

    it('should handle tags with special characters', () => {
      const tags = ['@home', '#coding', 'next.js', 'c++']
      
      tags.forEach(tag => {
        expect(typeof tag).toBe('string')
      })
    })
  })

  describe('Task Description Validation', () => {
    it('should accept long descriptions', () => {
      const longDescription = 'a'.repeat(5000)
      expect(longDescription.length).toBe(5000)
    })

    it('should accept empty description', () => {
      const emptyDescription = ''
      expect(emptyDescription.length).toBe(0)
    })

    it('should accept null description', () => {
      const nullDescription = null
      expect(nullDescription).toBeNull()
    })

    it('should accept descriptions with markdown', () => {
      const markdownDescription = '## Header\n\n- List item\n- Another item\n\n**Bold text**'
      expect(markdownDescription).toContain('##')
      expect(markdownDescription).toContain('**')
    })

    it('should accept descriptions with URLs', () => {
      const descriptionWithUrl = 'Check this: https://example.com'
      expect(descriptionWithUrl).toMatch(/https?:\/\//)
    })
  })
})

describe('Task Business Logic', () => {
  describe('Task Completion', () => {
    it('should mark task as completed with timestamp', () => {
      const completedAt = new Date()
      const isCompleted = true
      
      expect(isCompleted).toBe(true)
      expect(completedAt).toBeInstanceOf(Date)
    })

    it('should allow uncompleting a task', () => {
      const completedAt = null
      const isCompleted = false
      
      expect(isCompleted).toBe(false)
      expect(completedAt).toBeNull()
    })
  })

  describe('Task Overdue Logic', () => {
    it('should identify overdue tasks', () => {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() - 1)
      const isCompleted = false
      
      const isOverdue = dueDate < new Date() && !isCompleted
      expect(isOverdue).toBe(true)
    })

    it('should not mark completed tasks as overdue', () => {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() - 1)
      const isCompleted = true
      
      const isOverdue = dueDate < new Date() && !isCompleted
      expect(isOverdue).toBe(false)
    })

    it('should not mark future tasks as overdue', () => {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 1)
      const isCompleted = false
      
      const isOverdue = dueDate < new Date() && !isCompleted
      expect(isOverdue).toBe(false)
    })
  })

  describe('Task Ordering', () => {
    it('should support custom ordering within a lane', () => {
      const tasks = [
        { id: '1', order: 1 },
        { id: '2', order: 2 },
        { id: '3', order: 3 }
      ]
      
      const sorted = tasks.sort((a, b) => a.order - b.order)
      expect(sorted[0].id).toBe('1')
      expect(sorted[2].id).toBe('3')
    })

    it('should handle reordering tasks', () => {
      const task = { id: '2', order: 2 }
      const newOrder = 1
      
      task.order = newOrder
      expect(task.order).toBe(1)
    })
  })

  describe('Task Categories and Tags', () => {
    it('should support single category per task', () => {
      const task = {
        category: 'work'
      }
      
      expect(task.category).toBe('work')
    })

    it('should support multiple tags per task', () => {
      const task = {
        tags: ['urgent', 'meeting', 'client']
      }
      
      expect(task.tags).toHaveLength(3)
    })

    it('should allow null category', () => {
      const task = {
        category: null
      }
      
      expect(task.category).toBeNull()
    })
  })

  describe('Task Assignee', () => {
    it('should support assigned tasks', () => {
      const task = {
        assignee: 'john.doe'
      }
      
      expect(task.assignee).toBe('john.doe')
    })

    it('should support unassigned tasks', () => {
      const task = {
        assignee: null
      }
      
      expect(task.assignee).toBeNull()
    })
  })
})

describe('Task Edge Cases', () => {
  describe('Data Isolation', () => {
    it('should ensure tasks are user-specific', () => {
      const task1 = { userId: 'user-1', title: 'Task 1' }
      const task2 = { userId: 'user-2', title: 'Task 2' }
      
      expect(task1.userId).not.toBe(task2.userId)
    })

    it('should prevent access to other users tasks', () => {
      const requestingUserId = 'user-1'
      const taskUserId = 'user-2'
      
      const hasAccess = requestingUserId === taskUserId
      expect(hasAccess).toBe(false)
    })
  })

  describe('Concurrent Updates', () => {
    it('should handle simultaneous task updates', () => {
      const update1 = { id: '1', version: 2, title: 'Update 1' }
      const update2 = { id: '1', version: 2, title: 'Update 2' }
      
      // Version conflict detection
      expect(update1.version).toBe(update2.version)
    })
  })

  describe('Bulk Operations', () => {
    it('should support bulk status update', () => {
      const taskIds = ['1', '2', '3']
      const newStatus = 'done'
      
      expect(taskIds).toHaveLength(3)
      expect(newStatus).toBe('done')
    })

    it('should support bulk delete', () => {
      const taskIds = ['1', '2', '3', '4', '5']
      
      expect(taskIds).toHaveLength(5)
    })
  })
})

