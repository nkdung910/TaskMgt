"use client"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import NewsArticleCard from "./NewsArticleCard"
import NewsFilter from "./NewsFilter"
import DailyDigest from "./DailyDigest"
import { showToast } from "@/lib/utils"

interface NewsArticle {
  id: string
  title: string
  content: string
  summary?: string
  url: string
  source: string
  author?: string
  publishedAt: Date
  relevanceScore?: number
  tags: string[]
  category?: string
  imageUrl?: string
  isBookmarked?: boolean
}

interface NewsPageProps {
  initialView?: 'all' | 'bookmarks' | 'digest'
}

export default function NewsPage({ initialView = 'all' }: NewsPageProps) {
  const { isDarkMode, isInitialized } = useTheme()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'all' | 'bookmarks' | 'digest'>(initialView)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    source: '',
    tags: [] as string[]
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })
  const [isAutoFetching, setIsAutoFetching] = useState(false)

  // Fetch articles based on current view and filters
  const fetchArticles = async (page = 1, reset = false) => {
    // Skip fetching for digest view - it has its own component
    if (currentView === 'digest') {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      let url = ''
      const params = new URLSearchParams()

      if (currentView === 'bookmarks') {
        url = '/api/news/bookmarks'
      } else {
        url = '/api/news'
        params.append('limit', pagination.limit.toString())
        params.append('offset', ((page - 1) * pagination.limit).toString())
        
        if (filters.search) params.append('search', filters.search)
        if (filters.category) params.append('category', filters.category)
        if (filters.source) params.append('source', filters.source)
        if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','))
      }

      const response = await fetch(`${url}?${params.toString()}`)
      const data = await response.json()

      if (data.error) {
        showToast.error(data.error)
        return
      }

      if (reset) {
        setArticles(data.articles || [])
      } else {
        setArticles(prev => [...prev, ...(data.articles || [])])
      }

      if (data.total !== undefined) {
        setPagination(prev => ({ ...prev, total: data.total }))
      }

      setPagination(prev => ({ ...prev, page }))
    } catch (error) {
      console.error("Error fetching articles:", error)
      showToast.error("Failed to fetch articles")
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch news if empty or stale (with time-based re-check)
  const autoFetchNews = async () => {
    if (isAutoFetching) return // Prevent concurrent fetches

    try {
      setIsAutoFetching(true)
      
      // Get the last fetch timestamp from localStorage
      const lastFetchKey = 'news_last_fetch_timestamp'
      const lastFetchTime = localStorage.getItem(lastFetchKey)
      const now = Date.now()
      const oneHourInMs = 60 * 60 * 1000 // Reduced to 1 hour for more frequent updates
      
      // Check if we should fetch based on time elapsed since last fetch
      const shouldFetchBasedOnTime = !lastFetchTime || (now - parseInt(lastFetchTime)) > oneHourInMs
      
      // Check if we need to fetch news
      const response = await fetch('/api/news?limit=1')
      const data = await response.json()
      
      const hasArticles = data.articles && data.articles.length > 0
      
      if (!hasArticles) {
        // No articles at all - fetch from RSS feeds with user feedback
        console.log('📰 No articles found - fetching from RSS feeds...')
        showToast.info('Loading latest news articles...')
        
        // Fetch and save articles from RSS feeds
        const fetchResponse = await fetch('/api/admin/news/fetch', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        const fetchData = await fetchResponse.json()
        
        if (fetchData.success && fetchData.processed > 0) {
          console.log(`✅ Fetched ${fetchData.processed} new articles`)
          showToast.success(`Loaded ${fetchData.processed} fresh articles`)
          // Update last fetch timestamp
          localStorage.setItem(lastFetchKey, now.toString())
          // Refresh the articles list
          await fetchArticles(1, true)
        }
      } else if (shouldFetchBasedOnTime) {
        // It's been more than 1 hour since last fetch - get fresh news
        console.log('🔄 Fetching fresh news (1+ hour since last update)...')
        showToast.info('Checking for new articles...')
        
        // Fetch new ones in background
        fetch('/api/admin/news/fetch', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.processed > 0) {
              console.log(`✅ Fetched ${data.processed} new articles`)
              showToast.success(`Found ${data.processed} new articles!`)
              // Update last fetch timestamp
              localStorage.setItem(lastFetchKey, now.toString())
              // Refresh articles to show new content
              fetchArticles(1, true)
            } else {
              console.log('ℹ️ No new articles available')
            }
          })
          .catch((error) => {
            console.error('Background fetch error:', error)
            // Silent fail for background update
          })
      } else {
        const minutesAgo = Math.round((now - parseInt(lastFetchTime || '0')) / 60000)
        console.log(`✓ Articles are fresh (last updated ${minutesAgo} minutes ago)`)
      }
    } catch (error) {
      console.error('Auto-fetch error:', error)
      // Silent fail - don't bother user with errors
    } finally {
      setIsAutoFetching(false)
    }
  }

  // Load more articles
  const loadMore = () => {
    if (!loading && currentView === 'all') {
      fetchArticles(pagination.page + 1, false)
    }
  }

  // Auto-fetch on mount (checks every time page loads)
  useEffect(() => {
    if (currentView === 'all') {
      autoFetchNews()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView])

  // Refresh articles when view changes
  useEffect(() => {
    setArticles([])
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchArticles(1, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView])

  // Refresh articles when filters change
  useEffect(() => {
    if (currentView === 'all') {
      setArticles([])
      setPagination(prev => ({ ...prev, page: 1 }))
      fetchArticles(1, true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Handle bookmark changes
  const handleBookmarkChange = () => {
    if (currentView === 'bookmarks') {
      fetchArticles(1, true)
    }
  }

  // Stable callback for filter changes
  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const hasMoreArticles = currentView === 'all' && articles.length < pagination.total

  return (
    <div className={`min-h-screen ${
      isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${
            isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Tech News
          </h1>
          <p className={`text-lg ${
            isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Stay updated with the latest technology news and insights
          </p>
        </div>

        {/* View Tabs */}
        <div className="mb-6">
          <div className={`flex space-x-1 p-1 rounded-lg ${
            isInitialized && isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            {[
              { key: 'all', label: 'All News', icon: '📰' },
              { key: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
              { key: 'digest', label: 'Daily Digest', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key as 'all' | 'bookmarks' | 'digest')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  currentView === tab.key
                    ? isInitialized && isDarkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isInitialized && isDarkMode
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {currentView === 'digest' ? (
          <DailyDigest />
        ) : (
          <>
            {/* Filters */}
            {currentView === 'all' && (
              <div className="mb-8">
                <NewsFilter 
                  onFilterChange={handleFilterChange} 
                  currentFilters={filters}
                />
              </div>
            )}

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {articles.map((article) => (
                <NewsArticleCard
                  key={article.id}
                  article={article}
                  onBookmarkChange={handleBookmarkChange}
                />
              ))}
            </div>
          </>
        )}

        {/* Loading State */}
        {currentView !== 'digest' && loading && (
          <div className="flex justify-center py-8">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
              isInitialized && isDarkMode ? 'border-blue-400' : 'border-blue-600'
            }`}></div>
          </div>
        )}

        {/* Load More Button */}
        {currentView !== 'digest' && hasMoreArticles && !loading && (
          <div className="text-center">
            <button
              onClick={loadMore}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isInitialized && isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Load More Articles
            </button>
          </div>
        )}

        {/* Empty State */}
        {currentView !== 'digest' && !loading && articles.length === 0 && (
          <div className="text-center py-12">
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isInitialized && isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`}>
              <span className="text-4xl">📰</span>
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${
              isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {currentView === 'bookmarks' ? 'No Bookmarked Articles' : 'No Articles Found'}
            </h3>
            <p className={`${
              isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {currentView === 'bookmarks' ? 'Start bookmarking articles to see them here' :
               'Try adjusting your filters or check back later for new articles'}
            </p>
          </div>
        )}

        {/* Pagination Info */}
        {currentView === 'all' && articles.length > 0 && (
          <div className={`text-center text-sm ${
            isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Showing {articles.length} of {pagination.total} articles
          </div>
        )}
      </div>
    </div>
  )
}
