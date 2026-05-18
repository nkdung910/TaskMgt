"use client"

import { useState, useEffect } from "react"
import Calendar from "@/components/Calendar"
import { useTheme } from "@/contexts/ThemeContext"

interface TaskFilterProps {
  onFilterChange: (filters: {
    search?: string
    status?: string
    priority?: string
    tags?: string[]
    assignee?: string
    type?: string
    category?: string
    timeFrame?: string
    dueDateFrom?: string
    dueDateTo?: string
  }) => void
  availableTags?: string[]
  availableStatuses?: string[]
  availablePriorities?: string[]
  availableTypes?: string[]
  availableTimeFrames?: string[]
  availableCategories?: string[]
  availableAssignees?: string[]
  compact?: boolean
}

export default function TaskFilter({ 
  onFilterChange, 
  availableTags = [], 
  availableStatuses = [], 
  availablePriorities = [],
  availableTypes = [],
  availableTimeFrames = [],
  availableCategories = [],
  availableAssignees = [],
  compact = false 
}: TaskFilterProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [priority, setPriority] = useState("")
  const [assignee, setAssignee] = useState("")
  const [type, setType] = useState("")
  const [category, setCategory] = useState("")
  const [timeFrame, setTimeFrame] = useState("")
  const [dueDateFrom, setDueDateFrom] = useState("")
  const [dueDateTo, setDueDateTo] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const { isDarkMode, isInitialized } = useTheme()
  
  // Helper function to truncate text for options
  const truncateText = (text: string, maxLength: number = 20): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }
  
  // Get status display info
  const getStatusDisplay = (statusValue: string) => {
    const statusMap: Record<string, { icon: string; label: string }> = {
      "todo": { icon: "📋", label: "To Do" },
      "in-progress": { icon: "🔄", label: "In Progress" },
      "review": { icon: "👀", label: "Review" },
      "testing": { icon: "🧪", label: "Testing" },
      "done": { icon: "✅", label: "Done" },
      "lane-review": { icon: "👀", label: "Lane Review" }
    }
    
    return statusMap[statusValue] || { icon: "📋", label: statusValue.charAt(0).toUpperCase() + statusValue.slice(1) }
  }

  // Group tags by category based on prefix
  const groupedTags = availableTags.reduce((acc, tag) => {
    const prefix = tag.charAt(0)
    const category = getTagCategory(prefix)
    if (!acc[category]) acc[category] = []
    acc[category].push(tag)
    return acc
  }, {} as Record<string, string[]>)

  function getTagCategory(prefix: string): string {
    switch (prefix) {
      case "@": return "Context"
      case "#": return "Type"
      case "$": return "Project"
      case "⚡": return "Energy"
      case "⏱": return "Duration"
      case "👤": return "Person"
      default: return "Other"
    }
  }

  function getTagColor(category: string): string {
    if (isInitialized && isDarkMode) {
      switch (category) {
        case "Context": return "bg-blue-900/30 text-blue-300 border-blue-700"
        case "Type": return "bg-green-900/30 text-green-300 border-green-700"
        case "Project": return "bg-purple-900/30 text-purple-300 border-purple-700"
        case "Energy": return "bg-orange-900/30 text-orange-300 border-orange-700"
        case "Duration": return "bg-teal-900/30 text-teal-300 border-teal-700"
        case "Person": return "bg-pink-900/30 text-pink-300 border-pink-700"
        default: return "bg-gray-800/30 text-gray-300 border-gray-600"
      }
    } else {
      switch (category) {
        case "Context": return "bg-blue-200 text-blue-900 border-blue-300"
        case "Type": return "bg-green-200 text-green-900 border-green-300"
        case "Project": return "bg-purple-200 text-purple-900 border-purple-300"
        case "Energy": return "bg-orange-200 text-orange-900 border-orange-300"
        case "Duration": return "bg-teal-200 text-teal-900 border-teal-300"
        case "Person": return "bg-pink-200 text-pink-900 border-pink-300"
        default: return "bg-gray-200 text-gray-900 border-gray-300"
      }
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSearch("")
    setStatus("")
    setPriority("")
    setAssignee("")
    setType("")
    setCategory("")
    setTimeFrame("")
    setDueDateFrom("")
    setDueDateTo("")
    setSelectedTags([])
  }

  // Update filters when any filter changes
  useEffect(() => {
    const filters: Record<string, unknown> = {}
    if (search) filters.search = search
    if (status) filters.status = status
    if (priority) filters.priority = priority
    if (assignee) filters.assignee = assignee
    if (type) filters.type = type
    if (category) filters.category = category
    if (timeFrame) filters.timeFrame = timeFrame
    if (dueDateFrom) filters.dueDateFrom = dueDateFrom
    if (dueDateTo) filters.dueDateTo = dueDateTo
    if (selectedTags.length > 0) filters.tags = selectedTags

    onFilterChange(filters)
  }, [search, status, priority, assignee, type, category, timeFrame, dueDateFrom, dueDateTo, selectedTags, onFilterChange])

  const hasActiveFilters = search || status || priority || assignee || type || category || timeFrame || dueDateFrom || dueDateTo || selectedTags.length > 0

  return (
    <div className={`rounded-lg shadow-sm border ${compact ? "p-1" : "p-2"} ${
      isInitialized && isDarkMode 
        ? 'bg-gray-800 border-gray-600' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-semibold flex items-center ${
          isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>
          <svg className={`w-4 h-4 mr-1 ${
            isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className={`ml-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
              isInitialized && isDarkMode 
                ? 'bg-blue-900/30 text-blue-300 border-blue-700' 
                : 'bg-blue-200 text-blue-900 border-blue-300'
            }`}>
              {[search, status, priority, assignee, type, category, timeFrame, dueDateFrom, dueDateTo, ...selectedTags].filter(Boolean).length}
            </span>
          )}
        </h3>
        <div className="flex items-center space-x-1">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`text-xs transition-colors font-medium ${
                isInitialized && isDarkMode 
                  ? 'text-gray-400 hover:text-gray-200' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-0.5 transition-colors ${
              isInitialized && isDarkMode 
                ? 'text-gray-400 hover:text-gray-200' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <svg 
              className={`w-3 h-3 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="mb-2">
        <div className="relative">
          <svg className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 ${
            isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-400'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-7 pr-3 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors h-10 font-medium ${
              isInitialized && isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className={compact ? "space-y-2" : "space-y-3"}>
          {/* Row 1: Status, Priority, Assignee, Type */}
          <div className={`grid ${compact ? "grid-cols-4 gap-1" : "grid-cols-2 md:grid-cols-4 gap-2"}`}>
            <div>
              <label className={`block text-xs font-semibold ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'} ${compact ? "mb-0.5" : "mb-1"}`}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full px-3 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 font-medium ${
              isInitialized && isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
              >
                <option value="">All Status</option>
                {availableStatuses.map((statusValue) => {
                  const { icon, label } = getStatusDisplay(statusValue)
                  return (
                    <option key={statusValue} value={statusValue}>
                      {icon} {label}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-semibold ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'} ${compact ? "mb-0.5" : "mb-1"}`}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={`w-full px-3 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 font-medium ${
              isInitialized && isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
              >
                <option value="">All Priority</option>
                {availablePriorities.map((priorityValue) => {
                  const priorityIcons: Record<string, string> = {
                    "urgent": "🚨",
                    "high": "🔴",
                    "medium": "🟡",
                    "low": "🟢"
                  }
                  const icon = priorityIcons[priorityValue] || "⚪"
                  const label = priorityValue.charAt(0).toUpperCase() + priorityValue.slice(1)
                  return (
                    <option key={priorityValue} value={priorityValue}>
                      {icon} {label}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-semibold ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'} ${compact ? "mb-0.5" : "mb-1"}`}>Assignee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className={`w-full px-3 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 font-medium ${
              isInitialized && isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
              >
                <option value="">All Assignees</option>
                {availableAssignees.map((assigneeValue) => {
                  const assigneeIcons: Record<string, string> = {
                    "unassigned": "❓",
                    "me": "👤",
                    "team": "👥",
                    "admin": "👑",
                    "developer": "👨‍💻",
                    "designer": "👨‍🎨",
                    "manager": "👔",
                    "tester": "🧪",
                    "analyst": "📊"
                  }
                  const icon = assigneeIcons[assigneeValue] || "👤"
                  const label = assigneeValue === "unassigned" ? "Unassigned" : 
                               assigneeValue.charAt(0).toUpperCase() + assigneeValue.slice(1)
                  return (
                    <option key={assigneeValue} value={assigneeValue} title={label}>
                      {icon} {truncateText(label)}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-semibold ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'} ${compact ? "mb-0.5" : "mb-1"}`}>Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`w-full px-3 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 font-medium ${
              isInitialized && isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
              >
                <option value="">All Types</option>
                {availableTypes.map((typeValue) => {
                  const typeIcons: Record<string, string> = {
                    "design": "🎨",
                    "development": "💻",
                    "document": "📄",
                    "documentation": "📝",
                    "testing": "🧪",
                    "meeting": "🤝",
                    "research": "🔍",
                    "planning": "📋",
                    "review": "👀",
                    "bug": "🐛",
                    "feature": "✨"
                  }
                  const icon = typeIcons[typeValue] || "📋"
                  const label = typeValue.charAt(0).toUpperCase() + typeValue.slice(1)
                  return (
                    <option key={typeValue} value={typeValue} title={label}>
                      {icon} {truncateText(label)}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Row 2: Category, Time Frame, Due Date From, Due Date To */}
          <div className={`grid ${compact ? "grid-cols-4 gap-1" : "grid-cols-2 md:grid-cols-4 gap-2"}`}>
            <div>
              <label className={`block text-xs font-semibold ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'} ${compact ? "mb-0.5" : "mb-1"}`}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-3 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 font-medium ${
              isInitialized && isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
              >
                <option value="">All Categories</option>
                {availableCategories.map((categoryValue) => {
                  const categoryIcons: Record<string, string> = {
                    "general": "📋",
                    "work": "💼",
                    "personal": "👤",
                    "shopping": "🛒",
                    "health": "🏥",
                    "finance": "💰",
                    "travel": "✈️",
                    "home": "🏠",
                    "education": "📚",
                    "entertainment": "🎬",
                    "family": "👨‍👩‍👧‍👦",
                    "fitness": "💪",
                    "bug": "🐛",
                    "feature": "✨",
                    "maintenance": "🔧",
                    "research": "🔍"
                  }
                  const icon = categoryIcons[categoryValue] || "📁"
                  const label = categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1)
                  return (
                    <option key={categoryValue} value={categoryValue} title={label}>
                      {icon} {truncateText(label)}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-semibold ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'} ${compact ? "mb-0.5" : "mb-1"}`}>Time Frame</label>
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
                className={`w-full px-3 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 font-medium ${
              isInitialized && isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
              >
                <option value="">All Time Frames</option>
                {availableTimeFrames.map((timeFrameValue) => {
                  const timeFrameIcons: Record<string, string> = {
                    "today": "⏰",
                    "this-week": "📅",
                    "this-month": "📆",
                    "next-week": "⏭️",
                    "next-month": "📅",
                    "later": "⏰"
                  }
                  const icon = timeFrameIcons[timeFrameValue] || "⏰"
                  const label = timeFrameValue === "this-week" ? "This Week" :
                               timeFrameValue === "next-week" ? "Next Week" :
                               timeFrameValue === "this-month" ? "This Month" :
                               timeFrameValue === "next-month" ? "Next Month" :
                               timeFrameValue.charAt(0).toUpperCase() + timeFrameValue.slice(1)
                  return (
                    <option key={timeFrameValue} value={timeFrameValue} title={label}>
                      {icon} {truncateText(label)}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-semibold ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'} ${compact ? "mb-0.5" : "mb-1"}`}>Due Date From</label>
              <Calendar
                value={dueDateFrom}
                onChange={setDueDateFrom}
                placeholder="From date"
                calendarOnly={true}
                compact={true}
                height="h-10"
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'} ${compact ? "mb-0.5" : "mb-1"}`}>Due Date To</label>
              <Calendar
                value={dueDateTo}
                onChange={setDueDateTo}
                placeholder="To date"
                calendarOnly={true}
                compact={true}
                height="h-10"
              />
            </div>
          </div>

          {/* Tag Filters */}
          {Object.keys(groupedTags).length > 0 && (
            <div>
              <label className={`block text-xs font-semibold mb-1 ${
                isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>Tags</label>
              <div className="space-y-1">
                {Object.entries(groupedTags).map(([category, tags]) => (
                  <div key={category}>
                    <h4 className={`text-xs font-semibold mb-1 ${
                      isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{category}</h4>
                    <div className="flex flex-wrap gap-1">
                      {tags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          title={tag} // Show full tag text on hover
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors max-w-20 truncate block overflow-hidden text-ellipsis whitespace-nowrap ${
                            selectedTags.includes(tag)
                              ? getTagColor(category) + ' ring-1 ring-blue-500'
                              : getTagColor(category) + ' hover:opacity-80'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Tags Summary */}
          {selectedTags.length > 0 && (
            <div className={`pt-1 border-t ${
              isInitialized && isDarkMode ? 'border-gray-600' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${
                  isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>Active:</span>
                <span className={`text-xs ${
                  isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>{selectedTags.length} tags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                      isInitialized && isDarkMode 
                        ? 'bg-blue-900/30 text-blue-300 border-blue-700' 
                        : 'bg-blue-200 text-blue-900 border-blue-300'
                    }`}
                  >
                    {tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      className={`ml-0.5 ${
                        isInitialized && isDarkMode 
                          ? 'text-blue-300 hover:text-blue-100' 
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
    </div>
  )
}
