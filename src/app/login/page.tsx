"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { signUp } from "@/lib/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { showToast } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const router = useRouter()
  const { isDarkMode, isInitialized } = useTheme()

  // Load saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail")
    const savedPassword = localStorage.getItem("rememberedPassword")
    const shouldRemember = localStorage.getItem("rememberMe") === "true"
    
    if (shouldRemember && savedEmail && savedPassword) {
      setEmail(savedEmail)
      setPassword(savedPassword)
      setRememberMe(true)
    }
  }, [])

  // Save credentials when remember me is checked
  const handleRememberMe = (checked: boolean) => {
    setRememberMe(checked)
    if (checked) {
      localStorage.setItem("rememberMe", "true")
      localStorage.setItem("rememberedEmail", email)
      localStorage.setItem("rememberedPassword", password)
    } else {
      localStorage.removeItem("rememberMe")
      localStorage.removeItem("rememberedEmail")
      localStorage.removeItem("rememberedPassword")
    }
  }

  // Validate password for signup
  const validatePassword = (password: string) => {
    if (!isLogin && password.length < 6) {
      setPasswordError("Password must be at least 6 characters long")
      return false
    }
    setPasswordError("")
    return true
  }

  // Handle password change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    if (!isLogin) {
      validatePassword(newPassword)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password for signup
    if (!isLogin && !validatePassword(password)) {
      return
    }
    
    setLoading(true)

    try {
      if (isLogin) {
        // Use NextAuth signIn for login
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          showToast.error("Invalid email or password")
        } else {
          showToast.success("Login successful!")
          router.push("/")
        }
      } else {
        // Use server action for signup
        const result = await signUp(email, password)
        if (result?.error) {
          showToast.error(result.error)
        } else {
          showToast.success("Account created successfully! Please log in.")
          setIsLogin(true)
        }
      }
    } catch {
      showToast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
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
            {isLogin ? "Sign in to your account" : "Create your account"}
          </h2>
          <p className={`mt-2 text-center text-sm ${
            isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Task Assistant
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-1 ${
                isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none relative block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${
                  isInitialized && isDarkMode
                    ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-1 ${
                isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className={`appearance-none relative block w-full px-3 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${
                    passwordError 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : (isInitialized && isDarkMode ? 'border-gray-600' : 'border-gray-300')
                  } ${
                    isInitialized && isDarkMode
                      ? 'bg-gray-700 text-gray-100 placeholder-gray-400'
                      : 'bg-white text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder={isLogin ? "Enter your password" : "Enter password (min 6 characters)"}
                  value={password}
                  onChange={handlePasswordChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className={`h-5 w-5 ${
                      isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-400'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M14.12 14.12l1.415 1.415M14.12 14.12L9.878 9.878m4.242 4.242L9.878 9.878" />
                    </svg>
                  ) : (
                    <svg className={`h-5 w-5 ${
                      isInitialized && isDarkMode ? 'text-gray-400' : 'text-gray-400'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && (
                <p className={`mt-1 text-sm ${
                  isInitialized && isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>{passwordError}</p>
              )}
            </div>
          </div>

          {isLogin && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => handleRememberMe(e.target.checked)}
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded ${
                    isInitialized && isDarkMode ? 'border-gray-600' : 'border-gray-300'
                  }`}
                />
                <label htmlFor="remember-me" className={`ml-2 block text-sm ${
                  isInitialized && isDarkMode ? 'text-gray-300' : 'text-gray-900'
                }`}>
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className={`font-medium transition-colors ${
                    isInitialized && isDarkMode
                      ? 'text-blue-400 hover:text-blue-300'
                      : 'text-blue-600 hover:text-blue-500'
                  }`}
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          )}


          <div>
            <button
              type="submit"
              disabled={loading || (!isLogin && !!passwordError)}
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
                  Loading...
                </div>
              ) : (
                isLogin ? "Sign in" : "Create account"
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setPasswordError("") // Clear password error when switching modes
              }}
              className={`text-sm font-medium transition-colors ${
                isInitialized && isDarkMode
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-blue-600 hover:text-blue-500'
              }`}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
