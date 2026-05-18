"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/contexts/ThemeContext"

interface CalendarProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showTimePicker?: boolean
  minDate?: string
  maxDate?: string
  calendarOnly?: boolean
  compact?: boolean
  height?: string
}

export default function Calendar({
  value = "",
  onChange,
  placeholder = "Select date",
  disabled = false,
  className = "",
  showTimePicker = false,
  minDate,
  maxDate,
  calendarOnly = false,
  compact = false,
  height = "h-9"
}: CalendarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null)
  const [displayValue, setDisplayValue] = useState("")
  const [isCalendarVisible, setIsCalendarVisible] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const { isDarkMode, isInitialized } = useTheme()

  // Helper function for quick action button styling
  const getQuickActionStyles = (color: string) => {
    if (isInitialized && isDarkMode) {
      switch (color) {
        case 'blue': return 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/40'
        case 'green': return 'bg-green-900/30 text-green-300 hover:bg-green-800/40'
        case 'purple': return 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40'
        case 'orange': return 'bg-orange-900/30 text-orange-300 hover:bg-orange-800/40'
        case 'gray': return 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        default: return 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }
    } else {
      switch (color) {
        case 'blue': return 'bg-blue-50 text-blue-700 hover:bg-blue-100'
        case 'green': return 'bg-green-50 text-green-700 hover:bg-green-100'
        case 'purple': return 'bg-purple-50 text-purple-700 hover:bg-purple-100'
        case 'orange': return 'bg-orange-50 text-orange-700 hover:bg-orange-100'
        case 'gray': return 'bg-gray-50 text-gray-700 hover:bg-gray-100'
        default: return 'bg-gray-50 text-gray-700 hover:bg-gray-100'
      }
    }
  }

  // Initialize currentMonth on client side to avoid hydration mismatch
  useEffect(() => {
    if (!currentMonth) {
      setCurrentMonth(new Date())
    }
  }, [currentMonth])

  // Handle value changes
  useEffect(() => {
    if (value) {
      let date: Date
      
      // Handle different date formats
      if (value.includes('T')) {
        // ISO format with time: "YYYY-MM-DDTHH:mm"
        const [datePart, timePart] = value.split('T')
        const dateParts = datePart.split('-')
        const year = parseInt(dateParts[0])
        const month = parseInt(dateParts[1]) - 1 // JavaScript months are 0-based
        const day = parseInt(dateParts[2])
        
        const [hours, minutes] = timePart.split(':').map(Number)
        date = new Date(year, month, day, hours, minutes)
      } else {
        // Date only format: "YYYY-MM-DD"
        const dateParts = value.split('-')
        const year = parseInt(dateParts[0])
        const month = parseInt(dateParts[1]) - 1 // JavaScript months are 0-based
        const day = parseInt(dateParts[2])
        date = new Date(year, month, day)
      }
      
      setSelectedDate(date)
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))
      setDisplayValue(formatDisplayDate(date, showTimePicker))
    } else {
      setSelectedDate(null)
      setDisplayValue("")
    }
  }, [value, showTimePicker])

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsCalendarVisible(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const formatDisplayDate = (date: Date, includeTime: boolean = false): string => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    
    if (includeTime) {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    }
    
    return `${day}/${month}/${year}`
  }

  const formatDateForInput = (date: Date, includeTime: boolean = false): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    
    if (includeTime) {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }
    return `${year}-${month}-${day}` // YYYY-MM-DD in local timezone
  }

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  interface DayInfo {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    isSelected: boolean
    isDisabled: boolean
  }

  const getDaysArray = (): (Date | null)[] => {
    if (!currentMonth) return []
    const days: (Date | null)[] = []
    const firstDay = getFirstDayOfMonth(currentMonth)
    const daysInMonth = getDaysInMonth(currentMonth)

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
    }

    return days
  }

  const getDaysArrayWithInfo = (): DayInfo[] => {
    if (!currentMonth) return []
    const days: DayInfo[] = []
    const firstDay = getFirstDayOfMonth(currentMonth)
    const daysInMonth = getDaysInMonth(currentMonth)

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 0)
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - firstDay + i + 1)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isToday(date),
        isSelected: isSelected(date),
        isDisabled: isDateDisabled(date)
      })
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isToday(date),
        isSelected: isSelected(date),
        isDisabled: isDateDisabled(date)
      })
    }

    return days
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  const isDateDisabled = (date: Date): boolean => {
    if (minDate) {
      // Parse minDate manually to avoid timezone issues
      const dateParts = minDate.split('-')
      const year = parseInt(dateParts[0])
      const month = parseInt(dateParts[1]) - 1 // JavaScript months are 0-based
      const day = parseInt(dateParts[2])
      const min = new Date(year, month, day)
      if (date < min) return true
    }
    if (maxDate) {
      // Parse maxDate manually to avoid timezone issues
      const dateParts = maxDate.split('-')
      const year = parseInt(dateParts[0])
      const month = parseInt(dateParts[1]) - 1 // JavaScript months are 0-based
      const day = parseInt(dateParts[2])
      const max = new Date(year, month, day)
      if (date > max) return true
    }
    return false
  }

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return

    setSelectedDate(date)
    const formattedDate = formatDateForInput(date, showTimePicker)
    onChange?.(formattedDate)
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    if (!currentMonth) return
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    if (!currentMonth) return
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleToday = () => {
    const today = new Date()
    if (!isDateDisabled(today)) {
      handleDateSelect(today)
    }
  }

  const handleTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (!isDateDisabled(tomorrow)) {
      handleDateSelect(tomorrow)
    }
  }

  const handleNextWeek = () => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    if (!isDateDisabled(nextWeek)) {
      handleDateSelect(nextWeek)
    }
  }

  const handleQuickNextMonth = () => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    if (!isDateDisabled(nextMonth)) {
      handleDateSelect(nextMonth)
    }
  }

  const handleThisWeekend = () => {
    const today = new Date()
    const daysUntilSaturday = 6 - today.getDay()
    const saturday = new Date(today)
    saturday.setDate(today.getDate() + daysUntilSaturday)
    if (!isDateDisabled(saturday)) {
      handleDateSelect(saturday)
    }
  }

  const handleClear = () => {
    setSelectedDate(null)
    setDisplayValue("")
    onChange?.("")
    setIsOpen(false)
  }

  const days = calendarOnly ? getDaysArrayWithInfo() : getDaysArray()
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Calendar-only mode: Show compact calendar with toggle
  if (calendarOnly) {
    // Show loading state until currentMonth is initialized
    if (!currentMonth) {
      return (
        <div className={`relative ${className}`}>
          <div className={`flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl ${height} bg-gray-50`}>
            <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
          </div>
        </div>
      )
    }
    
    return (
      <div className={`relative ${className}`} ref={calendarRef}>
        {/* Enhanced Calendar Toggle */}
        <div className={`border-2 rounded-xl shadow-sm transition-colors ${
          isInitialized && isDarkMode 
            ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}>
          {/* Enhanced header with date display and toggle */}
          <div 
            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors rounded-xl ${height} ${
              isInitialized && isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'
            }`}
            onClick={() => !disabled && setIsCalendarVisible(!isCalendarVisible)}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${
                isInitialized && isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
              }`}>
                <svg className={`w-4 h-4 ${
                  isInitialized && isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className={`text-sm font-medium ${
                displayValue 
                  ? (isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900')
                  : (isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500')
              }`}>
                {displayValue || placeholder}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedDate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Clear date"
                >
                  <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <div className="p-1 bg-gray-100 rounded-lg">
                <svg 
                  className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isCalendarVisible ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Enhanced Collapsible Calendar */}
          {isCalendarVisible && (
            <div className={`absolute top-full left-0 mt-2 border-2 rounded-xl shadow-xl z-50 min-w-[320px] ${
              isInitialized && isDarkMode 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-2">
                {/* Enhanced Month Navigation */}
                <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrevMonth()
                  }}
                  disabled={disabled}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isInitialized && isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                  }`}
                >
                  <svg className={`w-4 h-4 ${
                    isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className={`font-semibold text-sm ${
                  isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {currentMonth ? `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}` : ''}
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNextMonth()
                  }}
                  disabled={disabled}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isInitialized && isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                  }`}
                >
                  <svg className={`w-4 h-4 ${
                    isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Enhanced Quick Actions - Only show if not in compact mode */}
              {!compact && (
                <div className="mb-3">
                  <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                    isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Quick Select</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToday()
                        setIsCalendarVisible(false)
                      }}
                      disabled={disabled}
                      className={`px-2 py-1.5 text-xs rounded-md transition-colors text-left disabled:opacity-50 ${getQuickActionStyles('blue')}`}
                    >
                      <div className="font-medium">Today</div>
                      <div className={`text-xs opacity-75 ${
                        isInitialized && isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>{new Date().toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTomorrow()
                        setIsCalendarVisible(false)
                      }}
                      disabled={disabled}
                      className={`px-2 py-1.5 text-xs rounded-md transition-colors text-left disabled:opacity-50 ${getQuickActionStyles('green')}`}
                    >
                      <div className="font-medium">Tomorrow</div>
                      <div className={`text-xs opacity-75 ${
                        isInitialized && isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleThisWeekend()
                        setIsCalendarVisible(false)
                      }}
                      disabled={disabled}
                      className={`px-2 py-1.5 text-xs rounded-md transition-colors text-left disabled:opacity-50 ${getQuickActionStyles('purple')}`}
                    >
                      <div className="font-medium">This Weekend</div>
                      <div className={`text-xs opacity-75 ${
                        isInitialized && isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      }`}>Saturday</div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNextWeek()
                        setIsCalendarVisible(false)
                      }}
                      disabled={disabled}
                      className={`px-2 py-1.5 text-xs rounded-md transition-colors text-left disabled:opacity-50 ${getQuickActionStyles('orange')}`}
                    >
                      <div className="font-medium">Next Week</div>
                      <div className={`text-xs opacity-75 ${
                        isInitialized && isDarkMode ? 'text-orange-400' : 'text-orange-600'
                      }`}>+7 days</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Enhanced Day Headers */}
              <div className="grid grid-cols-7 gap-0 mb-2">
                {dayNames.map(day => (
                  <div key={day} className={`text-xs font-medium text-center py-1 ${
                    isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {day.charAt(0)}
                  </div>
                ))}
              </div>

              {/* Enhanced Calendar Grid */}
              <div className="grid grid-cols-7 gap-0">
                {(days as DayInfo[]).map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDateSelect(day.date)
                        setIsCalendarVisible(false)
                      }}
                    disabled={disabled || day.isDisabled}
                    className={`
                      w-7 h-7 text-xs font-medium rounded-lg transition-all duration-200
                      ${!day.isCurrentMonth && !day.isDisabled ? (isInitialized && isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700') : ''}
                      ${day.isDisabled ? (isInitialized && isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed') : (isInitialized && isDarkMode ? 'hover:bg-gray-600 hover:scale-105' : 'hover:bg-gray-100 hover:scale-105')}
                      ${day.isToday ? (isInitialized && isDarkMode ? 'bg-blue-900/50 text-blue-300 font-bold ring-1 ring-blue-700' : 'bg-blue-100 text-blue-700 font-bold ring-1 ring-blue-200') : ''}
                      ${day.isSelected ? 'bg-blue-600 text-white font-bold shadow-md' : ''}
                      ${day.isCurrentMonth && !day.isDisabled && !day.isSelected && !day.isToday ? (isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-700') : ''}
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                ))}
              </div>

              {/* Compact Actions - Only show Today and Clear in compact mode */}
              {compact && (
                <div className={`mt-2 pt-2 border-t ${
                  isInitialized && isDarkMode ? 'border-gray-600' : 'border-gray-100'
                }`}>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        handleToday()
                        setIsCalendarVisible(false)
                      }}
                      disabled={disabled}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-colors disabled:opacity-50 ${getQuickActionStyles('blue')}`}
                    >
                      Today
                    </button>
                    {selectedDate && (
                      <button
                        onClick={() => {
                          handleClear()
                          setIsCalendarVisible(false)
                        }}
                        disabled={disabled}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-colors disabled:opacity-50 ${getQuickActionStyles('gray')}`}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Clear Action - Only show in non-compact mode */}
              {!compact && selectedDate && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      handleClear()
                      setIsCalendarVisible(false)
                    }}
                    disabled={disabled}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show loading state until currentMonth is initialized
  if (!currentMonth) {
    return (
      <div className={`relative ${className}`}>
        <input
          type="text"
          value="Loading..."
          disabled
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400"
          placeholder={placeholder}
        />
      </div>
    )
  }
  
  return (
    <div className={`relative ${className}`} ref={calendarRef}>
      {/* Input Field */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 border-2 rounded-xl cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-all duration-200
          ${isInitialized && isDarkMode 
            ? 'border-gray-600 bg-gray-700 text-gray-100' 
            : 'border-gray-200 text-gray-900'
          }
          ${disabled ? (isInitialized && isDarkMode ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-500 cursor-not-allowed') : (isInitialized && isDarkMode ? 'hover:border-gray-500' : 'hover:border-gray-300')}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={displayValue 
            ? (isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900')
            : (isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500')
          }>
            {displayValue || placeholder}
          </span>
          <div className="flex items-center gap-2">
            {selectedDate && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className={`p-1 rounded-full transition-colors ${
                  isInitialized && isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                }`}
                title="Clear date"
              >
                <svg className={`w-4 h-4 ${
                  isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <svg className={`w-5 h-5 ${
              isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className={`absolute bottom-full left-0 mb-2 border-2 rounded-xl shadow-xl z-50 min-w-[380px] ${
          isInitialized && isDarkMode 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className={`p-4 border-b ${
            isInitialized && isDarkMode ? 'border-gray-600' : 'border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrevMonth()
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isInitialized && isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                }`}
              >
                <svg className={`w-5 h-5 ${
                  isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h3 className={`text-lg font-semibold ${
                isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {currentMonth ? `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}` : ''}
              </h3>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleNextMonth()
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isInitialized && isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                }`}
              >
                <svg className={`w-5 h-5 ${
                  isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Quick Select</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToday()
                  }}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-left"
                >
                  <div className="font-medium">Today</div>
                  <div className="text-xs text-blue-600">{new Date().toLocaleDateString('en-US', { weekday: 'short' })}</div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTomorrow()
                  }}
                  className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-left"
                >
                  <div className="font-medium">Tomorrow</div>
                  <div className="text-xs text-green-600">
                    {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleThisWeekend()
                  }}
                  className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-left"
                >
                  <div className="font-medium">This Weekend</div>
                  <div className="text-xs text-purple-600">Saturday</div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNextWeek()
                  }}
                  className="px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-left"
                >
                  <div className="font-medium">Next Week</div>
                  <div className="text-xs text-orange-600">+7 days</div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQuickNextMonth()
                  }}
                  className="px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-left"
                >
                  <div className="font-medium">Next Month</div>
                  <div className="text-xs text-indigo-600">+30 days</div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const nextFriday = new Date()
                    const daysUntilFriday = (5 - nextFriday.getDay() + 7) % 7
                    const friday = new Date(nextFriday)
                    friday.setDate(nextFriday.getDate() + (daysUntilFriday || 7))
                    if (!isDateDisabled(friday)) {
                      handleDateSelect(friday)
                    }
                  }}
                  className="px-3 py-2 text-sm bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors text-left"
                >
                  <div className="font-medium">Next Friday</div>
                  <div className="text-xs text-teal-600">End of week</div>
                </button>
              </div>
              {selectedDate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                  className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 p-2 bg-gray-50">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {(days as (Date | null)[]).map((date, index) => (
              <div key={index} className="aspect-square">
                {date ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDateSelect(date)
                    }}
                    disabled={isDateDisabled(date)}
                    className={`
                      w-full h-full rounded-lg text-sm font-medium transition-all duration-200
                      ${isSelected(date) 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : isToday(date)
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : isDateDisabled(date)
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    {date.getDate()}
                  </button>
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
            ))}
          </div>

          {/* Time Picker (if enabled) */}
          {showTimePicker && selectedDate && (
            <div className="p-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                value={selectedDate.toTimeString().slice(0, 5)}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':')
                  const newDate = new Date(selectedDate)
                  newDate.setHours(parseInt(hours), parseInt(minutes))
                  setSelectedDate(newDate)
                  onChange?.(formatDateForInput(newDate, true))
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
