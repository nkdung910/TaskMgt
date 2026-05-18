"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  toggleTheme: () => void
  isInitialized: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize theme from localStorage after hydration
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    setIsDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark))
    setIsInitialized(true)
  }, [])

  // Apply theme to document after initialization
  useEffect(() => {
    if (isInitialized) {
      document.documentElement.className = isDarkMode ? 'dark' : 'light'
      document.body.className = isDarkMode ? 'dark' : 'light'
    }
  }, [isDarkMode, isInitialized])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('app-theme', newTheme ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, isInitialized }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

