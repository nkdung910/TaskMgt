"use client"

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    // Fetch the OpenAPI spec
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => {
        setSpec(data)
        // Suppress known swagger-ui-react strict mode warning
        // This is a third-party library issue and safe to ignore
        // See: https://github.com/swagger-api/swagger-ui/issues/9047
      })
      .catch(err => console.error('Error loading API spec:', err))
  }, [])

  if (!spec) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-indigo-600 text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">TaskMgt API Documentation</h1>
          <p className="text-indigo-100">
            Complete API reference for Task Management & Tech News Platform
          </p>
          <div className="mt-4 flex gap-4">
            <Link
              href="/"
              className="inline-block bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition"
            >
              ← Back to App
            </Link>
            <a
              href="/api/docs/json"
              className="inline-block bg-indigo-700 text-white px-4 py-2 rounded-lg hover:bg-indigo-800 transition"
              download
            >
              Download OpenAPI JSON
            </a>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="max-w-7xl mx-auto">
        <SwaggerUI spec={spec} />
      </div>

      {/* Footer */}
      <div className="bg-gray-50 py-6 px-4 mt-8 border-t">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p className="mb-2">
            <strong>Note:</strong> All endpoints require authentication via session cookie
          </p>
          <p className="text-sm">
            TaskMgt API v1.5.0 | Built with Next.js 15
          </p>
        </div>
      </div>
    </div>
  )
}

