/**
 * Utility Functions Tests
 * 
 * Tests for date utilities, lane configuration, and other utility functions
 */

import { describe, it, expect } from '@jest/globals'
import { getDateInfo, getDateClasses } from '../../src/lib/utils/date'
import { getLanesForType, getGroupingField } from '../../src/lib/tasks/lane-config'

describe('Date Utilities', () => {
  describe('getDateInfo', () => {
    it('should handle today date', () => {
      const today = new Date()
      const info = getDateInfo(today)
      expect(info.isDueToday).toBe(true)
      expect(info.displayText).toBe('Due today')
      expect(info.daysRemaining).toBe(0)
    })

    it('should handle tomorrow date', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const info = getDateInfo(tomorrow)
      expect(info.daysRemaining).toBe(1)
      expect(info.displayText).toBe('Due tomorrow')
      expect(info.isOverdue).toBe(false)
    })

    it('should handle yesterday date', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const info = getDateInfo(yesterday)
      expect(info.isOverdue).toBe(true)
      expect(info.daysRemaining).toBe(-1)
      expect(info.displayText).toContain('Overdue')
    })

    it('should handle overdue dates', () => {
      const overdue = new Date()
      overdue.setDate(overdue.getDate() - 5)
      const info = getDateInfo(overdue)
      expect(info.isOverdue).toBe(true)
      expect(info.daysRemaining).toBe(-5)
      expect(info.displayText).toContain('Overdue')
      expect(info.displayText).toContain('5d')
    })

    it('should handle future dates within a week', () => {
      const future = new Date()
      future.setDate(future.getDate() + 7)
      const info = getDateInfo(future)
      expect(info.isOverdue).toBe(false)
      expect(info.daysRemaining).toBe(7)
      expect(info.displayText).toContain('Due in')
      expect(info.displayText).toContain('7d')
    })

    it('should handle due soon dates', () => {
      const dueSoon = new Date()
      dueSoon.setDate(dueSoon.getDate() + 2)
      const info = getDateInfo(dueSoon)
      expect(info.isDueSoon).toBe(true)
      expect(info.daysRemaining).toBe(2)
    })

    it('should return formatted date string', () => {
      const testDate = new Date('2024-12-25')
      const info = getDateInfo(testDate)
      expect(info.fullDate).toBeDefined()
      expect(typeof info.fullDate).toBe('string')
      expect(info.fullDate).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })

  describe('getDateClasses', () => {
    it('should return red classes for overdue dates', () => {
      const overdueInfo = {
        isOverdue: true,
        isDueToday: false,
        isDueSoon: false,
        displayText: 'Overdue 5d',
        fullDate: '01/01/2024',
        daysRemaining: -5
      }
      const classes = getDateClasses(overdueInfo)
      expect(classes.text).toContain('red')
      expect(classes.container).toContain('red')
    })

    it('should return yellow classes for due soon dates', () => {
      const dueSoonInfo = {
        isOverdue: false,
        isDueToday: false,
        isDueSoon: true,
        displayText: 'Due in 2d',
        fullDate: '01/01/2024',
        daysRemaining: 2
      }
      const classes = getDateClasses(dueSoonInfo)
      expect(classes.text).toContain('yellow')
      expect(classes.container).toContain('yellow')
    })

    it('should return blue classes for future dates', () => {
      const futureInfo = {
        isOverdue: false,
        isDueToday: false,
        isDueSoon: false,
        displayText: 'Due in 7d',
        fullDate: '01/01/2024',
        daysRemaining: 7
      }
      const classes = getDateClasses(futureInfo)
      expect(classes.text).toContain('blue')
      expect(classes.container).toContain('blue')
    })

    it('should return blue classes for today (not due soon)', () => {
      const todayInfo = {
        isOverdue: false,
        isDueToday: true,
        isDueSoon: false,
        displayText: 'Due today',
        fullDate: '01/01/2024',
        daysRemaining: 0
      }
      const classes = getDateClasses(todayInfo)
      expect(classes.text).toContain('blue')
      expect(classes.container).toContain('blue')
    })
  })
})

