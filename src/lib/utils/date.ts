/**
 * Utility functions for date calculations and formatting
 */

/**
 * Format date to dd/MM/yyyy format
 */
export function formatDateDDMMYYYY(date: Date | string): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export interface DateInfo {
  daysRemaining: number
  displayText: string
  isOverdue: boolean
  isDueToday: boolean
  isDueSoon: boolean
  fullDate: string
}

/**
 * Calculate remaining days and format display text for a due date
 */
export function getDateInfo(dueDate: Date | string, taskStatus?: string, completedAt?: Date | string | null, updatedAt?: Date | string | null): DateInfo {
  const date = new Date(dueDate)
  const today = new Date()
  
  // Reset time to start of day for accurate day comparison
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  
  const diffTime = date.getTime() - today.getTime()
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24))
  
  // Don't mark as overdue if task is completed
  const isOverdue = daysRemaining < 0 && taskStatus !== 'done'
  const isDueToday = daysRemaining === 0
  const isDueSoon = daysRemaining > 0 && daysRemaining <= 2
  
  let displayText: string
  if (isOverdue) {
    displayText = `Overdue ${Math.abs(daysRemaining)}d`
  } else if (isDueToday) {
    displayText = 'Due today'
  } else if (daysRemaining === 1) {
    displayText = 'Due tomorrow'
  } else if (daysRemaining <= 7) {
    displayText = `Due in ${daysRemaining}d`
  } else if (daysRemaining <= 30) {
    displayText = `Due in ${daysRemaining}d`
  } else {
    displayText = formatDateDDMMYYYY(date)
  }
  
  // For done tasks, show completion info instead of due date info
  if (taskStatus === 'done') {
    if (completedAt) {
      // New tasks with completion tracking
      const completionDate = new Date(completedAt)
      const completionDateStr = formatDateDDMMYYYY(completionDate)
      const completionTimeStr = completionDate.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
      displayText = `Done ${completionDateStr} ${completionTimeStr}`
    } else if (updatedAt) {
      // Legacy tasks - use updatedAt as completion date
      const completionDate = new Date(updatedAt)
      const completionDateStr = formatDateDDMMYYYY(completionDate)
      const completionTimeStr = completionDate.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
      displayText = `Done ${completionDateStr} ${completionTimeStr}`
    } else {
      // Fallback for tasks without completion info
      displayText = `Done`
    }
  }
  
  const fullDate = formatDateDDMMYYYY(date)
  
  return {
    daysRemaining,
    displayText,
    isOverdue,
    isDueToday,
    isDueSoon,
    fullDate
  }
}

/**
 * Get CSS classes for date styling based on due date status
 */
export function getDateClasses(dateInfo: DateInfo, taskStatus?: string): {
  container: string
  text: string
} {
  // Completed tasks get green styling
  if (taskStatus === 'done') {
    return {
      container: 'bg-green-50 border-green-200',
      text: 'text-green-600'
    }
  } else if (dateInfo.isOverdue) {
    return {
      container: 'bg-red-50 border-red-200',
      text: 'text-red-600'
    }
  } else if (dateInfo.isDueSoon) {
    return {
      container: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-600'
    }
  } else {
    return {
      container: 'bg-blue-50 border-blue-200',
      text: 'text-blue-600'
    }
  }
}
