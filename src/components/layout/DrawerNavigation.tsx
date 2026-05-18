"use client"

import React, { useState } from "react"
import DragDropKanban from "@/components/features/tasks/DragDropKanban"
import StatisticsDashboard from "@/components/features/analytics/StatisticsDashboard"
import NewsPage from "@/components/features/news/NewsPage"
import Settings from "@/components/Settings"
import TaskFilter from "@/components/features/tasks/TaskFilter"
import LaneSwitcher, { LaneType } from "@/components/layout/LaneSwitcher"
import LogoutButton from "@/components/LogoutButton"
import Footer from "@/components/layout/Footer"
import type { Session } from "next-auth"
import { useTheme } from "@/contexts/ThemeContext"

export type DrawerSection = "kanban" | "statistics" | "news" | "taskSettings" | "newsPreferences" | "profile"

interface DrawerNavigationProps {
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
  refreshTrigger?: number
  onTaskCreated?: () => void
  onTaskStatusChange?: (taskId: string, oldStatus: string, newStatus: string) => void
  availableTags: string[]
  availableStatuses?: string[]
  availablePriorities?: string[]
  availableTypes?: string[]
  availableTimeFrames?: string[]
  availableCategories?: string[]
  availableAssignees?: string[]
  laneType?: LaneType
  onLaneTypeChange?: (laneType: LaneType) => void
  onFilterChange?: (filters: {
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
  onCreateTask?: () => void
  session: Session
}

export default function DrawerNavigation({ 
  filters, 
  refreshTrigger, 
  onTaskCreated,
  onTaskStatusChange,
  availableTags,
  availableStatuses = [],
  availablePriorities = [],
  availableTypes = [],
  availableTimeFrames = [],
  availableCategories = [],
  availableAssignees = [],
  laneType,
  onLaneTypeChange,
  onFilterChange,
  onCreateTask,
  session
}: DrawerNavigationProps) {
  const { isDarkMode, isInitialized } = useTheme()
  const [activeSection, setActiveSection] = useState<DrawerSection>("kanban")
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [previousSection, setPreviousSection] = useState<DrawerSection>("kanban")
  
  // Handle loading state changes from DragDropKanban
  const handleLoadingChange = React.useCallback((loading: boolean) => {
    setIsPageLoading(loading)
  }, [])
  const profileDropdownRef = React.useRef<HTMLDivElement>(null)

  // Detect when returning from Task Settings to Kanban and trigger refresh
  React.useEffect(() => {
    if (previousSection === "taskSettings" && activeSection === "kanban") {
      // Trigger a refresh to reload configuration options
      if (onTaskCreated) {
        onTaskCreated()
      }
    }
    setPreviousSection(activeSection)
  }, [activeSection, previousSection, onTaskCreated])

  // Close profile dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showProfileDropdown])

  // Debounced create task handler to prevent double-clicking
  const handleCreateTask = React.useCallback(async () => {
    if (isCreatingTask || !onCreateTask) return
    
    setIsCreatingTask(true)
    try {
      await onCreateTask()
    } finally {
      // Add a small delay to prevent rapid successive clicks
      setTimeout(() => {
        setIsCreatingTask(false)
      }, 500)
    }
  }, [isCreatingTask, onCreateTask])

  const handleTagClick = React.useCallback(async (tag: string) => {
    if (onFilterChange) {
      // Add the clicked tag to the current tags filter
      const currentTags = filters?.tags || []
      const newTags = currentTags.includes(tag) 
        ? currentTags.filter(t => t !== tag) // Remove if already selected
        : [...currentTags, tag] // Add if not selected
      
      onFilterChange({
        ...filters,
        tags: newTags
      })
    }
  }, [onFilterChange, filters])

  const handleAssigneeClick = React.useCallback(async (assignee: string) => {
    if (onFilterChange) {
      // Set the clicked assignee as the filter
      const newAssignee = filters?.assignee === assignee ? "" : assignee // Toggle if same, set if different
      
      onFilterChange({
        ...filters,
        assignee: newAssignee
      })
    }
  }, [onFilterChange, filters])

  const handleTypeClick = React.useCallback((type: string) => {
    if (onFilterChange) {
      // Set the clicked type as the filter
      const newType = filters?.type === type ? "" : type // Toggle if same, set if different
      
      onFilterChange({
        ...filters,
        type: newType
      })
    }
  }, [onFilterChange, filters])

  const handleCategoryClick = React.useCallback(async (category: string) => {
    if (onFilterChange) {
      // Set the clicked category as the filter
      const newCategory = filters?.category === category ? "" : category // Toggle if same, set if different
      
      onFilterChange({
        ...filters,
        category: newCategory
      })
    }
  }, [onFilterChange, filters])

  const sections = [
    {
      id: "kanban" as DrawerSection,
      name: "Kanban Board",
      icon: "📊",
      color: "bg-blue-600",
      description: "Manage your tasks"
    },
    {
      id: "statistics" as DrawerSection,
      name: "Statistics",
      icon: "📈",
      color: "bg-green-600",
      description: "View analytics"
    },
    {
      id: "news" as DrawerSection,
      name: "Tech News",
      icon: "📰",
      color: "bg-purple-600",
      description: "Latest tech news & daily digest"
    }
  ]


  // No drawer resizing; using a top menu to maximize Kanban space

  const renderContent = () => {
    switch (activeSection) {
      case "kanban":
        return (
          <div className={`main-container min-h-full flex flex-col ${isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Kanban Toolbar - compact single row layout */}
            <div className={`sticky top-0 z-10 supports-[backdrop-filter]:backdrop-blur border-b ${
              isInitialized && isDarkMode 
                ? 'bg-gray-800/80 border-gray-700' 
                : 'bg-white/80 border-gray-200'
            }`}>
              <div className="p-2 lg:p-3">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 lg:gap-4">
                  {/* Left: Primary actions */}
                  <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                    {/* Create Task */}
                    <button
                      onClick={handleCreateTask}
                      disabled={isCreatingTask}
                      className={`inline-flex items-center gap-1 px-2 md:px-3 h-9 rounded-md transition-all duration-200 shadow-sm text-sm ${
                        isCreatingTask 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 hover:shadow'
                      } text-white`}
                      title={isCreatingTask ? "Creating task..." : "Create Task"}
                    >
                      {isCreatingTask ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                      <span className="hidden sm:inline text-sm">
                        {isCreatingTask ? 'Creating...' : 'Create'}
                      </span>
                    </button>

                    {/* Lane Switcher */}
                    {laneType && onLaneTypeChange && (
                      <LaneSwitcher 
                        currentLaneType={laneType}
                        onLaneTypeChange={onLaneTypeChange}
                      />
                    )}

                    {/* Filter toggle button */}
                    {onFilterChange && (
                      <button
                        onClick={() => setShowFilters(prev => !prev)}
                        className={`inline-flex items-center gap-1 px-2 h-9 border rounded-md text-sm transition-colors ${
                          showFilters 
                            ? isInitialized && isDarkMode
                              ? 'border-blue-600 bg-blue-900/50 text-blue-400'
                              : 'border-blue-300 bg-blue-50 text-blue-700'
                            : isInitialized && isDarkMode
                              ? 'border-gray-700 text-gray-400 hover:bg-gray-700'
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                        title="Toggle Filters"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 8h12m-9 4h6m-3 4h0" />
                        </svg>
                        <span className="text-sm">Filters</span>
                      </button>
                    )}
                  </div>

                </div>

                {/* Collapsible filters for all screen sizes */}
                {onFilterChange && showFilters && (
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <TaskFilter 
                      onFilterChange={onFilterChange}
                      availableTags={availableTags}
                      availableStatuses={availableStatuses}
                      availablePriorities={availablePriorities}
                      availableTypes={availableTypes}
                      availableTimeFrames={availableTimeFrames}
                      availableCategories={availableCategories}
                      availableAssignees={availableAssignees}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 min-h-0">
              <DragDropKanban
                refreshTrigger={refreshTrigger}
                filters={filters}
                onTaskCreated={onTaskCreated}
                onTaskStatusChange={onTaskStatusChange}
                laneType={laneType}
                onTagClick={handleTagClick}
                onAssigneeClick={handleAssigneeClick}
                onTypeClick={handleTypeClick}
                onCategoryClick={handleCategoryClick}
                onLoadingChange={handleLoadingChange}
              />
            </div>

            {/* Footer */}
            <Footer />
          </div>
        )
      case "statistics":
        return (
          <div className={`main-container min-h-full flex flex-col ${isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex-1">
              <StatisticsDashboard isOpen={true} onClose={() => {}} />
            </div>
            <Footer />
          </div>
        )
      case "news":
        return (
          <div className={`main-container min-h-full flex flex-col ${isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex-1">
              <NewsPage />
            </div>
            <Footer />
          </div>
        )
      case "taskSettings":
        return (
          <div className={`main-container min-h-full flex flex-col ${isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex-1">
              <Settings isOpen={true} onClose={() => {}} initialTab="statuses" />
            </div>
            <Footer />
          </div>
        )
      case "newsPreferences":
        return (
          <div className={`main-container min-h-full flex flex-col ${isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex-1">
              <Settings isOpen={true} onClose={() => {}} initialTab="newsRoles" />
            </div>
            <Footer />
          </div>
        )
      case "profile":
        return (
          <div className={`main-container min-h-full flex flex-col ${isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex-1">
              <Settings isOpen={true} onClose={() => {}} initialTab="profile" />
            </div>
            <Footer />
          </div>
        )
      default:
        return null
    }
  }

  // Use default light theme until initialized to prevent hydration mismatch
  const themeClasses = isInitialized 
    ? (isDarkMode ? 'bg-gray-900' : 'bg-gray-50')
    : 'bg-gray-50'

  return (
    <div className={`flex h-screen ${themeClasses}`}>
      {/* Full-width content with top menu */}
      <div className={`flex-1 flex flex-col min-w-0 ${themeClasses}`}>
        {/* Top menu bar - compact with visible menu items */}
        <div className={`sticky top-0 z-30 border-b px-2 py-1 flex items-center justify-between ${
          isInitialized && isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-1">
            {/* Visible menu items */}
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`inline-flex items-center gap-1 px-2 h-9 rounded-md transition-colors text-sm
                           ${activeSection === section.id 
                             ? isInitialized && isDarkMode 
                               ? 'bg-blue-900/50 text-blue-400 border border-blue-700' 
                               : 'bg-blue-100 text-blue-700 border border-blue-200'
                             : isInitialized && isDarkMode
                               ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                               : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                title={section.description}
              >
                <span className="text-sm">{section.icon}</span>
                <span className="hidden sm:inline text-sm font-medium">{section.name}</span>
              </button>
            ))}
          </div>

          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(prev => !prev)}
              className={`flex items-center gap-1 px-2 h-9 border rounded-md transition-colors shadow-sm text-sm ${
                isInitialized && isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="w-5 h-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {session.user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className={`text-sm hidden sm:block ${
                isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>{session.user?.email}</span>
              <svg 
                className={`w-3 h-3 text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showProfileDropdown && (
              <div className={`absolute top-full right-0 mt-1 w-56 rounded-md shadow-lg z-50 border ${
                isInitialized && isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="p-1">
                  <div className={`px-2 py-1 border-b mb-1 ${
                    isInitialized && isDarkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <div className={`text-xs font-medium truncate ${
                      isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>{session.user?.email}</div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false)
                      setActiveSection("taskSettings")
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors ${
                      isInitialized && isDarkMode
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <svg className={`w-4 h-4 ${
                      isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className={`text-sm ${
                      isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>Task Settings</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false)
                      setActiveSection("newsPreferences")
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors ${
                      isInitialized && isDarkMode
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <svg className={`w-4 h-4 ${
                      isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <span className={`text-sm ${
                      isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>News Preferences</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false)
                      setActiveSection("profile")
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors ${
                      isInitialized && isDarkMode
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <svg className={`w-4 h-4 ${
                      isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className={`text-sm ${
                      isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>Profile & Security</span>
                  </button>
                  
                  <div className={`border-t mt-1 pt-1 ${
                    isInitialized && isDarkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <a
                      href="/api-docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors ${
                        isInitialized && isDarkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <svg className={`w-4 h-4 ${
                        isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className={`text-sm ${
                        isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>API Docs</span>
                      <svg className="w-3 h-3 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  
                  <div className={`border-t mt-1 pt-1 ${
                    isInitialized && isDarkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <div className="px-2 py-1">
                      <LogoutButton />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto mobile-scroll-container pb-4 relative">
          {renderContent()}
          
          {/* Page Loading Overlay */}
          {isPageLoading && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
              <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
                isInitialized && isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className={`text-sm font-medium ${
                  isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  loading...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
