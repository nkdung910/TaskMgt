"use client"

import { useState } from "react"
import Link from "next/link"
import { useTheme } from "@/contexts/ThemeContext"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const { isDarkMode, isInitialized } = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Please enter your email address")
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.success || response.ok) {
        setSubmitted(true)
      } else {
        setError(data.error || 'Failed to send reset email')
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
        isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="max-w-md w-full space-y-8">
          <div className={`rounded-lg shadow-sm p-8 ${
            isInitialized && isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            {/* Success Message */}
            <h1 className={`text-2xl font-bold text-center mb-4 ${
              isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              Check Your Email
            </h1>
            <p className={`text-center mb-6 ${
              isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              If an account exists with <strong className={
                isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }>{email}</strong>, you will receive a password reset link shortly.
            </p>

            {/* Info Box */}
            <div className={`rounded-lg p-4 mb-6 ${
              isInitialized && isDarkMode 
                ? 'bg-blue-900/30 border border-blue-800' 
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-sm font-medium ${
                isInitialized && isDarkMode ? 'text-blue-300' : 'text-blue-800'
              }`}>
                📧 Next steps:
              </p>
              <ul className={`text-sm mt-2 space-y-1 ml-4 ${
                isInitialized && isDarkMode ? 'text-blue-200' : 'text-blue-700'
              }`}>
                <li>• Check your email inbox</li>
                <li>• Click the reset link (expires in 1 hour)</li>
                <li>• Set your new password</li>
                <li>• Login with your new password</li>
              </ul>
            </div>

            {/* Back to Login */}
            <Link
              href="/login"
              className={`block w-full text-center px-6 py-3 rounded-lg font-medium transition-colors ${
                isInitialized && isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-offset-gray-800'
                  : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-offset-white'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              Back to Login
            </Link>

            {/* Resend */}
            <button
              onClick={() => setSubmitted(false)}
              className={`w-full mt-3 text-sm transition-colors ${
                isInitialized && isDarkMode 
                  ? 'text-gray-400 hover:text-gray-200' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Didn&apos;t receive the email? Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      isInitialized && isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${
            isInitialized && isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Forgot Password?
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium mb-1 ${
              isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className={`appearance-none relative block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${
                isInitialized && isDarkMode
                  ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {error && (
            <div className={`rounded-lg px-4 py-3 text-sm ${
              isInitialized && isDarkMode
                ? 'bg-red-900/30 border border-red-800 text-red-300'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                isInitialized && isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-gray-900'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-white'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Reset Link...
                </div>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className={`text-sm font-medium transition-colors ${
                isInitialized && isDarkMode
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-blue-600 hover:text-blue-500'
              }`}
            >
              ← Back to Login
            </Link>
          </div>
        </form>

        {/* Info */}
        <p className={`text-center text-xs ${
          isInitialized && isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          The reset link will expire in 1 hour for security reasons.
        </p>
      </div>
    </div>
  )
}

