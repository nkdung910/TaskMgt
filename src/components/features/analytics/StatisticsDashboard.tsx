"use client"

import { useState, useEffect } from "react"
import { getTasks } from "@/lib/tasks"
import { useTheme } from "@/contexts/ThemeContext"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  type: string
  timeFrame: string
  category: string
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
}

interface StatisticsDashboardProps {
  isOpen?: boolean
  onClose?: () => void
}

interface TaskStats {
  total: number
  completed: number
  inProgress: number
  overdue: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  byType: Record<string, number>
  byTimeFrame: Record<string, number>
  byCategory: Record<string, number>
  completionRate: number
  averageCompletionTime: number
}

interface DayActivity {
  date: string
  count: number
  tasks: Task[]
}

export default function StatisticsDashboard({ isOpen = true, onClose }: StatisticsDashboardProps) {
  // Suppress unused parameter warnings for props that might be used in future
  void isOpen
  void onClose
  const { isDarkMode, isInitialized } = useTheme()
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [heatMapData, setHeatMapData] = useState<DayActivity[]>([])
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[] | null>(null)
  const [selectedDayDate, setSelectedDayDate] = useState<string>('')

  // Calculate statistics
  const calculateStats = async () => {
    setLoading(true)
    try {
      const result = await getTasks()
      if (result?.tasks) {
        const tasks = result.tasks as unknown as Task[]
        
        // Filter tasks by time range
        const now = new Date()
        const filteredTasks = tasks.filter(task => {
          const createdDate = new Date(task.createdAt)
          switch (timeRange) {
            case 'week':
              return createdDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            case 'month':
              return createdDate >= new Date(now.getFullYear(), now.getMonth(), 1)
            case 'quarter':
              const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
              return createdDate >= quarterStart
            case 'year':
              return createdDate >= new Date(now.getFullYear(), 0, 1)
            default:
              return true
          }
        })

        // Calculate statistics
        const total = filteredTasks.length
        const completed = filteredTasks.filter(task => task.status === 'done').length
        const inProgress = filteredTasks.filter(task => task.status === 'in-progress').length
        
        // Overdue tasks (has due date and is past due)
        const overdue = filteredTasks.filter(task => {
          if (!task.dueDate) return false
          return new Date(task.dueDate) < now && task.status !== 'done'
        }).length

        // Group by different categories
        const byStatus = filteredTasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const byPriority = filteredTasks.reduce((acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const byType = filteredTasks.reduce((acc, task) => {
          acc[task.type] = (acc[task.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const byTimeFrame = filteredTasks.reduce((acc, task) => {
          acc[task.timeFrame] = (acc[task.timeFrame] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const byCategory = filteredTasks.reduce((acc, task) => {
          acc[task.category] = (acc[task.category] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        // Calculate completion rate
        const completionRate = total > 0 ? (completed / total) * 100 : 0

        // Calculate average completion time using completedAt
        const completedTasks = filteredTasks.filter(task => task.status === 'done')
        const averageCompletionTime = completedTasks.length > 0 
          ? completedTasks.reduce((sum, task) => {
              const created = new Date(task.createdAt)
              // Use completedAt if available, otherwise fallback to updatedAt
              const completed = task.completedAt 
                ? new Date(task.completedAt) 
                : new Date(task.updatedAt)
              return sum + (completed.getTime() - created.getTime())
            }, 0) / completedTasks.length / (1000 * 60 * 60 * 24) // Convert to days
          : 0

        setStats({
          total,
          completed,
          inProgress,
          overdue,
          byStatus,
          byPriority,
          byType,
          byTimeFrame,
          byCategory,
          completionRate,
          averageCompletionTime
        })
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch heat map data
  const fetchHeatMapData = async () => {
    try {
      const result = await getTasks()
      if (!result?.tasks) return
      
      const tasks = result.tasks as unknown as Task[]
      
      // Get 4 weeks past + 1 week future (5 weeks total)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const startDate = new Date(today)
      startDate.setDate(startDate.getDate() - (4 * 7)) // 4 weeks ago
      
      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + 7) // 1 week future
      endDate.setHours(23, 59, 59, 999)
      
      // Group tasks by completion date (past/today), due date (future), and overdue
      const tasksByDate: Record<string, Task[]> = {}
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      
      tasks.forEach(task => {
        // For completed tasks (past and today)
        if ((task.status === 'done' || task.status === 'completed') && task.completedAt) {
          const completedDate = new Date(task.completedAt)
          // Use local date string instead of ISO to avoid timezone issues
          const year = completedDate.getFullYear()
          const month = String(completedDate.getMonth() + 1).padStart(2, '0')
          const day = String(completedDate.getDate()).padStart(2, '0')
          const dateStr = `${year}-${month}-${day}`
          
          if (!tasksByDate[dateStr]) {
            tasksByDate[dateStr] = []
          }
          tasksByDate[dateStr].push(task)
        }
        // For incomplete tasks with due dates (both future and overdue)
        else if (task.dueDate && task.status !== 'done' && task.status !== 'completed') {
          const dueDate = new Date(task.dueDate)
          const year = dueDate.getFullYear()
          const month = String(dueDate.getMonth() + 1).padStart(2, '0')
          const day = String(dueDate.getDate()).padStart(2, '0')
          const dateStr = `${year}-${month}-${day}`
          
          // Add all incomplete tasks with due dates (past, today, or future)
          if (!tasksByDate[dateStr]) {
            tasksByDate[dateStr] = []
          }
          tasksByDate[dateStr].push(task)
        }
      })
      
      console.log('📊 Heat map tasks by date:', Object.keys(tasksByDate).length, 'days with tasks')
      console.log('📊 Today tasks:', tasksByDate[todayStr]?.length || 0)
      
      // Build heat map data for each day (using local dates)
      const heatData: DayActivity[] = []
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        // Use same local date format as above
        const year = currentDate.getFullYear()
        const month = String(currentDate.getMonth() + 1).padStart(2, '0')
        const day = String(currentDate.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        
        heatData.push({
          date: dateStr,
          count: tasksByDate[dateStr]?.length || 0,
          tasks: tasksByDate[dateStr] || []
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      setHeatMapData(heatData)
    } catch (error) {
      console.error('Failed to load heat map data:', error)
    }
  }

  // Handle heat map cell click
  const handleHeatMapCellClick = (dayActivity: DayActivity) => {
    if (dayActivity.count > 0) {
      setSelectedDayTasks(dayActivity.tasks)
      setSelectedDayDate(dayActivity.date)
    }
  }

  // Close task list modal
  const handleCloseTaskList = () => {
    setSelectedDayTasks(null)
    setSelectedDayDate('')
  }

  useEffect(() => {
    calculateStats()
    fetchHeatMapData()
  }, [timeRange]) // eslint-disable-line react-hooks/exhaustive-deps

  const StatCard = ({ title, value, subtitle, icon, color = "blue" }: {
    title: string
    value: string | number
    subtitle?: string
    icon: string
    color?: "blue" | "green" | "red" | "yellow" | "purple"
  }) => {
    const colorClasses = {
      blue: isInitialized && isDarkMode ? "bg-white/5 border-blue-400/25 text-gray-200" : "bg-white border-gray-200 text-gray-800",
      green: isInitialized && isDarkMode ? "bg-white/5 border-green-400/25 text-gray-200" : "bg-white border-gray-200 text-gray-800",
      red: isInitialized && isDarkMode ? "bg-white/5 border-red-400/25 text-gray-200" : "bg-white border-gray-200 text-gray-800",
      yellow: isInitialized && isDarkMode ? "bg-white/5 border-yellow-400/25 text-gray-200" : "bg-white border-gray-200 text-gray-800",
      purple: isInitialized && isDarkMode ? "bg-white/5 border-purple-400/25 text-gray-200" : "bg-white border-gray-200 text-gray-800"
    }

    return (
      <div className={`p-6 rounded-xl border-2 ${colorClasses[color]} transition-all hover:scale-[1.005] backdrop-blur-[2px]`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
          </div>
          <div className="text-3xl">{icon}</div>
        </div>
      </div>
    )
  }

  const ChartBar = ({ label, value, max, color = "blue" }: {
    label: string
    value: number
    max: number
    color?: "blue" | "green" | "red" | "yellow" | "purple"
  }) => {
    const colorClasses = isInitialized && isDarkMode ? {
      blue: "bg-blue-300/60",
      green: "bg-green-300/60",
      red: "bg-red-300/60",
      yellow: "bg-yellow-300/60",
      purple: "bg-purple-300/60"
    } : {
      blue: "bg-blue-300/70",
      green: "bg-green-300/70",
      red: "bg-red-300/70",
      yellow: "bg-yellow-300/70",
      purple: "bg-purple-300/70"
    }

    const percentage = max > 0 ? (value / max) * 100 : 0

    return (
      <div className="flex items-center gap-4">
        <div className={`w-28 text-sm font-medium truncate ${
          isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`} title={label}>{label}</div>
        <div className={`flex-1 rounded-full h-4 ${
          isInitialized && isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200'
        }`}>
          <div 
            className={`h-4 rounded-full ${colorClasses[color]} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className={`w-12 text-xs font-medium text-right ${
          isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {value}
        </div>
      </div>
    )
  }

  // Get heat map color based on task count, type, and status
  const getHeatMapColor = (count: number, hasOverdue: boolean, hasCompleted: boolean, hasUpcoming: boolean): string => {
    if (count === 0) {
      return isInitialized && isDarkMode ? '#1f2937' : '#f3f4f6' // gray-800 / gray-100
    }
    
    // Priority 1: Overdue tasks (HIGHEST PRIORITY) - use red shades
    if (hasOverdue) {
      if (count <= 2) {
        return isInitialized && isDarkMode ? '#7f1d1d' : '#fecaca' // red-900 / red-200
      }
      if (count <= 5) {
        return isInitialized && isDarkMode ? '#991b1b' : '#fca5a5' // red-800 / red-300
      }
      if (count <= 10) {
        return isInitialized && isDarkMode ? '#dc2626' : '#f87171' // red-600 / red-400
      }
      return isInitialized && isDarkMode ? '#ef4444' : '#ef4444' // red-500
    }
    
    // Priority 2: Upcoming tasks (future due dates) - use blue shades
    if (hasUpcoming) {
      if (count <= 2) {
        return isInitialized && isDarkMode ? '#1e3a8a' : '#dbeafe' // blue-900 / blue-100
      }
      if (count <= 5) {
        return isInitialized && isDarkMode ? '#1e40af' : '#93c5fd' // blue-800 / blue-300
      }
      if (count <= 10) {
        return isInitialized && isDarkMode ? '#2563eb' : '#60a5fa' // blue-600 / blue-400
      }
      return isInitialized && isDarkMode ? '#3b82f6' : '#3b82f6' // blue-500
    }
    
    // Priority 3: Completed tasks (past) - use green shades
    if (hasCompleted) {
      if (count <= 2) {
        return isInitialized && isDarkMode ? '#14532d' : '#bbf7d0' // green-900 / green-200
      }
      if (count <= 5) {
        return isInitialized && isDarkMode ? '#15803d' : '#86efac' // green-700 / green-300
      }
      if (count <= 10) {
        return isInitialized && isDarkMode ? '#16a34a' : '#4ade80' // green-600 / green-400
      }
      return isInitialized && isDarkMode ? '#22c55e' : '#22c55e' // green-500
    }
    
    // Fallback gray
    return isInitialized && isDarkMode ? '#374151' : '#d1d5db' // gray-700 / gray-300
  }

  // Format date for display
  const formatHeatMapDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className={`h-full flex flex-col ${isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-6 border-b ${
        isInitialized && isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
            isInitialized && isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <svg className={`w-5 h-5 ${
              isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold ${
            isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>Statistics Dashboard</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${
            isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Time Range:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
            className={`px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors shadow-sm text-sm font-medium ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-800'
            }`}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${
        isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
                isInitialized && isDarkMode ? 'border-green-400' : 'border-green-600'
              }`}></div>
            </div>
          ) : stats ? (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Tasks"
                  value={stats.total}
                  subtitle={`${timeRange} period`}
                  icon="📊"
                  color="blue"
                />
                <StatCard
                  title="Completed"
                  value={stats.completed}
                  subtitle={`${stats.completionRate.toFixed(1)}% completion rate`}
                  icon="✅"
                  color="green"
                />
                <StatCard
                  title="In Progress"
                  value={stats.inProgress}
                  subtitle="Active tasks"
                  icon="🔄"
                  color="yellow"
                />
                <StatCard
                  title="Overdue"
                  value={stats.overdue}
                  subtitle="Past due date"
                  icon="⚠️"
                  color="red"
                />
              </div>

              {/* Task Completion Heat Map */}
              {heatMapData.length > 0 && (
                <div className={`rounded-xl p-6 border ${
                  isInitialized && isDarkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-semibold ${
                      isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      📅 Task Activity (4 Weeks Past + 1 Week Upcoming)
                    </h3>
                    <div className="flex items-center gap-4 text-xs">
                      {/* Overdue tasks legend */}
                      <div className="flex items-center gap-2">
                        <span className={isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Overdue:
                        </span>
                        {[1, 3, 6, 11].map(count => (
                          <div
                            key={count}
                            className="w-4 h-4 rounded-sm"
                            style={{ backgroundColor: getHeatMapColor(count, true, false, false) }}
                            title={`${count} overdue task${count > 1 ? 's' : ''}`}
                          />
                        ))}
                      </div>
                      {/* Upcoming tasks legend */}
                      <div className="flex items-center gap-2">
                        <span className={isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Upcoming:
                        </span>
                        {[1, 3, 6].map(count => (
                          <div
                            key={count}
                            className="w-4 h-4 rounded-sm"
                            style={{ backgroundColor: getHeatMapColor(count, false, false, true) }}
                            title={`${count} task${count > 1 ? 's' : ''} due`}
                          />
                        ))}
                      </div>
                      {/* Completed tasks legend */}
                      <div className="flex items-center gap-2">
                        <span className={isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Done:
                        </span>
                        {[1, 3, 6].map(count => (
                          <div
                            key={count}
                            className="w-4 h-4 rounded-sm"
                            style={{ backgroundColor: getHeatMapColor(count, false, true, false) }}
                            title={`${count} task${count > 1 ? 's' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Heat Map Grid with Day Labels */}
                  <div className="flex gap-4">
                    {/* Day Labels */}
                    <div className="flex flex-col gap-2 pt-8">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div
                          key={day}
                          className={`h-8 text-sm font-medium flex items-center ${
                            isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Heat Map Grid */}
                    <div className="flex-1">
                      <div className="flex gap-2 justify-between">
                        {/* Group days into weeks */}
                        {Array.from({ length: 5 }, (_, weekIndex) => {
                          const weekStart = weekIndex * 7
                          const weekData = heatMapData.slice(weekStart, weekStart + 7)
                          
                          if (weekData.length === 0) return null
                          
                          return (
                            <div key={weekIndex} className="flex flex-col gap-2 flex-1">
                              {/* Week label */}
                              <div className={`h-8 text-sm font-semibold text-center ${
                                isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {weekData[0] && new Date(weekData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                              {/* Days in week */}
                              {weekData.map((day) => {
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                                
                                // Categorize tasks
                                const hasCompleted = day.tasks.some(t => t.status === 'done' || t.status === 'completed')
                                const hasOverdue = day.tasks.some(t => {
                                  if (t.status === 'done' || t.status === 'completed') return false
                                  if (!t.dueDate) return false
                                  const dueYear = new Date(t.dueDate).getFullYear()
                                  const dueMonth = String(new Date(t.dueDate).getMonth() + 1).padStart(2, '0')
                                  const dueDay = String(new Date(t.dueDate).getDate()).padStart(2, '0')
                                  const taskDueStr = `${dueYear}-${dueMonth}-${dueDay}`
                                  return taskDueStr < todayStr // Due date is in the past
                                })
                                const hasUpcoming = day.tasks.some(t => {
                                  if (t.status === 'done' || t.status === 'completed') return false
                                  if (!t.dueDate) return false
                                  const dueYear = new Date(t.dueDate).getFullYear()
                                  const dueMonth = String(new Date(t.dueDate).getMonth() + 1).padStart(2, '0')
                                  const dueDay = String(new Date(t.dueDate).getDate()).padStart(2, '0')
                                  const taskDueStr = `${dueYear}-${dueMonth}-${dueDay}`
                                  return taskDueStr >= todayStr // Due date is today or future
                                })
                                
                                // Determine display text
                                let statusText = ''
                                if (hasOverdue) statusText = 'overdue'
                                else if (hasUpcoming) statusText = 'due'
                                else if (hasCompleted) statusText = 'completed'
                                
                                return (
                                  <button
                                    key={day.date}
                                    onClick={() => handleHeatMapCellClick(day)}
                                    className={`w-full h-8 rounded-md transition-all duration-200 ${
                                      day.count > 0 ? 'hover:ring-2 hover:ring-yellow-400 hover:scale-105 cursor-pointer' : 'cursor-default'
                                    }`}
                                    style={{ backgroundColor: getHeatMapColor(day.count, hasOverdue, hasCompleted, hasUpcoming) }}
                                    title={`${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${day.count} task${day.count !== 1 ? 's' : ''} ${statusText}`}
                                  />
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <p className={`text-xs mt-4 ${
                    isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    💡 <span className="font-semibold text-red-600">Red</span> = Overdue tasks (priority!) • 
                    <span className="font-semibold text-blue-600 ml-1">Blue</span> = Upcoming tasks • 
                    <span className="font-semibold text-green-600 ml-1">Green</span> = Completed • 
                    Click any cell to view tasks
                  </p>
                </div>
              )}

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Distribution */}
                <div className={`rounded-xl p-6 border ${isInitialized && isDarkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Status Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.byStatus).map(([status, count]) => (
                      <ChartBar
                        key={status}
                        label={status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                        value={count}
                        max={stats.total}
                        color="blue"
                      />
                    ))}
                  </div>
                </div>

                {/* Priority Distribution */}
                <div className={`rounded-xl p-6 border ${isInitialized && isDarkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Priority Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.byPriority).map(([priority, count]) => (
                      <ChartBar
                        key={priority}
                        label={priority.charAt(0).toUpperCase() + priority.slice(1)}
                        value={count}
                        max={stats.total}
                        color={priority === 'urgent' ? 'red' : priority === 'high' ? 'yellow' : 'green'}
                      />
                    ))}
                  </div>
                </div>

                {/* Type Distribution */}
                <div className={`rounded-xl p-6 border ${isInitialized && isDarkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Work Type Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <ChartBar
                        key={type}
                        label={type.charAt(0).toUpperCase() + type.slice(1)}
                        value={count}
                        max={stats.total}
                        color="purple"
                      />
                    ))}
                  </div>
                </div>

                {/* Category Distribution */}
                <div className={`rounded-xl p-6 border ${isInitialized && isDarkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Category Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.byCategory).slice(0, 5).map(([category, count]) => (
                      <ChartBar
                        key={category}
                        label={category.charAt(0).toUpperCase() + category.slice(1)}
                        value={count}
                        max={stats.total}
                        color="green"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`rounded-xl p-6 border-2 ${
                  isInitialized && isDarkMode 
                    ? 'bg-gradient-to-r from-blue-900/40 to-blue-800/40 border-blue-700' 
                    : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    isInitialized && isDarkMode ? 'text-blue-200' : 'text-blue-900'
                  }`}>Performance Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className={isInitialized && isDarkMode ? 'text-blue-300' : 'text-blue-800'}>Completion Rate</span>
                      <span className={`text-2xl font-bold ${isInitialized && isDarkMode ? 'text-blue-200' : 'text-blue-900'}`}>{stats.completionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isInitialized && isDarkMode ? 'text-blue-300' : 'text-blue-800'}>Avg. Completion Time</span>
                      <span className={`text-2xl font-bold ${isInitialized && isDarkMode ? 'text-blue-200' : 'text-blue-900'}`}>{stats.averageCompletionTime.toFixed(1)} days</span>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl p-6 border-2 ${
                  isInitialized && isDarkMode 
                    ? 'bg-gradient-to-r from-green-900/40 to-green-800/40 border-green-700' 
                    : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    isInitialized && isDarkMode ? 'text-green-200' : 'text-green-900'
                  }`}>Time Frame Analysis</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.byTimeFrame).map(([timeFrame, count]) => (
                      <div key={timeFrame} className="flex justify-between items-center">
                        <span className={`capitalize ${isInitialized && isDarkMode ? 'text-green-300' : 'text-green-800'}`}>{timeFrame.replace('-', ' ')}</span>
                        <span className={`font-semibold ${isInitialized && isDarkMode ? 'text-green-200' : 'text-green-900'}`}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No data available</div>
            </div>
          )}
        </div>
      </div>

      {/* Task List Modal for Selected Day */}
      {selectedDayTasks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-xl w-full max-h-[85vh] overflow-hidden rounded-xl shadow-2xl ${
            isInitialized && isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`p-6 border-b ${
              isInitialized && isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  {(() => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                    
                    const hasCompleted = selectedDayTasks.some(t => t.status === 'done' || t.status === 'completed')
                    const hasOverdue = selectedDayTasks.some(t => {
                      if (t.status === 'done' || t.status === 'completed') return false
                      if (!t.dueDate) return false
                      const dueYear = new Date(t.dueDate).getFullYear()
                      const dueMonth = String(new Date(t.dueDate).getMonth() + 1).padStart(2, '0')
                      const dueDay = String(new Date(t.dueDate).getDate()).padStart(2, '0')
                      const taskDueStr = `${dueYear}-${dueMonth}-${dueDay}`
                      return taskDueStr < todayStr
                    })
                    const hasUpcoming = selectedDayTasks.some(t => {
                      if (t.status === 'done' || t.status === 'completed') return false
                      if (!t.dueDate) return false
                      const dueYear = new Date(t.dueDate).getFullYear()
                      const dueMonth = String(new Date(t.dueDate).getMonth() + 1).padStart(2, '0')
                      const dueDay = String(new Date(t.dueDate).getDate()).padStart(2, '0')
                      const taskDueStr = `${dueYear}-${dueMonth}-${dueDay}`
                      return taskDueStr >= todayStr
                    })
                    
                    // Determine title and icon
                    let title = '📋 Tasks'
                    if (hasOverdue) {
                      title = '⚠️ Overdue Tasks'
                    } else if (hasUpcoming) {
                      title = '📅 Upcoming Tasks'
                    } else if (hasCompleted) {
                      title = '✅ Completed Tasks'
                    }
                    
                    return (
                      <>
                        <h3 className={`text-xl font-bold ${
                          isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {title}
                        </h3>
                        <p className={`text-sm mt-1 ${
                          isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {formatHeatMapDate(selectedDayDate)} • {selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? 's' : ''}
                        </p>
                      </>
                    )
                  })()}
                </div>
                <button
                  onClick={handleCloseTaskList}
                  className={`p-2 rounded-lg transition-colors ${
                    isInitialized && isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Task List */}
            <div className={`p-6 overflow-y-auto max-h-[60vh] ${
              isInitialized && isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="space-y-3">
                {selectedDayTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                      isInitialized && isDarkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-lg ${
                            isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {index + 1}.
                          </span>
                          <h4 className={`font-semibold flex-1 ${
                            isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 ml-7">
                          {(() => {
                            const isOverdue = task.dueDate && 
                              task.status !== 'done' && 
                              task.status !== 'completed' &&
                              new Date(task.dueDate) < new Date()
                            
                            return (
                              <>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  task.status === 'done' || task.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : task.status === 'in-progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {task.status === 'done' || task.status === 'completed' ? '✓ Done' : task.status}
                                </span>
                                {isOverdue && (
                                  <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-800">
                                    ⚠️ Overdue
                                  </span>
                                )}
                              </>
                            )
                          })()}
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            task.priority === 'urgent' 
                              ? 'bg-red-100 text-red-800' 
                              : task.priority === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : task.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            {task.type}
                          </span>
                          {task.category && (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                              {task.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`text-xs ml-4 ${
                        isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {task.completedAt 
                          ? `✅ ${new Date(task.completedAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}`
                          : task.dueDate
                          ? `📅 Due ${new Date(task.dueDate).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}`
                          : '—'
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t ${
              isInitialized && isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
            }`}>
              <button
                onClick={handleCloseTaskList}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  isInitialized && isDarkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
