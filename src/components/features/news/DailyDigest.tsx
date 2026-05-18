"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/contexts/ThemeContext"
// import { showToast } from "@/lib/utils"
import { formatDateDDMMYYYY } from "@/lib/utils"

interface DigestArticle {
  id: string
  title: string
  summary: string
  url: string
  source: string
  publishedAt: string
  category: string
  tags: string[]
  relevanceScore: number
}

interface DailyDigest {
  id: string
  date: string
  articles: DigestArticle[]
  summary: string
  categories: string[]
  totalArticles: number
  createdAt: string
}

export default function DailyDigest() {
  const { isDarkMode, isInitialized } = useTheme()
  const [digests, setDigests] = useState<DailyDigest[]>([]) // All digests
  const [isLoading, setIsLoading] = useState(false)
  // const [availableDates, setAvailableDates] = useState<string[]>([])
  const hasLoadedDates = useRef(false)
  const autoGenerateAttempted = useRef(false)
  const lastCheckTimestamp = useRef<number>(0)

  // Load all articles from recent days (no grouping by date)
  const loadAllArticles = async (dates: string[]) => {
    if (dates.length === 0) return

    setIsLoading(true)
    try {
      console.log(`📚 Loading articles from ${dates.length} days...`)
      
      // Load digests in parallel (limit to last 7 days for performance)
      const datesToLoad = dates.slice(0, 7)
      const digestPromises = datesToLoad.map(date =>
        fetch(`/api/news/digest?date=${encodeURIComponent(date)}`)
          .then(res => res.json())
          .then(data => data.success && data.digest ? data.digest : null)
          .catch(err => {
            console.error(`Error loading digest for ${date}:`, err)
            return null
          })
      )

      const loadedDigests = await Promise.all(digestPromises)
      const validDigests = loadedDigests.filter(d => d !== null) as DailyDigest[]
      
      // Extract all articles from all digests and combine them
      const allArticles: DigestArticle[] = []
      validDigests.forEach(digest => {
        allArticles.push(...digest.articles)
      })
      
      // Remove duplicates based on article ID
      const uniqueArticles = allArticles.filter((article, index, self) =>
        index === self.findIndex(a => a.id === article.id)
      )
      
      // Sort all articles by publishedAt descending (latest first)
      uniqueArticles.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      
      // Create a single unified digest with all unique articles
      if (uniqueArticles.length > 0) {
        const categories = [...new Set(uniqueArticles.map(a => a.category))]
        const unifiedDigest: DailyDigest = {
          id: 'unified-digest',
          date: new Date().toISOString().split('T')[0],
          articles: uniqueArticles,
          summary: `Latest tech news from the past week - ${uniqueArticles.length} articles`,
          categories,
          totalArticles: uniqueArticles.length,
          createdAt: new Date().toISOString()
        }
        setDigests([unifiedDigest])
      }
      
      console.log(`✅ Loaded ${uniqueArticles.length} unique articles from ${validDigests.length} digests (sorted by time desc, ${allArticles.length - uniqueArticles.length} duplicates removed)`)
    } catch (error) {
      console.error('Error loading all articles:', error)
    } finally {
      setIsLoading(false)
    }
  }


  const loadAvailableDates = async (forceRefresh = false) => {
    try {
      // Check if we should refresh (every 5 minutes or forced)
      const now = Date.now()
      const fiveMinutesMs = 5 * 60 * 1000
      const shouldRefresh = forceRefresh || !lastCheckTimestamp.current || (now - lastCheckTimestamp.current) > fiveMinutesMs
      
      if (!shouldRefresh && hasLoadedDates.current) {
        console.log('✓ [DailyDigest] Using cached digests (checked within last 5 minutes)')
        return
      }
      
      console.log('📅 [DailyDigest] Loading available digest dates...')
      const response = await fetch('/api/news/digest?action=dates')
      const data = await response.json()
      
      console.log('📅 [DailyDigest] API response:', data)
      
      if (data.success && data.dates && data.dates.length > 0) {
        console.log(`✅ [DailyDigest] Found ${data.dates.length} available dates:`, data.dates)
        hasLoadedDates.current = true
        lastCheckTimestamp.current = now
        
        // Auto-load ALL articles (combined from all digests)
        console.log('📚 [DailyDigest] Auto-loading all articles...')
        await loadAllArticles(data.dates)
      } else {
        console.log('ℹ️ [DailyDigest] No available dates found for current user, auto-generating...')
        hasLoadedDates.current = true
        lastCheckTimestamp.current = now
        
        // Auto-generate digest (allow retry every 5 minutes)
        if (!autoGenerateAttempted.current || shouldRefresh) {
          autoGenerateAttempted.current = true
          console.log('🤖 [DailyDigest] Starting auto-generation...')
          await autoGenerateDigest()
        } else {
          console.log('⚠️ [DailyDigest] Auto-generation already attempted recently, skipping')
        }
      }
    } catch (error) {
      console.error('❌ [DailyDigest] Error loading available dates:', error)
      hasLoadedDates.current = true // Mark as loaded even on error
    }
  }

  const autoGenerateDigest = async () => {
    try {
      console.log('🤖 [DailyDigest] Auto-generating digests for the last 10 days...')
      
      // First, check if we have any articles at all
      const checkResponse = await fetch('/api/news?limit=1')
      const checkData = await checkResponse.json()
      
      console.log('📰 [DailyDigest] Article check:', { 
        hasArticles: checkData.articles?.length > 0,
        count: checkData.articles?.length || 0
      })
      
      if (!checkData.articles || checkData.articles.length === 0) {
        console.log('📰 [DailyDigest] No articles found, fetching from RSS first...')
        
        // Fetch and save articles from RSS first - silently
        const fetchResponse = await fetch('/api/admin/news/fetch', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        const fetchData = await fetchResponse.json()
        
        console.log('📡 [DailyDigest] RSS fetch result:', {
          success: fetchData.success,
          processed: fetchData.processed,
          errors: fetchData.errors
        })
        
        if (!fetchData.success || !fetchData.processed) {
          console.log('⚠️ [DailyDigest] Failed to fetch articles, cannot generate digests')
          return
        }
        
        console.log(`✅ [DailyDigest] Fetched and saved ${fetchData.processed} new articles`)
      }
      
      // Now generate digests for the last 10 days - silently
      console.log('📅 [DailyDigest] Preparing to generate digests...')
      
      // Generate dates for the last 10 days
      const today = new Date()
      const datesToGenerate: string[] = []
      
      for (let i = 0; i < 10; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        datesToGenerate.push(date.toISOString().split('T')[0])
      }
      
      console.log('📅 [DailyDigest] Dates to generate:', datesToGenerate)
      
      // Generate digests in sequence (to avoid overwhelming the server)
      let successCount = 0
      for (const date of datesToGenerate) {
        try {
          console.log(`📅 [DailyDigest] Generating digest for ${date}...`)
          const response = await fetch('/api/news/digest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generate', date })
          })
          const data = await response.json()
          
          console.log(`📅 [DailyDigest] Result for ${date}:`, {
            success: data.success,
            hasDigest: !!data.digest,
            articleCount: data.digest?.totalArticles || 0,
            error: data.error
          })
          
          if (data.success && data.digest) {
            successCount++
            console.log(`✅ [DailyDigest] Digest generated for ${date} with ${data.digest.totalArticles} articles`)
          } else {
            console.log(`⚠️ [DailyDigest] No digest for ${date}:`, data.error)
          }
        } catch (error) {
          console.error(`❌ [DailyDigest] Error generating digest for ${date}:`, error)
        }
      }
      
      console.log(`📊 [DailyDigest] Generation complete: ${successCount}/${datesToGenerate.length} digests created`)
      
      if (successCount > 0) {
        console.log(`✅ [DailyDigest] Successfully generated ${successCount} digests, reloading...`)
        
        // Reload available dates and ALL digests - silently
        const datesResponse = await fetch('/api/news/digest?action=dates')
        const datesData = await datesResponse.json()
        
        console.log('📅 [DailyDigest] Reloaded dates:', datesData.dates)
        
        if (datesData.success && datesData.dates) {
          // setAvailableDates(datesData.dates)
          // Load all articles
          await loadAllArticles(datesData.dates)
        }
      } else {
        console.log('⚠️ [DailyDigest] No digests were generated - no articles available')
        // Silent fail - don't show error toast
      }
    } catch (error) {
      console.error('❌ Error auto-generating digests:', error)
      // Silent fail - user can manually generate if needed
    }
  }

  // Load available dates on mount
  useEffect(() => {
    loadAvailableDates(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Manual refresh function
  const handleRefresh = async () => {
    console.log('🔄 [DailyDigest] Manual refresh triggered')
    autoGenerateAttempted.current = false // Reset to allow regeneration
    await loadAvailableDates(true) // Force refresh
  }


  // const formatDate = (dateString: string) => {
  //   const date = new Date(dateString)
  //   const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
  //   return `${dayOfWeek}, ${formatDateDDMMYYYY(date)}`
  // }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Software Development': 'bg-indigo-100 text-indigo-800',
      'QA & Testing': 'bg-green-100 text-green-800',
      'DevOps & Infrastructure': 'bg-blue-100 text-blue-800',
      'Security & Testing': 'bg-red-100 text-red-800',
      'Frontend Development': 'bg-purple-100 text-purple-800',
      'Backend Development': 'bg-orange-100 text-orange-800',
      'Technology': 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getSourceColor = (source: string) => {
    const colors = {
      'TechCrunch': 'bg-orange-100 text-orange-800',
      'Ars Technica': 'bg-blue-100 text-blue-800',
      'Wired': 'bg-black text-white',
      'The Verge': 'bg-purple-100 text-purple-800',
      'Hacker News': 'bg-orange-100 text-orange-800',
      'GitHub Blog': 'bg-gray-100 text-gray-800',
      'Stack Overflow': 'bg-yellow-100 text-yellow-800',
      'DEV Community': 'bg-green-100 text-green-800'
    }
    return colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className={`p-6 rounded-lg border-2 ${
      isInitialized && isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${
            isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Daily Tech Digest
          </h2>
          <p className={`text-sm ${
            isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Your personalized daily summary of tech news
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isLoading
              ? 'opacity-50 cursor-not-allowed'
              : isInitialized && isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center flex-col gap-3">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className={`text-sm ${
              isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {digests.length === 0 ? 'Loading your daily digests...' : 'Loading more digests...'}
            </span>
          </div>
        </div>
      ) : digests.length > 0 && digests[0] ? (
        /* Unified Timeline View - All Articles Sorted by Time */
        <div className="space-y-4">
          {/* Summary Header */}
          <div className={`p-4 rounded-lg ${
            isInitialized && isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-lg font-semibold ${
                isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                Latest Tech News
              </h3>
              <span className={`text-sm px-2 py-1 rounded ${
                isInitialized && isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}>
                {digests[0].totalArticles} articles
              </span>
            </div>
            
            {digests[0].summary && (
              <p className={`text-sm leading-relaxed ${
                isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {digests[0].summary}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 mt-3">
              {digests[0].categories.map((category) => (
                <span
                  key={category}
                  className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(category)}`}
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          {/* Articles Timeline - Sorted by Time */}
          <div className="space-y-3">
              {digests[0].articles.map((article) => (
              <div
                key={article.id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  isInitialized && isDarkMode
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs ${
                        isInitialized && isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {formatDateDDMMYYYY(new Date(article.publishedAt))}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getSourceColor(article.source)}`}>
                        {article.source}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </span>
                    </div>
                    
                    <h5 className={`font-semibold text-sm leading-tight mb-2 ${
                      isInitialized && isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {article.title}
                    </h5>
                    
                    <p className={`text-sm leading-relaxed mb-3 ${
                      isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {article.summary}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        title={tag} // Show full tag text on hover
                        className={`text-xs px-2 py-1 rounded max-w-20 truncate block overflow-hidden text-ellipsis whitespace-nowrap ${
                          isInitialized && isDarkMode
                            ? 'bg-gray-600 text-gray-300'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                      isInitialized && isDarkMode
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    Read More →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className={`text-6xl mb-4 ${
            isInitialized && isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`}>
            📰
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${
            isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            No digests available yet
          </h3>
          <p className={`text-sm ${
            isInitialized && isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Digests will be generated automatically when news articles are available
          </p>
        </div>
      )}
    </div>
  )
}
