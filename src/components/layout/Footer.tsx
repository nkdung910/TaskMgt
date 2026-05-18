"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { formatDateDDMMYYYY } from "@/lib/utils"
import { APP_VERSION, APP_NAME } from "@/lib/version"
import Link from "next/link"

export default function Footer() {
  const [lastUpdated, setLastUpdated] = useState("")
  const { isDarkMode, isInitialized } = useTheme()

  useEffect(() => {
    setLastUpdated(formatDateDDMMYYYY(new Date()))
  }, [])

  return (
    <footer className={`mt-auto border-t ${
      isInitialized && isDarkMode 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className={`flex flex-row items-center justify-between gap-3 text-xs ${
          isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`font-semibold text-sm ${
              isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>{APP_NAME}</span>
            <span className="hidden sm:inline">v{APP_VERSION}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              className={`hover:underline ${
                isInitialized && isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              📚 Docs
            </Link>
            <Link
              href="/api-docs"
              className={`hover:underline ${
                isInitialized && isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              API
            </Link>
            {lastUpdated && <span className="hidden sm:inline">{lastUpdated}</span>}
          </div>
        </div>
      </div>
    </footer>
  )
}
