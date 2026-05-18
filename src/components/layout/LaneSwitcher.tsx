"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/contexts/ThemeContext"

export type LaneType = "status" | "priority" | "type" | "time" | "category" | "assignee"

interface LaneSwitcherProps {
  currentLaneType: LaneType
  onLaneTypeChange: (laneType: LaneType) => void
}

  const laneTypes = [
    {
      id: "status" as LaneType,
      name: "Workflow",
      description: "Group by workflow status",
      icon: "📊",
      color: "bg-blue-50 border-blue-200 text-blue-700",
      darkColor: "bg-blue-900/30 border-blue-700 text-blue-300"
    },
    {
      id: "priority" as LaneType,
      name: "Priority",
      description: "Group by task priority",
      icon: "⚡",
      color: "bg-red-50 border-red-200 text-red-700",
      darkColor: "bg-red-900/30 border-red-700 text-red-300"
    },
    {
      id: "type" as LaneType,
      name: "Type",
      description: "Group by task type",
      icon: "🎯",
      color: "bg-green-50 border-green-200 text-green-700",
      darkColor: "bg-green-900/30 border-green-700 text-green-300"
    },
    {
      id: "time" as LaneType,
      name: "Time",
      description: "Group by time frame",
      icon: "⏰",
      color: "bg-yellow-50 border-yellow-200 text-yellow-700",
      darkColor: "bg-yellow-900/30 border-yellow-700 text-yellow-300"
    },
    {
      id: "category" as LaneType,
      name: "Category",
      description: "Group by task category",
      icon: "🏷️",
      color: "bg-purple-50 border-purple-200 text-purple-700",
      darkColor: "bg-purple-900/30 border-purple-700 text-purple-300"
    },
    {
      id: "assignee" as LaneType,
      name: "Assignee",
      description: "Group by assigned person",
      icon: "👤",
      color: "bg-indigo-50 border-indigo-200 text-indigo-700",
      darkColor: "bg-indigo-900/30 border-indigo-700 text-indigo-300"
    }
  ]

export default function LaneSwitcher({ currentLaneType, onLaneTypeChange }: LaneSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { isDarkMode, isInitialized } = useTheme()

  const currentLane = laneTypes.find(lane => lane.id === currentLaneType)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-2 h-9 border rounded-md transition-colors shadow-sm text-sm ${
          isInitialized && isDarkMode 
            ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' 
            : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}
      >
        <span className="text-sm">{currentLane?.icon}</span>
        <div className="text-left">
          <div className={`font-medium text-sm ${
            isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>{currentLane?.name}</div>
          <div className={`text-xs hidden sm:block ${
            isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>{currentLane?.description}</div>
        </div>
        <svg 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''} ${
            isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-400'
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-56 border rounded-md shadow-lg z-50 ${
          isInitialized && isDarkMode 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="p-1">
            {laneTypes.map((lane) => (
              <button
                key={lane.id}
                onClick={() => {
                  onLaneTypeChange(lane.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                  currentLaneType === lane.id 
                    ? (isInitialized && isDarkMode ? lane.darkColor : lane.color)
                    : (isInitialized && isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')
                }`}
              >
                <span className="text-sm">{lane.icon}</span>
                <div className="text-left">
                  <div className={`font-medium text-sm ${
                    currentLaneType === lane.id 
                      ? (isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900')
                      : (isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900')
                  }`}>{lane.name}</div>
                  <div className={`text-xs ${
                    isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>{lane.description}</div>
                </div>
                {currentLaneType === lane.id && (
                  <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
