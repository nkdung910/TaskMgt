"use client"

import { useState } from "react"
import Image from "next/image"
import { useTheme } from "@/contexts/ThemeContext"
import { bookmarkArticle, removeBookmark } from "@/lib/news"
import { showToast } from "@/lib/utils"
import { formatDateDDMMYYYY } from "@/lib/utils"

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

interface NewsArticleCardProps {
  article: NewsArticle
  onBookmarkChange?: () => void
}

export default function NewsArticleCard({ article, onBookmarkChange }: NewsArticleCardProps) {
  const { isDarkMode, isInitialized } = useTheme()
  const [isBookmarking, setIsBookmarking] = useState(false)

  const handleBookmark = async () => {
    if (isBookmarking) return

    setIsBookmarking(true)
    try {
      if (article.isBookmarked) {
        const result = await removeBookmark(article.id)
        if (result.success) {
          showToast.success("Article removed from bookmarks")
          onBookmarkChange?.()
        } else {
          showToast.error(result.error || "Failed to remove bookmark")
        }
      } else {
        const result = await bookmarkArticle(article.id)
        if (result.success) {
          showToast.success("Article bookmarked")
          onBookmarkChange?.()
        } else {
          showToast.error(result.error || "Failed to bookmark article")
        }
      }
    } catch {
      showToast.error("An error occurred")
    } finally {
      setIsBookmarking(false)
    }
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    // Check if date is valid
    if (isNaN(d.getTime())) {
      return 'Invalid date'
    }
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    return `${formatDateDDMMYYYY(d)} ${hours}:${minutes}`
  }

  const getRelevanceColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 0.8) return 'text-green-500'
    if (score >= 0.6) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getRelevanceLabel = (score?: number) => {
    if (!score) return 'N/A'
    if (score >= 0.8) return 'High'
    if (score >= 0.6) return 'Medium'
    return 'Low'
  }

  return (
    <div className={`rounded-lg border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${
      isInitialized && isDarkMode 
        ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
        : 'bg-gradient-to-br from-white to-purple-50/30 border-purple-200 hover:border-purple-300'
    }`}>
      {/* Article Image */}
      {article.imageUrl && (
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-gray-100">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              const target = e.currentTarget
              target.style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Article Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className={`text-lg font-bold leading-tight ${
              isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {article.title}
            </h3>
            <button
              onClick={handleBookmark}
              disabled={isBookmarking}
              className={`ml-3 p-2 rounded-lg transition-all duration-200 ${
                isBookmarking
                  ? 'opacity-50 cursor-not-allowed'
                  : article.isBookmarked
                    ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50'
                    : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
              }`}
              title={article.isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
            >
              {isBookmarking ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill={article.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              )}
            </button>
          </div>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              isInitialized && isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
            }`}>
              {article.source}
            </span>
            {article.author && (
              <span className={`${
                isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                by {article.author}
              </span>
            )}
            <span className={`${
              isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {formatDate(article.publishedAt)}
            </span>
            {article.relevanceScore && (
              <span className={`font-medium ${getRelevanceColor(article.relevanceScore)}`}>
                Relevance: {getRelevanceLabel(article.relevanceScore)} ({Math.round(article.relevanceScore * 100)}%)
              </span>
            )}
          </div>
        </div>

        {/* Summary */}
        {article.summary && (
          <div className="mb-4">
            <div className={`flex items-start gap-2 mb-2 px-3 py-2 rounded-lg ${
              isInitialized && isDarkMode ? 'bg-purple-900/20' : 'bg-purple-100'
            }`}>
              <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                isInitialized && isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className={`text-xs font-semibold ${
                isInitialized && isDarkMode ? 'text-purple-300' : 'text-purple-700'
              }`}>
                AI Summary
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${
              isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {article.summary}
            </p>
          </div>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => {
                const pastelTagColors = [
                  'bg-pink-100 text-pink-700',
                  'bg-teal-100 text-teal-700',
                  'bg-amber-100 text-amber-700',
                  'bg-cyan-100 text-cyan-700',
                  'bg-lime-100 text-lime-700'
                ]
                const colorClass = pastelTagColors[index % 5]
                return (
                  <span
                    key={index}
                    title={tag} // Show full tag text on hover
                    className={`px-2 py-1 text-xs rounded-full font-medium max-w-24 truncate block overflow-hidden text-ellipsis whitespace-nowrap ${
                      isInitialized && isDarkMode 
                        ? 'bg-gray-700 text-gray-300' 
                        : colorClass
                    }`}
                  >
                    #{tag}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Category */}
        {article.category && (
          <div className="mb-4">
            <span className={`inline-block px-3 py-1.5 text-xs font-semibold rounded-full ${
              isInitialized && isDarkMode 
                ? 'bg-purple-900 text-purple-200' 
                : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800'
            }`}>
              📂 {article.category}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isInitialized && isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gradient-to-r from-blue-400 to-purple-400 text-white hover:from-blue-500 hover:to-purple-500 shadow-md'
            }`}
          >
            <span>Read Full Article</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          <div className="flex items-center gap-2">
            <span className={`text-xs ${
              isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {article.isBookmarked ? 'Bookmarked' : 'Not bookmarked'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
