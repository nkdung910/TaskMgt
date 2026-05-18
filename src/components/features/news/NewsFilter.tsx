"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/contexts/ThemeContext"

interface NewsFilterProps {
  onFilterChange: (filters: {
    search?: string
    category?: string
    source?: string
    tags?: string[]
  }) => void
  currentFilters?: {
    search?: string
    category?: string
    source?: string
    tags?: string[]
  }
}

export default function NewsFilter({ onFilterChange, currentFilters }: NewsFilterProps) {
  const { isDarkMode, isInitialized } = useTheme()
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSource, setSelectedSource] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const isInitialMount = useRef(true)

  // Sync internal state with current filters prop
  useEffect(() => {
    if (currentFilters) {
      setSearch(currentFilters.search || "")
      setSelectedCategory(currentFilters.category || "")
      setSelectedSource(currentFilters.source || "")
      setSelectedTags(currentFilters.tags || [])
    }
  }, [currentFilters])

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [sourcesRes, categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/news/sources'),
          fetch('/api/news/categories'),
          fetch('/api/news/tags')
        ])

        if (sourcesRes.ok) {
          const sourcesData = await sourcesRes.json()
          setSources(sourcesData.sources || [])
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.categories || [])
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json()
          setTags(tagsData.tags || [])
        }
      } catch (error) {
        console.error("Error fetching filter options:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFilterOptions()
  }, [])

  // Update filters when any filter changes
  useEffect(() => {
    // Skip the initial mount to prevent unnecessary calls
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    onFilterChange({
      search: search || undefined,
      category: selectedCategory || undefined,
      source: selectedSource || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory, selectedSource, selectedTags])

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSearch("")
    setSelectedCategory("")
    setSelectedSource("")
    setSelectedTags([])
  }

  const hasActiveFilters = search || selectedCategory || selectedSource || selectedTags.length > 0

  if (loading) {
    return (
      <div className={`p-4 rounded-lg border-2 ${
        isInitialized && isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="animate-pulse flex gap-2">
          <div className={`h-10 rounded w-64 ${
            isInitialized && isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
          <div className={`h-10 rounded w-32 ${
            isInitialized && isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border-2 ${
      isInitialized && isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Main Filter Bar */}
      <div className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Bar */}
          <div className="flex-1 min-w-[280px]">
            <div className="relative">
              <svg 
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-all ${
                  isInitialized && isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20'
                    : 'bg-purple-50 border-purple-200 text-gray-900 placeholder-purple-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20'
                } focus:outline-none`}
              />
            </div>
          </div>

          {/* Quick Category Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {categories.slice(0, 3).map((category, index) => {
              const pastelColors = [
                { bg: 'bg-blue-100', hoverBg: 'hover:bg-blue-200', activeBg: 'bg-blue-400', text: 'text-blue-700', activeText: 'text-white' },
                { bg: 'bg-pink-100', hoverBg: 'hover:bg-pink-200', activeBg: 'bg-pink-400', text: 'text-pink-700', activeText: 'text-white' },
                { bg: 'bg-green-100', hoverBg: 'hover:bg-green-200', activeBg: 'bg-green-400', text: 'text-green-700', activeText: 'text-white' }
              ]
              const colorScheme = pastelColors[index % 3]
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? `${colorScheme.activeBg} ${colorScheme.activeText} shadow-md`
                      : isInitialized && isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : `${colorScheme.bg} ${colorScheme.text} ${colorScheme.hoverBg}`
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              isInitialized && isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            }`}
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            More
          </button>

          {/* Clear All - Only show if filters are active */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                isInitialized && isDarkMode
                  ? 'text-red-400 hover:bg-red-900/20'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t-2 border-gray-200 dark:border-gray-700">
            {selectedCategory && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                isInitialized && isDarkMode
                  ? 'bg-blue-900/30 text-blue-300'
                  : 'bg-blue-200 text-blue-800'
              }`}>
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('')}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            {selectedSource && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                isInitialized && isDarkMode
                  ? 'bg-green-900/30 text-green-300'
                  : 'bg-green-200 text-green-800'
              }`}>
                Source: {selectedSource}
                <button
                  onClick={() => setSelectedSource('')}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  isInitialized && isDarkMode
                    ? 'bg-purple-900/30 text-purple-300'
                    : 'bg-purple-200 text-purple-800'
                }`}
              >
                #{tag}
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters Dropdown */}
      {showAdvanced && (
        <div className={`border-t-2 p-4 space-y-4 ${
          isInitialized && isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {/* All Categories */}
          {categories.length > 3 && (
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${
                isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                All Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                  key={category}
                  onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-blue-400 text-white shadow-md'
                      : isInitialized && isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${
              isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Sources
            </label>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => (
                <button
                key={source}
                onClick={() => setSelectedSource(selectedSource === source ? '' : source)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedSource === source
                    ? 'bg-green-400 text-white shadow-md'
                    : isInitialized && isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${
              isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Tags
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {tags.map((tag) => (
                <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                title={tag} // Show full tag text on hover
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all max-w-24 truncate block overflow-hidden text-ellipsis whitespace-nowrap ${
                  selectedTags.includes(tag)
                    ? 'bg-purple-400 text-white shadow-md'
                    : isInitialized && isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
