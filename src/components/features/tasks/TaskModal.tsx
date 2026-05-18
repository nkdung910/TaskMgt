"use client"

import { useState, useEffect } from "react"
import { createTask, updateTaskField } from "@/lib/tasks"
import Calendar from "@/components/Calendar"
import { showToast } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"
import { formatDateDDMMYYYY } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  type: string
  timeFrame: string
  category: string
  assignee: string | null
  dueDate: Date | null
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "create" | "edit" | "view"
  task?: Task
  onTaskSaved?: () => void
  availablePriorities?: string[]
  availableTypes?: string[]
  availableTimeFrames?: string[]
  availableCategories?: string[]
  availableAssignees?: string[]
}

export default function TaskModal({ 
  isOpen, 
  onClose, 
  mode, 
  task, 
  onTaskSaved,
  availablePriorities = ["urgent", "high", "medium", "low"],
  availableTypes = ["design", "development", "document", "testing"],
  availableTimeFrames = ["today", "this-week", "next-week", "later"],
  availableCategories = ["general", "work", "personal", "shopping", "health", "finance"],
  availableAssignees = ["unassigned", "me"]
}: TaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState("medium")
  const [type, setType] = useState("development")
  const [timeFrame, setTimeFrame] = useState("this-week")
  const [category, setCategory] = useState("general")
  const [assignee, setAssignee] = useState("")
  const [tags, setTags] = useState("")
  const [loading, setLoading] = useState(false)
  const { isDarkMode, isInitialized } = useTheme()

  // Helper function for form element styling
  const getFormElementStyles = (baseClasses: string) => {
    if (isInitialized && isDarkMode) {
      return baseClasses
        .replace('border-gray-200', 'border-gray-600')
        .replace('text-gray-900', 'text-gray-100')
        .replace('placeholder-gray-500', 'placeholder-gray-400')
        .replace('disabled:bg-gray-50', 'disabled:bg-gray-700')
        .replace('disabled:text-gray-500', 'disabled:text-gray-400')
        .replace('bg-white', 'bg-gray-700')
    }
    return baseClasses
  }

  // Helper function for select dropdown styling
  const getSelectStyles = () => {
    const baseStyles = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 text-sm"
    
    if (isInitialized && isDarkMode) {
      return baseStyles
        .replace('border-gray-200', 'border-gray-600')
        .replace('text-gray-900', 'text-gray-100')
        .replace('disabled:bg-gray-50', 'disabled:bg-gray-700')
        .replace('disabled:text-gray-500', 'disabled:text-gray-400')
        .replace('bg-white', 'bg-gray-700')
    }
    return baseStyles
  }

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "create") {
        setTitle("")
        setDescription("")
        setDueDate("")
        setPriority("medium")
        setType("development")
        setTimeFrame("this-week")
        setCategory("general")
        setAssignee("")
        setTags("")
      } else if (task) {
        setTitle(task.title || "")
        setDescription(task.description || "")
        setDueDate(task.dueDate ? (() => {
          // Handle Date object properly
          const date = new Date(task.dueDate)
          return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
        })() : "")
        setPriority(task.priority || "medium")
        setType(task.type || "development")
        setTimeFrame(task.timeFrame || "this-week")
        setCategory(task.category || "general")
        setAssignee(task.assignee || "")
        setTags(task.tags ? task.tags.join(", ") : "")
      }
    }
  }, [isOpen, mode, task])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === "view") return
    
    // Prevent multiple submissions
    if (loading) return
    
    setLoading(true)

    try {
      const tagsArray = tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
      
      if (mode === "create") {
        const result = await createTask({
          title,
          description: description || undefined,
          priority,
          type,
          timeFrame,
          category,
          assignee,
          dueDate: dueDate || null,
          tags: tagsArray
        })

        if (result?.error) {
          showToast.error(result.error)
        } else {
          showToast.success("Task created successfully!")
          // Close modal immediately and refresh data
          onClose()
          onTaskSaved?.()
        }
      } else if (mode === "edit" && task) {
        // Update task - we'll need to create an update function for all fields
        const updates = {
          title,
          description: description || undefined,
          priority,
          type,
          timeFrame,
          category,
          assignee,
          dueDate: dueDate || null,
          tags: tagsArray
        }

        // For now, we'll update fields one by one (can be optimized later)
        for (const [field, value] of Object.entries(updates)) {
          if (field === "tags") {
            // Handle tags separately since it's an array
            if (JSON.stringify(value) !== JSON.stringify(task.tags)) {
              await updateTaskField(task.id, field, value as string[])
            }
          } else if (field === "dueDate") {
            // Handle dueDate comparison properly
            const currentDueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null
            const newDueDate = value ? new Date(value as string).toISOString().split('T')[0] : null
            if (currentDueDate !== newDueDate) {
              await updateTaskField(task.id, field, value as string)
            }
          } else if (value !== task[field as keyof Task]) {
            await updateTaskField(task.id, field, value as string)
          }
        }

        showToast.success("Task updated successfully!")
        // Close modal immediately and refresh data
        onClose()
        onTaskSaved?.()
      }
    } catch {
      showToast.error(`Failed to ${mode === "create" ? "create" : "update"} task`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Dark theme styles for dropdown options */}
      <style jsx>{`
        select option {
          background-color: ${isInitialized && isDarkMode ? '#374151' : '#ffffff'};
          color: ${isInitialized && isDarkMode ? '#f3f4f6' : '#111827'};
        }
        select option:hover {
          background-color: ${isInitialized && isDarkMode ? '#4b5563' : '#f9fafb'};
        }
        select option:checked {
          background-color: ${isInitialized && isDarkMode ? '#1d4ed8' : '#3b82f6'};
          color: white;
        }
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-xl w-full max-w-xl max-h-[85vh] overflow-hidden ${
        isInitialized && isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isInitialized && isDarkMode ? 'border-gray-600' : 'border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-2 ${
              isInitialized && isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              {mode === "create" && (
                <svg className={`w-4 h-4 ${
                  isInitialized && isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
              {mode === "edit" && (
                <svg className={`w-4 h-4 ${
                  isInitialized && isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
              {mode === "view" && (
                <svg className={`w-4 h-4 ${
                  isInitialized && isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </div>
            <h2 className={`text-xl font-bold ${
              isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {mode === "create" && "Create New Task"}
              {mode === "edit" && "Edit Task"}
              {mode === "view" && "Task Details"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isInitialized && isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className={`w-6 h-6 ${
              isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className={`block text-xs font-semibold mb-1 ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={mode === "view"}
                required
                maxLength={100}
                className={getFormElementStyles("w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 disabled:bg-gray-50 disabled:text-gray-500 text-sm")}
                style={{
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="What needs to be done? (max 100 characters)"
              />
              <div className="flex justify-end mt-1">
                <p className={`text-xs ${isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {title.length}/100
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className={`block text-xs font-semibold mb-1 ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={mode === "view"}
                rows={2}
                maxLength={500}
                className={getFormElementStyles("w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none disabled:bg-gray-50 disabled:text-gray-500 text-sm")}
                style={{
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Add more details about this task... (max 500 characters)"
              />
              <div className="flex justify-end mt-1">
                <p className={`text-xs ${isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {description.length}/500
                </p>
              </div>
            </div>

            {/* Row 1: Due Date and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="dueDate" className={`block text-xs font-semibold mb-1 ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Due Date
                </label>
                <Calendar
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="Select due date"
                  disabled={mode === "view"}
                  calendarOnly={true}
                  compact={true}
                  height="h-10"
                />
              </div>

              <div>
                <label htmlFor="priority" className={`block text-xs font-semibold mb-1 ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={mode === "view"}
                  className={getSelectStyles()}
                  style={{
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    boxSizing: 'border-box',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1em',
                    paddingRight: '2.5rem',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  {availablePriorities.map(priorityValue => {
                    const icons: Record<string, string> = {
                      'urgent': '🚨',
                      'high': '🔴',
                      'medium': '🟡',
                      'low': '🟢'
                    }
                    const labels: Record<string, string> = {
                      'urgent': 'Urgent',
                      'high': 'High',
                      'medium': 'Medium',
                      'low': 'Low'
                    }
                    return (
                      <option key={priorityValue} value={priorityValue}>
                        {icons[priorityValue] || '⚡'} {labels[priorityValue] || priorityValue.charAt(0).toUpperCase() + priorityValue.slice(1)}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* Row 2: Type and Time Frame */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="type" className={`block text-xs font-semibold mb-1 ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={mode === "view"}
                  className={getSelectStyles()}
                  style={{
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    boxSizing: 'border-box',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1em',
                    paddingRight: '2.5rem',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  {availableTypes.map(typeValue => {
                    const icons: Record<string, string> = {
                      'design': '🎨',
                      'development': '💻',
                      'document': '📄',
                      'testing': '🧪'
                    }
                    const labels: Record<string, string> = {
                      'design': 'Design',
                      'development': 'Development',
                      'document': 'Document',
                      'testing': 'Testing'
                    }
                    return (
                      <option key={typeValue} value={typeValue}>
                        {icons[typeValue] || '🎯'} {labels[typeValue] || typeValue.charAt(0).toUpperCase() + typeValue.slice(1)}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label htmlFor="timeFrame" className={`block text-xs font-semibold mb-1 ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Time Frame
                </label>
                <select
                  id="timeFrame"
                  value={timeFrame}
                  onChange={(e) => setTimeFrame(e.target.value)}
                  disabled={mode === "view"}
                  className={getSelectStyles()}
                  style={{
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    boxSizing: 'border-box',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1em',
                    paddingRight: '2.5rem',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  {availableTimeFrames.map(timeFrameValue => {
                    const icons: Record<string, string> = {
                      'today': '🔥',
                      'this-week': '📅',
                      'next-week': '📆',
                      'later': '⏰'
                    }
                    const labels: Record<string, string> = {
                      'today': 'Today',
                      'this-week': 'This Week',
                      'next-week': 'Next Week',
                      'later': 'Later'
                    }
                    return (
                      <option key={timeFrameValue} value={timeFrameValue}>
                        {icons[timeFrameValue] || '⏰'} {labels[timeFrameValue] || timeFrameValue.charAt(0).toUpperCase() + timeFrameValue.slice(1)}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* Row 3: Category and Assignee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="category" className={`block text-xs font-semibold mb-1 ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={mode === "view"}
                  className={getSelectStyles()}
                  style={{
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    boxSizing: 'border-box',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1em',
                    paddingRight: '2.5rem',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  {availableCategories.map(categoryValue => {
                    const icons: Record<string, string> = {
                      'general': '📝',
                      'work': '💼',
                      'personal': '👤',
                      'shopping': '🛒',
                      'health': '🏥',
                      'finance': '💰',
                      'travel': '✈️',
                      'home': '🏠',
                      'education': '📚',
                      'entertainment': '🎬',
                      'family': '👨‍👩‍👧‍👦',
                      'fitness': '💪'
                    }
                    const labels: Record<string, string> = {
                      'general': 'General',
                      'work': 'Work',
                      'personal': 'Personal',
                      'shopping': 'Shopping',
                      'health': 'Health',
                      'finance': 'Finance',
                      'travel': 'Travel',
                      'home': 'Home',
                      'education': 'Education',
                      'entertainment': 'Entertainment',
                      'family': 'Family',
                      'fitness': 'Fitness'
                    }
                    return (
                      <option key={categoryValue} value={categoryValue}>
                        {icons[categoryValue] || '🏷️'} {labels[categoryValue] || categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1)}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label htmlFor="assignee" className={`block text-xs font-semibold mb-1 ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Assignee
                </label>
                <select
                  id="assignee"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  disabled={mode === "view"}
                  className={getSelectStyles()}
                  style={{
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    boxSizing: 'border-box',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1em',
                    paddingRight: '2.5rem',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  {availableAssignees.map((assigneeOption) => {
                    const icon = assigneeOption === "admin" ? "👑" :
                                 assigneeOption === "developer" ? "👨‍💻" :
                                 assigneeOption === "designer" ? "👨‍🎨" :
                                 assigneeOption === "manager" ? "👔" :
                                 assigneeOption === "tester" ? "🧪" :
                                 assigneeOption === "analyst" ? "📊" :
                                 assigneeOption === "unassigned" ? "⚪" :
                                 assigneeOption === "me" ? "👤" : "👤"
                    const label = assigneeOption.charAt(0).toUpperCase() + assigneeOption.slice(1)
                    return (
                      <option key={assigneeOption} value={assigneeOption}>
                        {icon} {label}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* Row 4: Tags */}
            <div>
              <label htmlFor="tags" className={`block text-xs font-semibold mb-1 ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Tags
                </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={mode === "view"}
                maxLength={30}
                className={getFormElementStyles("w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 disabled:bg-gray-50 disabled:text-gray-500 text-sm")}
                style={{
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter tags separated by commas... (max 30 characters)"
              />
              <div className="flex justify-end mt-1">
                <p className={`text-xs ${isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {tags.length}/30
                </p>
              </div>
              </div>

            {/* Task Info (View Mode Only) */}
            {mode === "view" && task && (
              <div className={`rounded-xl p-4 space-y-3 ${isInitialized && isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Task Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`${isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {task.status === "todo" ? "📋 To Do" : 
                       task.status === "in-progress" ? "🔄 In Progress" :
                       task.status === "review" ? "👀 Review" :
                       task.status === "testing" ? "🧪 Testing" :
                       "✅ Done"}
                    </span>
                  </div>
                  <div>
                    <span className={`${isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created:</span>
                    <span className={`ml-2 ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {task.createdAt ? formatDateDDMMYYYY(task.createdAt) : "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className={`${isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Updated:</span>
                    <span className={`ml-2 ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {task.updatedAt ? formatDateDDMMYYYY(task.updatedAt) : "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className={`${isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>ID:</span>
                    <span className={`ml-2 font-mono text-xs ${isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {task.id ? task.id.slice(-8) : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            )}


            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 border rounded-lg transition-colors font-medium text-sm ${
                  isInitialized && isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {mode === "view" ? "Close" : "Cancel"}
              </button>
              {mode !== "view" && (
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm ${
                    isInitialized && isDarkMode 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                  }`}
                >
                  {loading && (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {loading 
                    ? (mode === "create" ? "Creating..." : "Updating...") 
                    : (mode === "create" ? "Create Task" : "Update Task")
                  }
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}
