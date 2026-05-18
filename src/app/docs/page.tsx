'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'

interface DocFile {
  name: string
  path: string
}

const DOC_FILES: DocFile[] = [
  // Main Documentation
  { name: '📖 README', path: '/docs/README.md' },
  { name: '📚 User Guide', path: '/docs/USER_GUIDE.md' },
  { name: '🔌 API Documentation', path: '/docs/API.md' },
  { name: '🚀 Deployment Guide', path: '/docs/DEPLOYMENT.md' },
  
  // Feature Specifications
  { name: '📋 Feature Specification', path: '/docs/specs/spec.md' },
  { name: '📊 Current Status', path: '/docs/specs/CURRENT_STATUS.md' },
  { name: '🗄️ Data Model', path: '/docs/specs/data-model.md' },
  { name: '📝 Tasks Specification', path: '/docs/specs/tasks.md' },
  { name: '📅 Project Plan', path: '/docs/specs/plan.md' },
  { name: '🔬 Research Notes', path: '/docs/specs/research.md' },
  
  // Technical Documentation
  { name: '🔐 Authentication', path: '/docs/specs/docs/AUTHENTICATION.md' },
  { name: '🏗️ Deployment (Legacy)', path: '/docs/specs/docs/DEPLOYMENT.md' },
  
  // Testing Documentation
  { name: '🧪 E2E Test Summary', path: '/docs/E2E_TEST_AUTOMATION_SUMMARY.md' },
]

export default function DocsPage() {
  const { isDarkMode, isInitialized } = useTheme()
  const [selectedFile, setSelectedFile] = useState<DocFile>(DOC_FILES[0]) // User Guide is now first
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFile(selectedFile)
  }, [selectedFile])

  const loadFile = async (file: DocFile) => {
    setLoading(true)
    try {
      const response = await fetch(file.path)
      const text = await response.text()
      setContent(text)
    } catch (error) {
      console.error('Error loading file:', error)
      setContent('# Error\n\nFailed to load documentation file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex h-screen">
        {/* Sidebar - File List */}
        <div className={`w-80 border-r overflow-y-auto ${
          isInitialized && isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className={`text-2xl font-bold ${
                isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                📚 Documentation
              </h1>
              <Link
                href="/"
                className={`text-sm px-3 py-1 rounded transition-colors ${
                  isInitialized && isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ← App
              </Link>
            </div>

            <div className="space-y-1">
              {DOC_FILES.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedFile.path === file.path
                      ? isInitialized && isDarkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isInitialized && isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>📄</span>
                    <span className="font-medium truncate">{file.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Markdown Viewer */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            <div className="mb-6">
              <h2 className={`text-3xl font-bold mb-2 ${
                isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {selectedFile.name}
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className={`ml-3 ${
                  isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Loading...
                </span>
              </div>
            ) : (
              <div className={`prose prose-lg max-w-none ${
                isInitialized && isDarkMode ? 'prose-invert' : ''
              }`}>
                <style jsx global>{`
                  .prose h1 { 
                    ${isInitialized && isDarkMode ? 'color: #f3f4f6;' : 'color: #111827;'} 
                    font-size: 2.25rem;
                    font-weight: 700;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                  }
                  .prose h2 { 
                    ${isInitialized && isDarkMode ? 'color: #e5e7eb;' : 'color: #1f2937;'} 
                    font-size: 1.875rem;
                    font-weight: 700;
                    margin-top: 1.75rem;
                    margin-bottom: 0.75rem;
                  }
                  .prose h3 { 
                    ${isInitialized && isDarkMode ? 'color: #d1d5db;' : 'color: #374151;'} 
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.5rem;
                  }
                  .prose p { 
                    ${isInitialized && isDarkMode ? 'color: #d1d5db;' : 'color: #374151;'} 
                    line-height: 1.75;
                    margin-bottom: 1rem;
                  }
                  .prose code {
                    ${isInitialized && isDarkMode 
                      ? 'background-color: #374151; color: #f472b6;' 
                      : 'background-color: #f3f4f6; color: #db2777;'
                    }
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    font-size: 0.875rem;
                  }
                  .prose pre {
                    ${isInitialized && isDarkMode
                      ? 'background-color: #1f2937; color: #d1d5db;'
                      : 'background-color: #f9fafb; color: #111827;'
                    }
                    padding: 1rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    margin: 1rem 0;
                  }
                  .prose pre code {
                    background-color: transparent;
                    color: inherit;
                    padding: 0;
                  }
                  .prose ul, .prose ol {
                    ${isInitialized && isDarkMode ? 'color: #d1d5db;' : 'color: #374151;'}
                    margin-bottom: 1rem;
                  }
                  .prose li {
                    margin-bottom: 0.5rem;
                  }
                  .prose a {
                    color: #3b82f6;
                    text-decoration: underline;
                  }
                  .prose a:hover {
                    color: #2563eb;
                  }
                  .prose blockquote {
                    ${isInitialized && isDarkMode
                      ? 'border-left-color: #4b5563; color: #9ca3af;'
                      : 'border-left-color: #d1d5db; color: #6b7280;'
                    }
                    border-left-width: 4px;
                    padding-left: 1rem;
                    font-style: italic;
                    margin: 1rem 0;
                  }
                  .prose table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1rem 0;
                  }
                  .prose th {
                    ${isInitialized && isDarkMode
                      ? 'background-color: #1f2937; color: #e5e7eb;'
                      : 'background-color: #f3f4f6; color: #111827;'
                    }
                    padding: 0.75rem 1rem;
                    text-align: left;
                    font-weight: 600;
                  }
                  .prose td {
                    ${isInitialized && isDarkMode
                      ? 'border-color: #374151; color: #d1d5db;'
                      : 'border-color: #e5e7eb; color: #374151;'
                    }
                    border-width: 1px;
                    padding: 0.75rem 1rem;
                  }
                  .prose strong {
                    ${isInitialized && isDarkMode ? 'color: #f3f4f6;' : 'color: #111827;'}
                    font-weight: 600;
                  }
                  .prose hr {
                    ${isInitialized && isDarkMode ? 'border-color: #374151;' : 'border-color: #e5e7eb;'}
                    margin: 2rem 0;
                  }
                `}</style>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