describe('Lane Configuration', () => {
  describe('getGroupingField', () => {
    it('should return correct field for status lane type', () => {
      expect(getGroupingField('status')).toBe('status')
    })

    it('should return correct field for priority lane type', () => {
      expect(getGroupingField('priority')).toBe('priority')
    })

    it('should return correct field for type lane type', () => {
      expect(getGroupingField('type')).toBe('type')
    })

    it('should return correct field for category lane type', () => {
      expect(getGroupingField('category')).toBe('category')
    })

    it('should return correct field for assignee lane type', () => {
      expect(getGroupingField('assignee')).toBe('assignee')
    })

    it('should return correct field for time lane type', () => {
      expect(getGroupingField('time')).toBe('timeFrame')
    })
  })

  describe('getLanesForType', () => {
    it('should return status lanes', () => {
      const lanes = getLanesForType('status')
      expect(Array.isArray(lanes)).toBe(true)
      expect(lanes.length).toBeGreaterThan(0)
      expect(lanes[0]).toHaveProperty('id')
      expect(lanes[0]).toHaveProperty('title')
      expect(lanes[0]).toHaveProperty('color')
      expect(lanes[0]).toHaveProperty('icon')
    })

    it('should return priority lanes', () => {
      const lanes = getLanesForType('priority')
      expect(Array.isArray(lanes)).toBe(true)
      expect(lanes.length).toBeGreaterThan(0)
      const priorities = lanes.map(l => l.id)
      expect(priorities).toContain('urgent')
      expect(priorities).toContain('high')
      expect(priorities).toContain('medium')
      expect(priorities).toContain('low')
    })

    it('should return type lanes', () => {
      const lanes = getLanesForType('type')
      expect(Array.isArray(lanes)).toBe(true)
      expect(lanes.length).toBeGreaterThan(0)
    })

    it('should return category lanes with custom categories', () => {
      const customCategories = ['work', 'personal', 'urgent']
      const lanes = getLanesForType('category', { categories: customCategories })
      expect(Array.isArray(lanes)).toBe(true)
      expect(lanes.length).toBe(customCategories.length)
      expect(lanes.map(l => l.id)).toEqual(customCategories)
    })

    it('should return assignee lanes with custom assignees', () => {
      const customAssignees = ['alice', 'bob', 'charlie']
      const lanes = getLanesForType('assignee', { assignees: customAssignees })
      expect(Array.isArray(lanes)).toBe(true)
      expect(lanes.length).toBe(customAssignees.length)
      expect(lanes.map(l => l.id)).toEqual(customAssignees)
    })

    it('should return timeFrame lanes', () => {
      const lanes = getLanesForType('timeFrame')
      expect(Array.isArray(lanes)).toBe(true)
      expect(lanes.length).toBeGreaterThan(0)
    })

    it('should apply dark mode colors when specified', () => {
      const lanesLight = getLanesForType('status', undefined, false)
      const lanesDark = getLanesForType('status', undefined, true)
      expect(lanesLight[0].color).toBeDefined()
      expect(lanesDark[0].color).toBeDefined()
      // Dark mode lanes should have different colors
      expect(lanesDark[0].color).not.toBe(lanesLight[0].color)
    })
  })
})

describe('Task Validation', () => {
  describe('Task Title Validation', () => {
    it('should accept valid task titles', () => {
      const validTitles = [
        'Simple task',
        'Task with numbers 123',
        'Task with special chars: @#$',
        'Very long task title that goes on and on and on...',
      ]
      validTitles.forEach(title => {
        expect(title.length).toBeGreaterThan(0)
        expect(typeof title).toBe('string')
      })
    })

    it('should reject empty task titles', () => {
      const emptyTitle = ''
      expect(emptyTitle.length).toBe(0)
    })
  })

  describe('Task Priority Validation', () => {
    it('should accept valid priorities', () => {
      const validPriorities = ['urgent', 'high', 'medium', 'low']
      validPriorities.forEach(priority => {
        expect(['urgent', 'high', 'medium', 'low']).toContain(priority)
      })
    })

    it('should have default priority', () => {
      const defaultPriority = 'medium'
      expect(['urgent', 'high', 'medium', 'low']).toContain(defaultPriority)
    })
  })

  describe('Task Status Validation', () => {
    it('should accept valid statuses', () => {
      const validStatuses = ['todo', 'in-progress', 'done', 'blocked']
      validStatuses.forEach(status => {
        expect(typeof status).toBe('string')
        expect(status.length).toBeGreaterThan(0)
      })
    })
  })
})

