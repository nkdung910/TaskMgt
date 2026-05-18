"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { getTasks, updateTaskField, deleteTask, getAvailableValues } from "@/lib/tasks"
import { getLanesForType, getGroupingField, type LaneConfig } from "@/lib/tasks/lane-config"
import { LaneType } from "@/components/layout/LaneSwitcher"
import TaskModal from "@/components/features/tasks/TaskModal"
import ConfirmationDialog from "@/components/ui/ConfirmationDialog"
import { showToast } from "@/lib/utils"
import { getDateInfo, getDateClasses } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  type: string
  timeFrame: string
  category: string
  assignee: string
  dueDate: Date | null
  tags: string[]
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
}

interface DragDropKanbanProps {
  refreshTrigger?: number
  laneType?: LaneType
  filters?: {
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
  }
  onTaskCreated?: () => void
  onTagClick?: (tag: string) => void
  onAssigneeClick?: (assignee: string) => void
  onTypeClick?: (type: string) => void
  onCategoryClick?: (category: string) => void
  onLoadingChange?: (loading: boolean) => void
  onTaskStatusChange?: (taskId: string, oldStatus: string, newStatus: string) => void
}

function TaskCard({ task, onEdit, onView, onDelete, onTagClick, onAssigneeClick, onTypeClick, onCategoryClick, filters }: { 
  task: Task, 
  onEdit?: (task: Task) => void, 
  onView?: (task: Task) => void, 
  onDelete?: (task: Task) => void,
  onTagClick?: (tag: string) => void,
  onAssigneeClick?: (assignee: string) => void,
  onTypeClick?: (type: string) => void,
  onCategoryClick?: (category: string) => void,
  filters?: {
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
  }
}) {
  const { isDarkMode, isInitialized } = useTheme()
  const [loadingStates, setLoadingStates] = useState<{
    tag?: string
    type?: string
    assignee?: string
    category?: string
  }>({})

  const handleTagClick = async (tag: string) => {
    if (loadingStates.tag) return // Prevent multiple clicks
    setLoadingStates(prev => ({ ...prev, tag }))
    try {
      if (onTagClick) {
        await onTagClick(tag)
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, tag: undefined }))
    }
  }

  const handleTypeClick = async (type: string) => {
    if (loadingStates.type) return // Prevent multiple clicks
    setLoadingStates(prev => ({ ...prev, type }))
    try {
      if (onTypeClick) {
        await onTypeClick(type)
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, type: undefined }))
    }
  }

  const handleAssigneeClick = async (assignee: string) => {
    if (loadingStates.assignee) return // Prevent multiple clicks
    setLoadingStates(prev => ({ ...prev, assignee }))
    try {
      if (onAssigneeClick) {
        await onAssigneeClick(assignee)
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, assignee: undefined }))
    }
  }

  const handleCategoryClick = async (category: string) => {
    if (loadingStates.category) return // Prevent multiple clicks
    setLoadingStates(prev => ({ ...prev, category }))
    try {
      if (onCategoryClick) {
        await onCategoryClick(category)
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, category: undefined }))
    }
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "task-card-urgent shadow-lg"
      case "high":
        return "task-card-high shadow-lg"
      case "medium":
        return "task-card-medium shadow-lg"
      case "low":
        return "task-card-low shadow-lg"
      default:
        return "task-card-default shadow-lg"
    }
  }

  const getPriorityStyle = (priority: string) => {
    const baseStyle = {
      backgroundColor: isInitialized && isDarkMode ? '#111827' : '#f9fafb',
      borderColor: isInitialized && isDarkMode ? '#374151' : '#e5e7eb',
    }

    if (isInitialized && isDarkMode) {
      // Softer, friendly tints on dark backgrounds
      switch (priority) {
        case 'urgent':
          return {
            backgroundColor: 'rgba(239, 68, 68, 0.12)', // red-500 @12%
            borderColor: 'rgba(239, 68, 68, 0.35)',
          }
        case 'high':
          return {
            backgroundColor: 'rgba(249, 115, 22, 0.12)', // orange-500 @12%
            borderColor: 'rgba(249, 115, 22, 0.35)',
          }
        case 'medium':
          return {
            backgroundColor: 'rgba(234, 179, 8, 0.12)', // yellow-500 @12%
            borderColor: 'rgba(234, 179, 8, 0.35)',
          }
        case 'low':
          return {
            backgroundColor: 'rgba(34, 197, 94, 0.12)', // green-500 @12%
            borderColor: 'rgba(34, 197, 94, 0.35)',
          }
        default:
          return baseStyle
      }
    }

    // Light mode (pastel backgrounds)
    switch (priority) {
      case 'urgent':
        return {
          backgroundColor: '#fef2f2', // bg-red-50
          borderColor: '#fecaca', // border-red-200
        }
      case 'high':
        return {
          backgroundColor: '#fff7ed', // bg-orange-50
          borderColor: '#fed7aa', // border-orange-200
        }
      case 'medium':
        return {
          backgroundColor: '#fefce8', // bg-yellow-50
          borderColor: '#fde68a', // border-yellow-200
        }
      case 'low':
        return {
          backgroundColor: '#f0fdf4', // bg-green-50
          borderColor: '#bbf7d0', // border-green-200
        }
      default:
        return baseStyle
    }
  }

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"
      case "high":
        return "w-3 h-3 bg-orange-500 rounded-full shadow-lg"
      case "medium":
        return "w-3 h-3 bg-yellow-500 rounded-full shadow-lg"
      case "low":
        return "w-3 h-3 bg-green-500 rounded-full shadow-lg"
      default:
        return "w-3 h-3 bg-gray-400 rounded-full"
    }
  }

  // Cross-browser compatible inline styles for consistent colors
  const priorityStyle = getPriorityStyle(task.priority)
  
  // Debug: Log what's being rendered (remove after testing)
  useEffect(() => {
    if (typeof window !== 'undefined' && task.id) {
      const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      if (isSafariBrowser) {
        console.log(`Safari - Task: ${task.title}, Priority: ${task.priority}, Class: ${getPriorityColor(task.priority)}, BG Color: ${priorityStyle.backgroundColor}, Dark Mode: ${isDarkMode}`)
      }
    }
  }, [task.id, task.priority, task.title, priorityStyle.backgroundColor, isDarkMode])

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
      }}
      className={`task-card group relative rounded-2xl hover:shadow-2xl transition-all duration-300 ${
        isDragging ? "opacity-0" : "hover:scale-102 hover:-translate-y-1"
      }`}
    >
      <div
        className="dark-border border-2 rounded-2xl shadow-lg"
        style={{
          backgroundColor: priorityStyle.backgroundColor,
          borderColor: priorityStyle.borderColor,
        }}
      >
      {/* Priority Indicator */}
      <div className="absolute -top-1.5 -left-1.5 z-10">
        <div className={getPriorityIndicator(task.priority)}></div>
      </div>
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <div className="flex items-start justify-between p-3 pb-2 gap-2">
          <h4 className={`font-bold text-sm leading-snug flex-1 pr-2 transition-colors line-clamp-3 ${
            isInitialized && isDarkMode ? 'text-gray-100 group-hover:text-gray-300' : 'text-gray-900 group-hover:text-gray-700'
          }`} title={task.title}>
            {task.title}
          </h4>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity h-4 flex-shrink-0 mt-0.5">
            <div className={`w-1 h-1 rounded-full bg-gray-300`}></div>
            <div className={`w-0.5 h-0.5 rounded-full bg-gray-200`}></div>
            <div className={`w-0.5 h-0.5 rounded-full bg-gray-200`}></div>
          </div>
        </div>
      </div>
      
      {/* Description Preview */}
      {task.description && (
        <div className="px-3 pb-2">
          <p className={`text-xs leading-snug truncate ${
            isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`} title={task.description}>
            {task.description}
          </p>
        </div>
      )}
      
      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {task.tags.slice(0, 3).map(tag => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation() // Prevent drag start
                  handleTagClick(tag)
                }}
                disabled={loadingStates.tag === tag}
                className={`px-2 py-0.5 text-xs rounded-full font-medium border max-w-20 hover:scale-105 hover:shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                  loadingStates.tag === tag
                    ? 'opacity-50 cursor-not-allowed'
                    : filters?.tags?.includes(tag)
                      ? 'bg-yellow-200 text-yellow-800 border-yellow-300 ring-2 ring-yellow-400'
                      : tag.startsWith('@') 
                        ? 'bg-blue-50/70 text-blue-700 border-blue-200/50 hover:bg-blue-100/70'
                        : tag.startsWith('#') 
                          ? 'bg-green-50/70 text-green-700 border-green-200/50 hover:bg-green-100/70'
                          : tag.startsWith('$') 
                            ? 'bg-purple-50/70 text-purple-700 border-purple-200/50 hover:bg-purple-100/70'
                            : tag.startsWith('⚡') 
                              ? 'bg-orange-50/70 text-orange-700 border-orange-200/50 hover:bg-orange-100/70'
                              : tag.startsWith('⏱') 
                                ? 'bg-teal-50/70 text-teal-700 border-teal-200/50 hover:bg-teal-100/70'
                                : tag.startsWith('👤') 
                                  ? 'bg-pink-50/70 text-pink-700 border-pink-200/50 hover:bg-pink-100/70'
                                  : 'bg-gray-50/70 text-gray-700 border-gray-200/50 hover:bg-gray-100/70'
                }`}
                title={tag} // Show full tag text on hover
              >
                {loadingStates.tag === tag ? (
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="truncate block overflow-hidden text-ellipsis whitespace-nowrap">{tag}</span>
                )}
              </button>
            ))}
            {task.tags.length > 3 && (
              <span className={`px-2 py-0.5 text-xs rounded-full border bg-gray-100 text-gray-600 border-gray-200`}>
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Task Metadata */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent drag start
              handleTypeClick(task.type)
            }}
            disabled={loadingStates.type === task.type}
            className={`px-2 py-0.5 text-xs rounded-full font-medium border max-w-24 truncate hover:scale-105 hover:shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1 ${
              loadingStates.type === task.type
                ? 'opacity-50 cursor-not-allowed'
                : filters?.type === task.type
                  ? 'bg-blue-200 text-blue-800 border-blue-300 ring-2 ring-blue-400'
                  : 'bg-white/60 text-gray-600 border-gray-200/50 hover:bg-gray-100/70'
            }`}
            title={`Click to filter by ${task.type}`}
          >
            {loadingStates.type === task.type && (
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            )}
            {task.type}
          </button>
          {task.assignee && task.assignee !== 'unassigned' && (
            <button
              onClick={(e) => {
                e.stopPropagation() // Prevent drag start
                handleAssigneeClick(task.assignee)
              }}
              disabled={loadingStates.assignee === task.assignee}
              className={`flex items-center gap-1.5 hover:scale-105 transition-all duration-200 cursor-pointer px-2 py-1 rounded-lg ${
                loadingStates.assignee === task.assignee
                  ? 'opacity-50 cursor-not-allowed'
                  : filters?.assignee === task.assignee
                    ? 'bg-blue-200 ring-2 ring-blue-400'
                    : 'hover:bg-gray-100/50'
              }`}
              title={`Click to filter by ${task.assignee}`}
            >
              {loadingStates.assignee === task.assignee ? (
                <div className="w-5 h-5 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${
                  filters?.assignee === task.assignee
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                    : 'bg-gradient-to-br from-blue-400 to-purple-500'
                }`}>
                  <span className="text-white text-xs font-bold">
                    {task.assignee.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className={`text-xs font-medium max-w-16 truncate ${
                filters?.assignee === task.assignee
                  ? 'text-blue-800'
                  : 'text-gray-600'
              }`}>{task.assignee}</span>
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      {task.category && (
        <div className="px-3 pb-2">
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent drag start
              handleCategoryClick(task.category)
            }}
            disabled={loadingStates.category === task.category}
            className={`px-2 py-0.5 text-xs rounded-full font-medium border max-w-24 truncate hover:scale-105 hover:shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1 ${
              loadingStates.category === task.category
                ? 'opacity-50 cursor-not-allowed'
                : filters?.category === task.category
                  ? 'bg-purple-200 text-purple-800 border-purple-300 ring-2 ring-purple-400'
                  : 'bg-purple-50/70 text-purple-700 border-purple-200/50 hover:bg-purple-100/70'
            }`}
            title={`Click to filter by ${task.category}`}
          >
            {loadingStates.category === task.category && (
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            )}
            📂 {task.category}
          </button>
        </div>
      )}
      
      {/* Due Date */}
      {task.dueDate && (
        <div className="px-3 pb-2 flex justify-end">
          {(() => {
            const dateInfo = getDateInfo(task.dueDate, task.status, task.completedAt, task.updatedAt)
            const classes = getDateClasses(dateInfo, task.status)
            
            return (
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border ${classes.container}`}>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span 
                  className={`text-xs font-semibold whitespace-nowrap ${classes.text}`}
                  title={dateInfo.fullDate}
                >
                  {dateInfo.displayText}
                </span>
              </div>
            )
          })()}
        </div>
      )}

      {/* Action Buttons */}
      <div className={`flex items-center justify-end gap-1 px-3 py-1.5 border-t rounded-b-2xl ${
        isInitialized && isDarkMode 
          ? 'border-gray-600 bg-gray-800/50' 
          : 'border-gray-200 bg-gray-50'
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onView?.(task)
          }}
          className={`p-2 rounded-xl transition-all duration-200 group/btn text-gray-400 hover:text-blue-600 hover:bg-blue-100/50`}
          title="View Task"
        >
          <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit?.(task)
          }}
          className={`p-2 rounded-xl transition-all duration-200 group/btn text-gray-400 hover:text-emerald-600 hover:bg-emerald-100/50`}
          title="Edit Task"
        >
          <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(task)
          }}
          className={`p-2 rounded-xl transition-all duration-200 group/btn text-gray-400 hover:text-red-600 hover:bg-red-100/50`}
          title="Delete Task"
        >
          <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      </div>
    </div>
  )
}

function Column({ column, tasks, laneType, onEdit, onView, onDelete, onTagClick, onAssigneeClick, onTypeClick, onCategoryClick, filters, isSafari, sourceLane }: { 
  column: LaneConfig, 
  tasks: Task[], 
  laneType: LaneType,
  onEdit?: (task: Task) => void,
  onView?: (task: Task) => void,
  onDelete?: (task: Task) => void,
  onTagClick?: (tag: string) => void,
  onAssigneeClick?: (assignee: string) => void,
  onTypeClick?: (type: string) => void,
  onCategoryClick?: (category: string) => void,
  filters?: {
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
  },
  isSafari?: boolean,
  sourceLane?: string | null
}) {
  const { isDarkMode, isInitialized } = useTheme()
  
  // Safari-specific inline styles for consistent colors
  const safariLaneStyles = isSafari ? {
    backgroundColor: isInitialized && isDarkMode ? '#1f2937' : '#f9fafb', // bg-gray-800 or bg-gray-50
    borderColor: isInitialized && isDarkMode ? '#374151' : '#e5e7eb' // border-gray-700 or border-gray-200
  } : {}
  const { setNodeRef, isOver } = useDroppable({
    id: `lane-${column.id}`, // More specific ID to avoid conflicts
    data: {
      type: 'column',
      accepts: ['task'],
      laneId: column.id, // Store the actual lane ID in data
      laneTitle: column.title,
      laneType: laneType
    },
    // Safari-specific optimizations
    disabled: false,
  })
  
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)
  
  const groupingField = getGroupingField(laneType)
  const columnTasks = tasks.filter(task => task[groupingField as keyof Task] === column.id)
  
  // Check scroll position and update scroll indicators
  useEffect(() => {
    if (scrollContainer) {
      const checkScrollPosition = () => {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer
        setCanScrollUp(scrollTop > 0)
        setCanScrollDown(scrollTop < scrollHeight - clientHeight - 1)
      }
      
      // Handle scrollbar visibility naturally (only show when content overflows)
      const handleScrollbarVisibility = () => {
        if (scrollContainer.scrollHeight > scrollContainer.clientHeight) {
          // Content overflows - scrollbar will be visible automatically
          scrollContainer.classList.add('has-scrollbar')
        } else {
          // No overflow - remove scrollbar class
          scrollContainer.classList.remove('has-scrollbar')
        }
      }
      
      checkScrollPosition()
      handleScrollbarVisibility()
      scrollContainer.addEventListener('scroll', checkScrollPosition)
      
      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollPosition)
      }
    }
  }, [scrollContainer, columnTasks.length])

  // Auto-scroll functionality for full lanes
  useEffect(() => {
    if (isOver && scrollContainer && columnTasks.length > 4) {
      // Smooth scroll to bottom when dragging over full lanes
      const timeoutId = setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        })
      }, 100) // Small delay for better UX
      
      return () => clearTimeout(timeoutId)
    }
  }, [isOver, scrollContainer, columnTasks.length])
  
  return (
    <div 
      className={`space-y-4 relative p-2 ${isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-white'}`} 
      ref={setNodeRef}
      data-droppable="true"
      data-safari-optimized="true"
    >
      {/* Extended drop zone area around entire column */}
      {isOver && (
        <div className="absolute -inset-4 z-20 pointer-events-none">
          <div className={`w-full h-full border-4 border-dashed rounded-2xl ${
            isInitialized && isDarkMode 
              ? 'bg-blue-500 bg-opacity-10 border-blue-400' 
              : 'bg-blue-500 bg-opacity-5 border-blue-300'
          }`}></div>
        </div>
      )}
      {/* Column Header */}
      <div 
        style={safariLaneStyles}
        className={`kanban-lane dark-border ${column.color} ${column.borderColor} border-2 p-4 rounded-xl shadow-sm transition-all duration-200 ${
          isOver ? `ring-4 ${isInitialized && isDarkMode ? 'ring-blue-300' : 'ring-blue-400'} ring-opacity-50 scale-105 shadow-lg` : ''
        }`}
      >
        {isOver && (
          <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 text-white text-xs px-2 py-1 rounded-full shadow-lg z-10 ${
            sourceLane === column.id ? 'bg-yellow-600' : 'bg-blue-600'
          }`}>
            {sourceLane === column.id ? (
              `Same Lane: ${column.title}`
            ) : (
              `Drop Target: ${column.title}`
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-2">{column.icon}</span>
            <h3 className={`font-bold text-sm ${column.textColor || (isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-800')}`}>
              {column.title}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              isInitialized && isDarkMode 
                ? 'bg-gray-700 bg-opacity-60 text-gray-200' 
                : 'bg-white bg-opacity-60 text-gray-700'
            }`}>
              {columnTasks.length}
            </span>
            {/* Scroll indicators */}
            {canScrollUp && (
              <div className={`w-1 h-1 rounded-full animate-pulse ${
                isInitialized && isDarkMode ? 'bg-blue-300' : 'bg-blue-400'
              }`}></div>
            )}
            {canScrollDown && (
              <div className={`w-1 h-1 rounded-full animate-pulse ${
                isInitialized && isDarkMode ? 'bg-blue-300' : 'bg-blue-400'
              }`} style={{ animationDelay: '0.3s' }}></div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tasks in Column */}
      <div className="relative">
        {/* Side drop zones for easier targeting */}
        {isOver && columnTasks.length > 3 && (
          <>
            {/* Left side drop zone */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-blue-400 bg-opacity-30 rounded-l-xl z-10"></div>
            {/* Right side drop zone */}
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-blue-400 bg-opacity-30 rounded-r-xl z-10"></div>
            {/* Bottom drop zone */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-blue-400 bg-opacity-30 rounded-b-xl z-10"></div>
          </>
        )}
        
        <div 
          ref={setScrollContainer}
          className={`h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)] lg:h-[calc(100vh-300px)] min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] overflow-y-auto p-2 rounded-xl border-2 border-dashed kanban-lane-scroll transition-all duration-200 ${
            isOver 
              ? isInitialized && isDarkMode 
                ? 'bg-blue-900/20 border-blue-400 border-solid' 
                : 'bg-blue-50 border-blue-300 border-solid'
              : isInitialized && isDarkMode 
                ? 'bg-gray-800/50 border-gray-600' 
                : 'bg-gray-50 border-gray-200'
          } ${
            canScrollUp ? 'scrollable-top' : ''
          } ${
            canScrollDown ? 'scrollable-bottom' : ''
          }`}
        >
        <SortableContext items={columnTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 pb-4">
            {columnTasks.map((task) => (
              <div key={task.id}>
                {/* Drop indicator above each task when dragging */}
                {isOver && (
                  <div className="h-1 bg-blue-400 rounded-full opacity-60 animate-pulse mb-2"></div>
                )}
                <TaskCard task={task} onEdit={onEdit} onView={onView} onDelete={onDelete} onTagClick={onTagClick} onAssigneeClick={onAssigneeClick} onTypeClick={onTypeClick} onCategoryClick={onCategoryClick} filters={filters} />
              </div>
            ))}
            
            {/* Drop indicator when dragging over a full lane */}
            {isOver && columnTasks.length > 0 && (
              <div className="flex flex-col items-center py-2">
                <div className="h-2 w-full bg-blue-300 rounded-full opacity-50 animate-pulse"></div>
                <span className="text-xs text-blue-600 font-medium mt-1">Drop here</span>
              </div>
            )}
            
            {/* Invisible drop zone at the bottom for full lanes */}
            {columnTasks.length > 0 && (
              <div className="h-4 opacity-0"></div>
            )}
            
            {columnTasks.length === 0 && (
              <div className={`flex flex-col items-center justify-center py-12 transition-all duration-200 ${
                isOver 
                  ? isInitialized && isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  : isInitialized && isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${
                  isOver 
                    ? isInitialized && isDarkMode ? 'bg-blue-800 scale-110' : 'bg-blue-200 scale-110'
                    : isInitialized && isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <span className="text-2xl">{column.icon}</span>
                </div>
                <p className="text-sm font-medium mb-1">
                  {isOver ? 'Drop task here!' : 'No tasks yet'}
                </p>
                <p className="text-xs text-center">
                  {isOver ? 'Release to drop' : 'Drop tasks here or create new ones'}
                </p>
                {isOver && (
                  <div className={`mt-2 text-xs rounded-full px-2 py-1 ${
                    sourceLane === column.id 
                      ? isInitialized && isDarkMode 
                        ? 'text-yellow-400 bg-yellow-900/50' 
                        : 'text-yellow-500 bg-yellow-100'
                      : isInitialized && isDarkMode 
                        ? 'text-blue-400 bg-blue-900/50' 
                        : 'text-blue-500 bg-blue-100'
                  }`}>
                    {sourceLane === column.id ? (
                      `Same Lane: ${column.title} (No change)`
                    ) : (
                      `Target: ${column.title} (${column.id})`
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </SortableContext>
        </div>
      </div>
      
      {/* Large Drop Target Areas for Easy Targeting */}
      {isOver && (
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          data-safari-drop-zone="true"
          style={{
            transform: isSafari ? 'translateZ(0)' : undefined,
            backfaceVisibility: isSafari ? 'hidden' : undefined,
          }}
        >
          {/* Top drop area */}
          <div className={`absolute top-0 left-0 right-0 h-8 rounded-t-xl flex items-center justify-center ${
            isInitialized && isDarkMode 
              ? 'bg-green-500 bg-opacity-50' 
              : 'bg-green-400 bg-opacity-40'
          }`}>
            <span className={`font-bold text-sm ${
              isInitialized && isDarkMode ? 'text-green-200' : 'text-green-800'
            }`}>DROP HERE ↑</span>
          </div>
          
          {/* Bottom drop area */}
          <div className={`absolute bottom-0 left-0 right-0 h-8 rounded-b-xl flex items-center justify-center ${
            isInitialized && isDarkMode 
              ? 'bg-green-500 bg-opacity-50' 
              : 'bg-green-400 bg-opacity-40'
          }`}>
            <span className={`font-bold text-sm ${
              isInitialized && isDarkMode ? 'text-green-200' : 'text-green-800'
            }`}>DROP HERE ↓</span>
          </div>
          
          {/* Left drop area */}
          <div className={`absolute left-0 top-8 bottom-8 w-8 rounded-l-xl flex items-center justify-center ${
            isInitialized && isDarkMode 
              ? 'bg-green-500 bg-opacity-50' 
              : 'bg-green-400 bg-opacity-40'
          }`}>
            <span className={`font-bold text-sm transform -rotate-90 ${
              isInitialized && isDarkMode ? 'text-green-200' : 'text-green-800'
            }`}>DROP</span>
          </div>
          
          {/* Right drop area */}
          <div className={`absolute right-0 top-8 bottom-8 w-8 rounded-r-xl flex items-center justify-center ${
            isInitialized && isDarkMode 
              ? 'bg-green-500 bg-opacity-50' 
              : 'bg-green-400 bg-opacity-40'
          }`}>
            <span className={`font-bold text-sm transform rotate-90 ${
              isInitialized && isDarkMode ? 'text-green-200' : 'text-green-800'
            }`}>DROP</span>
          </div>
          
          {/* Center drop area for full lanes */}
          {columnTasks.length > 3 && (
            <div className={`absolute inset-8 border-2 border-dashed rounded-xl flex items-center justify-center ${
              isInitialized && isDarkMode 
                ? 'bg-blue-500 bg-opacity-30 border-blue-300' 
                : 'bg-blue-500 bg-opacity-20 border-blue-400'
            }`}>
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-4 animate-bounce mx-auto">
                  <span className="text-white text-3xl">↓</span>
                </div>
                <h3 className={`font-bold text-xl mb-2 ${
                  sourceLane === column.id 
                    ? isInitialized && isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
                    : isInitialized && isDarkMode ? 'text-blue-400' : 'text-blue-700'
                }`}>
                  {sourceLane === column.id ? 'Same Lane - No Change' : 'Drop Task Here'}
                </h3>
                <p className={`text-sm ${
                  sourceLane === column.id 
                    ? isInitialized && isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                    : isInitialized && isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  {sourceLane === column.id ? (
                    'Task will stay in the same lane'
                  ) : (
                    <>Release to add to <strong>{column.title}</strong></>
                  )}
                </p>
                <div className={`mt-2 text-xs rounded-full px-3 py-1 ${
                  sourceLane === column.id 
                    ? 'text-yellow-500 bg-yellow-100' 
                    : 'text-blue-500 bg-blue-100'
                }`}>
                  Lane: {column.id} • Type: {laneType}
                  {sourceLane && sourceLane === column.id && ' • Same as source'}
                </div>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Corner drop indicators */}
          <div className="absolute top-2 left-2 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
          <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
        </div>
      )}
    </div>
  )
}

export default function DragDropKanban({ filters, refreshTrigger, laneType = "status", onTagClick, onAssigneeClick, onTypeClick, onCategoryClick, onLoadingChange, onTaskStatusChange }: DragDropKanbanProps) {
  const { isDarkMode, isInitialized } = useTheme()
  
  // Safari detection for inline style fallbacks
  const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [dragOverLane, setDragOverLane] = useState<string | null>(null)
  const [sourceLane, setSourceLane] = useState<string | null>(null)
  const [userConfig, setUserConfig] = useState<{
    statuses?: string[]
    priorities?: string[]
    types?: string[]
    timeFrames?: string[]
    categories?: string[]
    assignees?: string[]
  } | null>(null)
  const [dragOverTimeout, setDragOverTimeout] = useState<NodeJS.Timeout | null>(null)
  const lastDetectedLaneRef = useRef<string | null>(null)

  // Safari lane background enforcement (task cards now use inline styles)
  useEffect(() => {
    if (isSafari && isInitialized) {
      // Force consistent backgrounds for Safari - only for lanes
      const kanbanLanes = document.querySelectorAll('.kanban-lane')
      
      kanbanLanes.forEach(lane => {
        const element = lane as HTMLElement
        element.style.setProperty('background-color', isDarkMode ? '#1f2937' : '#f9fafb')
        element.style.setProperty('border-color', isDarkMode ? '#374151' : '#e5e7eb')
      })
    }
  }, [isSafari, isInitialized, isDarkMode])
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)
  
  // Confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Safari detection for drag and drop optimizations (using existing isSafari from above)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isSafari ? 2 : 4, // Even more sensitive for Safari
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: isSafari ? 50 : 100, // Shorter delay for Safari
        tolerance: isSafari ? 3 : 5, // More sensitive tolerance for Safari
      },
    })
  )

  // Get dynamic lanes based on lane type and user configuration
  const getDynamicLanes = useCallback(() => {
    if (laneType === "category") {
      // Use user configuration categories or extract from tasks
      const categories = userConfig?.categories || Array.from(new Set(tasks.map(task => task.category))).sort()
      return getLanesForType(laneType, { categories, ...userConfig }, isDarkMode)
    }
    if (laneType === "assignee") {
      // Use user configuration assignees only (no fallback to extract from tasks)
      const assignees = userConfig?.assignees || []
      return getLanesForType(laneType, { assignees, ...userConfig }, isDarkMode)
    }
    return getLanesForType(laneType, userConfig || undefined, isDarkMode)
  }, [laneType, tasks, userConfig, isDarkMode])

  const columns = getDynamicLanes()

  // Enhanced lane detection function
  const detectActualLane = useCallback((overId: string | null, overData?: { laneId?: string } | null) => {
    if (!overId) return null
    
    // First, try to extract lane ID from the data object
    if (overData?.laneId) {
      return overData.laneId
    }
    
    // Check if it's a lane ID with the new format
    if (overId.startsWith('lane-')) {
      const laneId = overId.replace('lane-', '')
      const directLane = columns.find(col => col.id === laneId)
      if (directLane) return directLane.id
    }
    
    // Try to find the lane directly by ID (fallback for old format)
    const directLane = columns.find(col => col.id === overId)
    if (directLane) return directLane.id
    
    // Check if it's a task ID - find which lane the task belongs to
    const task = tasks.find(t => t.id === overId)
    if (task) {
      const groupingField = getGroupingField(laneType)
      const taskLaneId = task[groupingField as keyof Task] as string
      const taskLane = columns.find(col => col.id === taskLaneId)
      if (taskLane) return taskLane.id
    }
    
    // If not found directly, look for lane in the DOM hierarchy
    // This helps when dragging over child elements like tasks, drop zones, etc.
    const laneIds = columns.map(col => col.id)
    
    // Check if the overId contains or is contained within a lane ID
    for (const laneId of laneIds) {
      if (overId.includes(laneId) || laneId.includes(overId)) {
        return laneId
      }
    }
    
    // If still not found, return the original overId as fallback
    return overId
  }, [columns, tasks, laneType])

  // Modal handlers
  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setModalMode("edit")
    setModalOpen(true)
  }

  const handleViewTask = (task: Task) => {
    setSelectedTask(task)
    setModalMode("view")
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedTask(undefined)
  }

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteTask(taskToDelete.id)
      if (result.error) {
        // Show error message (could be enhanced with a toast notification)
        console.error("Failed to delete task:", result.error)
        showToast.error(result.error)
      } else {
        // Refresh the tasks list
        await fetchTasks()
        setDeleteConfirmOpen(false)
        setTaskToDelete(null)
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      showToast.error("Failed to delete task. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDeleteTask = () => {
    setDeleteConfirmOpen(false)
    setTaskToDelete(null)
    setIsDeleting(false)
  }

  const handleTaskSaved = () => {
    fetchTasks()
  }

  // Helper function to check if a task matches the current filters
  const taskMatchesFilters = useCallback((task: Task, currentFilters = filters) => {
    if (!currentFilters) return true

    // Check search filter
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase()
      const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                           (task.description && task.description.toLowerCase().includes(searchTerm))
      if (!matchesSearch) return false
    }

    // Check status filter
    if (currentFilters.status && task.status !== currentFilters.status) {
      return false
    }

    // Check priority filter
    if (currentFilters.priority && task.priority !== currentFilters.priority) {
      return false
    }

    // Check assignee filter
    if (currentFilters.assignee && task.assignee !== currentFilters.assignee) {
      return false
    }

    // Check type filter
    if (currentFilters.type && task.type !== currentFilters.type) {
      return false
    }

    // Check category filter
    if (currentFilters.category && task.category !== currentFilters.category) {
      return false
    }

    // Check timeFrame filter
    if (currentFilters.timeFrame && task.timeFrame !== currentFilters.timeFrame) {
      return false
    }

    // Check tags filter
    if (currentFilters.tags && currentFilters.tags.length > 0) {
      const hasMatchingTag = currentFilters.tags.some(filterTag => 
        task.tags.some(taskTag => taskTag === filterTag)
      )
      if (!hasMatchingTag) return false
    }

    // Check date filters
    if (currentFilters.dueDateFrom && task.dueDate) {
      const taskDate = new Date(task.dueDate)
      const fromDate = new Date(currentFilters.dueDateFrom)
      if (taskDate < fromDate) return false
    }

    if (currentFilters.dueDateTo && task.dueDate) {
      const taskDate = new Date(task.dueDate)
      const toDate = new Date(currentFilters.dueDateTo)
      if (taskDate > toDate) return false
    }

    return true
  }, [filters])

  const fetchTasks = useCallback(async (currentFilters = filters) => {
    try {
      setLoading(true)
      onLoadingChange?.(true)
      const result = await getTasks(currentFilters)
      if (result?.error) {
        showToast.error(result.error)
      } else {
        // Filter out completed tasks that are older than 1 day
        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)
        
        const allTasks = (result?.tasks || []) as unknown as Task[]
        const filteredTasks = allTasks.filter((task) => {
          // Keep task if it's not in done/completed status
          if (task.status !== 'done' && task.status !== 'completed') {
            return true
          }
          
          // For done/completed tasks, check completedAt timestamp
          if (task.completedAt) {
            const completedDate = new Date(task.completedAt)
            // Keep if completed less than 1 day ago
            return completedDate > oneDayAgo
          }
          
          // If no completedAt timestamp, use updatedAt as fallback
          if (task.updatedAt) {
            const updatedDate = new Date(task.updatedAt)
            // Keep if updated less than 1 day ago
            return updatedDate > oneDayAgo
          }
          
          // Default: keep the task if we can't determine the date
          return true
        })
        
        setTasks(filteredTasks)
      }
    } catch (error) {
      console.error("DragDropKanban fetchTasks error:", error)
      showToast.error("Failed to fetch tasks")
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }, [onLoadingChange]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserConfig = useCallback(async () => {
    try {
      const result = await getAvailableValues()
      if (result?.success && result.values) {
        setUserConfig(result.values)
      }
    } catch (error) {
      console.error("Error fetching user config:", error)
    }
  }, [])

  useEffect(() => {
    fetchTasks(filters)
    fetchUserConfig()
  }, [fetchTasks, fetchUserConfig, filters, refreshTrigger])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Find the task
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Check if we're dragging to a different column using enhanced detection
    const actualLaneId = detectActualLane(overId, over?.data as { laneId?: string } | null)
    const column = columns.find(col => col.id === actualLaneId)
    if (column) {
      const groupingField = getGroupingField(laneType)
      const currentValue = task[groupingField as keyof Task] as string
      
      if (currentValue !== actualLaneId) {
        // Cross-column move - update the appropriate field
        const originalValue = currentValue

        // Optimistic update with filter check
        setTasks(prevTasks => {
          const updatedTasks = prevTasks.map(prevTask => 
            prevTask.id === taskId ? { ...prevTask, [groupingField]: actualLaneId } : prevTask
          )
          
          // Check if the updated task still matches the current filters
          const updatedTask = updatedTasks.find(t => t.id === taskId)
          if (updatedTask && !taskMatchesFilters(updatedTask)) {
            // Remove the task if it no longer matches the filters
            return updatedTasks.filter(t => t.id !== taskId)
          }
          
          return updatedTasks
        })

        // Update in database
        if (actualLaneId) {
          try {
            const result = await updateTaskField(taskId, groupingField, actualLaneId)
          if (result?.error) {
            // Revert optimistic update on error - need to refetch to get correct state
            await fetchTasks()
            showToast.error(result.error)
          } else {
            // Notify parent component about status change
            if (onTaskStatusChange && groupingField === 'status') {
              onTaskStatusChange(taskId, originalValue, actualLaneId)
            }
          }
        } catch {
          // Revert optimistic update on error - need to refetch to get correct state
          await fetchTasks()
          showToast.error("Failed to update task")
        }
        }
      } else {
        // Same column reordering - just reorder the tasks array
        const overTask = tasks.find(t => t.id === overId)
        if (overTask) {
          const overValue = overTask[groupingField as keyof Task] as string
          if (overValue === currentValue) {
            const newTasks = [...tasks]
            const activeIndex = newTasks.findIndex(t => t.id === taskId)
            const overIndex = newTasks.findIndex(t => t.id === overId)
            
            if (activeIndex !== overIndex) {
              // Remove the active task and insert it at the new position
              newTasks.splice(activeIndex, 1)
              newTasks.splice(overIndex, 0, task)
              setTasks(newTasks)
            }
          }
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${
            isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>Loading your tasks...</h3>
          <p className={`${
            isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Please wait while we fetch your task board</p>
        </div>
      </div>
    )
  }


  return (
    <div className={`min-h-full ${isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
    <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        handleDragStart(event)
        // Capture source lane when drag starts
        const task = tasks.find(t => t.id === event.active.id)
        if (task) {
          const groupingField = getGroupingField(laneType)
          setSourceLane(task[groupingField as keyof Task] as string)
        }
      }}
      onDragOver={(event) => {
        // Clear any existing timeout
        if (dragOverTimeout) {
          clearTimeout(dragOverTimeout)
        }
        
        // Immediate detection for lane elements to reduce flickering
        const overId = event.over?.id as string || null
        let immediateLane = null
        
        // Check if it's a direct lane detection
        if (overId?.startsWith('lane-')) {
          const laneId = overId.replace('lane-', '')
          immediateLane = laneId
        } else if (event.over?.data && typeof event.over.data === 'object' && 'laneId' in event.over.data) {
          immediateLane = (event.over.data as { laneId: string }).laneId
        }
        
        // If we have immediate detection, use it right away
        if (immediateLane && immediateLane !== lastDetectedLaneRef.current) {
          lastDetectedLaneRef.current = immediateLane
          setDragOverLane(immediateLane)
        } else {
          // For other elements (like tasks), use debounced detection
          const timeout = setTimeout(() => {
            const actualLane = detectActualLane(overId, event.over?.data as { laneId?: string } | null)
            
            // Only update if the lane actually changed to prevent flickering
            if (actualLane !== lastDetectedLaneRef.current) {
              lastDetectedLaneRef.current = actualLane
              setDragOverLane(actualLane)
            }
          }, 20) // Even faster for tasks
          
          setDragOverTimeout(timeout)
        }
      }}
      onDragEnd={(event) => {
        handleDragEnd(event)
        setDragOverLane(null)
        setSourceLane(null)
        // Clear any pending timeout
        if (dragOverTimeout) {
          clearTimeout(dragOverTimeout)
          setDragOverTimeout(null)
        }
        // Reset the detection ref
        lastDetectedLaneRef.current = null
      }}
    >
      {/* Global Drag Indicator */}
      {dragOverLane && activeTask && sourceLane && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg ${
          sourceLane === dragOverLane 
            ? 'bg-yellow-600 text-white' 
            : 'bg-blue-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span className="text-sm font-medium">
              {sourceLane === dragOverLane ? (
                <>
                  <strong>Same Lane:</strong> {columns.find(col => col.id === dragOverLane)?.title || dragOverLane}
                  <span className="ml-2 text-xs opacity-75">(No change)</span>
                </>
              ) : (
                <>
                  From <strong>{columns.find(col => col.id === sourceLane)?.title || sourceLane}</strong> 
                  {' → '} 
                  To <strong>{columns.find(col => col.id === dragOverLane)?.title || dragOverLane}</strong>
                </>
              )}
            </span>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-4 py-2 ${
        columns.length <= 3 ? 'lg:grid-cols-3' :
        columns.length <= 4 ? 'lg:grid-cols-4' :
        columns.length <= 6 ? 'lg:grid-cols-3 xl:grid-cols-6' :
        'lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8'
      }`}>
        {columns.map((column) => {
          const groupingField = getGroupingField(laneType)
          const columnTasks = tasks.filter(task => task[groupingField as keyof Task] === column.id)
          return (
            <Column 
              key={column.id}
              column={column} 
              tasks={columnTasks} 
              laneType={laneType} 
              isSafari={isSafari}
              onEdit={handleEditTask}
              onView={handleViewTask}
              onDelete={handleDeleteTask}
              onTagClick={onTagClick}
              onAssigneeClick={onAssigneeClick}
              onTypeClick={onTypeClick}
              onCategoryClick={onCategoryClick}
              filters={filters}
              sourceLane={sourceLane}
            />
          )
        })}
      </div>
      
      <DragOverlay>
        {activeTask ? (
          <div 
            className={`transform rotate-3 scale-105 opacity-90 shadow-2xl ${
              isSafari ? 'pointer-events-none' : ''
            }`}
            data-draggable="true"
            style={{
              transform: isSafari ? 'translateZ(0) rotate(3deg) scale(1.05)' : undefined,
              backfaceVisibility: isSafari ? 'hidden' : undefined,
            }}
          >
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
      
      {tasks.length === 0 && (
        <div className="col-span-3 text-center py-16">
          <div className="flex flex-col items-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
              isInitialized && isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <svg className={`w-12 h-12 ${
                isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${
              isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>No tasks yet</h3>
            <p className={`mb-4 ${
              isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Get started by creating your first task using the form on the left!</p>
            <div className={`flex items-center text-sm ${
              isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Drag and drop tasks between columns to organize your workflow
            </div>
          </div>
        </div>
      )}
    </DndContext>

    {/* Task Modal */}
    <TaskModal
      isOpen={modalOpen}
      onClose={handleCloseModal}
      mode={modalMode}
      task={selectedTask}
      onTaskSaved={handleTaskSaved}
      availablePriorities={userConfig?.priorities}
      availableTypes={userConfig?.types}
      availableTimeFrames={userConfig?.timeFrames}
      availableCategories={userConfig?.categories}
      availableAssignees={userConfig?.assignees}
    />

    {/* Delete Confirmation Dialog */}
    <ConfirmationDialog
      isOpen={deleteConfirmOpen}
      onClose={cancelDeleteTask}
      onConfirm={confirmDeleteTask}
      title="Delete Task"
      message={taskToDelete ? `Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.` : ""}
      confirmText="Delete Task"
      cancelText="Cancel"
      type="danger"
      loading={isDeleting}
    />
    </div>
  )
}
