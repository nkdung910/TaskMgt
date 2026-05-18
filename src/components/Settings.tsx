"use client"

import { useState, useEffect } from "react"
import { getUserConfig, addConfigValue, removeConfigValue, resetUserConfig } from "@/lib/config"
import { changePassword } from "@/lib/auth"
import type { UserConfigData } from "@/lib/config"
import { showToast } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"
import ConfirmationDialog from "./ui/ConfirmationDialog"

interface SettingsProps {
  isOpen?: boolean
  onClose?: () => void
  initialTab?: 'statuses' | 'priorities' | 'types' | 'timeFrames' | 'categories' | 'assignees' | 'newsRoles' | 'profile'
}

export default function Settings({ isOpen = true, onClose, initialTab = 'statuses' }: SettingsProps) {
  // Suppress unused parameter warnings for props that might be used in future
  void isOpen
  void onClose
  
  const [config, setConfig] = useState<UserConfigData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'statuses' | 'priorities' | 'types' | 'timeFrames' | 'categories' | 'assignees' | 'newsRoles' | 'profile'>(initialTab)
  
  // Update activeTab when initialTab changes (when switching sections)
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])
  
  // Determine which tabs to show based on initialTab
  const getAvailableTabs = () => {
    if (initialTab === 'newsRoles') {
      return ['newsRoles'] as const
    } else if (initialTab === 'profile') {
      return ['profile'] as const
    } else {
      // Task Settings - show first 6 tabs
      return ['statuses', 'priorities', 'types', 'timeFrames', 'categories', 'assignees'] as const
    }
  }
  const [newValue, setNewValue] = useState("")
  const [showTips, setShowTips] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [valueToDelete, setValueToDelete] = useState<{ category: keyof UserConfigData; value: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [rolePreferences, setRolePreferences] = useState<string[]>(['developer'])
  const [minRelevance, setMinRelevance] = useState(50)
  const [isSavingRoles, setIsSavingRoles] = useState(false)
  const [articleCounts, setArticleCounts] = useState({ developer: 0, qc: 0, ba: 0 })
  const { isDarkMode, toggleTheme } = useTheme()

  // Load user configuration (only for Task Settings)
  useEffect(() => {
    // Skip loading config for News Preferences and Profile tabs
    if (initialTab === 'newsRoles' || initialTab === 'profile') {
      return
    }

    const loadConfig = async () => {
      try {
        setLoading(true)
        const result = await getUserConfig()
        if (result.success && result.config) {
          setConfig(result.config)
        } else {
          showToast.error(result.error || "Failed to load configuration")
        }
      } catch (error) {
        console.error("Error loading config:", error)
        showToast.error("Failed to load configuration")
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [initialTab])

  // Load user news role preferences (only for News Preferences tab)
  useEffect(() => {
    if (initialTab !== 'newsRoles') {
      return
    }

    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/user/news-preferences')
        const data = await response.json()
        if (data.success) {
          setRolePreferences(data.preferences.roles || ['developer'])
          setMinRelevance(data.preferences.minRelevance || 50)
        }
      } catch (error) {
        console.error('Failed to load preferences:', error)
      }
    }
    
    loadPreferences()
  }, [initialTab])

  // Load article counts (only for News Preferences tab)
  useEffect(() => {
    if (initialTab !== 'newsRoles') {
      return
    }

    const loadArticleCounts = async () => {
      try {
        const response = await fetch(`/api/news/role-counts?minRelevance=${minRelevance}`)
        const data = await response.json()
        if (data.success) {
          setArticleCounts(data.counts)
        }
      } catch (error) {
        console.error('Failed to load article counts:', error)
      }
    }
    
    loadArticleCounts()
  }, [initialTab, minRelevance])

  const handleAddValue = async (category: keyof UserConfigData) => {
    if (!newValue.trim()) {
      showToast.error("Please enter a value")
      return
    }

    try {
      setLoading(true)
      const result = await addConfigValue(category, newValue.trim())
      if ('success' in result && result.success && 'config' in result && result.config) {
        setConfig(result.config)
        setNewValue("")
        showToast.success(`${category.slice(0, -1)} added successfully!`)
      } else {
        showToast.error(result.error || `Failed to add ${category.slice(0, -1)}`)
      }
    } catch (error) {
      console.error("Error adding value:", error)
      showToast.error(`Failed to add ${category.slice(0, -1)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveValue = async (category: keyof UserConfigData, value: string) => {
    // Show confirmation dialog instead of deleting immediately
    setValueToDelete({ category, value })
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!valueToDelete) return

    try {
      setIsDeleting(true)
      const result = await removeConfigValue(valueToDelete.category, valueToDelete.value)
      if ('success' in result && result.success && 'config' in result) {
        setConfig(result.config)
        showToast.success(`${valueToDelete.category.slice(0, -1)} removed successfully!`)
        setDeleteConfirmOpen(false)
        setValueToDelete(null)
      } else {
        showToast.error('error' in result ? (result.error || `Failed to remove ${valueToDelete.category.slice(0, -1)}`) : `Failed to remove ${valueToDelete.category.slice(0, -1)}`)
      }
    } catch (error) {
      console.error("Error removing value:", error)
      showToast.error(`Failed to remove ${valueToDelete.category.slice(0, -1)}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmOpen(false)
    setValueToDelete(null)
    setIsDeleting(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast.error("Please fill in all password fields")
      return
    }

    if (newPassword !== confirmPassword) {
      showToast.error("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      showToast.error("New password must be at least 6 characters long")
      return
    }

    try {
      setIsChangingPassword(true)
      const result = await changePassword(currentPassword, newPassword)

      if (result.success) {
        showToast.success("Password changed successfully!")
        // Clear form
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        showToast.error(result.error || "Failed to change password")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      showToast.error("Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleResetConfig = async () => {
    if (!confirm("Are you sure you want to reset all configuration to defaults? This action cannot be undone.")) {
      return
    }

    try {
      setLoading(true)
      const result = await resetUserConfig()
      if (result.success && result.config) {
        setConfig(result.config)
        showToast.success("Configuration reset to defaults!")
      } else {
        showToast.error(result.error || "Failed to reset configuration")
      }
    } catch (error) {
      console.error("Error resetting config:", error)
      showToast.error("Failed to reset configuration")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleToggle = (role: string) => {
    setRolePreferences(prev => 
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  const handleSaveRolePreferences = async () => {
    if (rolePreferences.length === 0) {
      showToast.error('Please select at least one role')
      return
    }

    setIsSavingRoles(true)
    try {
      const response = await fetch('/api/user/news-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roles: rolePreferences,
          minRelevance: minRelevance
        })
      })
      
      const data = await response.json()
      if (data.success) {
        showToast.success('News preferences saved successfully!')
      } else {
        showToast.error(data.error || 'Failed to save preferences')
      }
    } catch (error) {
      console.error('Save preferences error:', error)
      showToast.error('Failed to save preferences')
    } finally {
      setIsSavingRoles(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      developer: '💻 Developer',
      qc: '🧪 QA/Tester',
      ba: '📊 Business Analyst'
    }
    return labels[role] || role
  }

  const renderNewsRolePreferences = () => {
    const roles = [
      {
        id: 'developer',
        icon: '💻',
        title: 'Software Developer',
        description: 'Programming, frameworks, APIs, libraries, architecture, dev tools',
        count: articleCounts.developer
      },
      {
        id: 'qc',
        icon: '🧪',
        title: 'QA/QC Tester',
        description: 'Testing tools, test automation, QA methodologies, quality assurance',
        count: articleCounts.qc
      },
      {
        id: 'ba',
        icon: '📊',
        title: 'Business Analyst',
        description: 'Business intelligence, analytics, data visualization, requirements',
        count: articleCounts.ba
      }
    ]

    const totalFilteredArticles = rolePreferences.reduce((sum, role) => {
      return sum + (articleCounts[role as keyof typeof articleCounts] || 0)
    }, 0)

    return (
      <div className="max-w-3xl">
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Select the roles you&apos;re interested in. News articles will be filtered based on your selections.
        </p>

        {/* Role Checkboxes */}
        <div className="space-y-4 mb-6">
          {roles.map(role => (
            <label
              key={role.id}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                rolePreferences.includes(role.id)
                  ? isDarkMode
                    ? 'border-blue-500 bg-blue-950/30'
                    : 'border-blue-400 bg-blue-50'
                  : isDarkMode
                    ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={rolePreferences.includes(role.id)}
                onChange={() => handleRoleToggle(role.id)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{role.icon}</span>
                  <h4 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {role.title}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded ml-auto ${
                    isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {role.count} articles
                  </span>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {role.description}
                </p>
              </div>
            </label>
          ))}
        </div>

        {/* Relevance Slider */}
        <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Minimum Relevance Score: <strong>{minRelevance}%</strong>
          </label>
          <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Only show articles with at least this relevance score for your selected roles
          </p>
          <input
            type="range"
            min="0"
            max="85"
            step="5"
            value={minRelevance}
            onChange={(e) => setMinRelevance(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className={`flex justify-between text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            <span>0% (Show all)</span>
            <span>40% (Balanced)</span>
            <span>85% (Most relevant)</span>
          </div>
          {minRelevance > 70 && (
            <div className={`mt-3 p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-yellow-900/20 border-yellow-700 text-yellow-300' 
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
            }`}>
              <p className="text-xs mb-2">
                ⚠️ <strong>High threshold ({minRelevance}%):</strong> You may see very few articles.
              </p>
              <p className="text-xs">
                <strong>To see more news:</strong>
              </p>
              <ul className="text-xs mt-1 ml-4 space-y-1">
                <li>• Lower the threshold to 30-60% for better variety</li>
                <li>• Select multiple roles (e.g., QC + Developer)</li>
                <li>• Check all roles to see everything</li>
              </ul>
            </div>
          )}
          
          {minRelevance <= 30 && rolePreferences.length === 1 && (
            <div className={`mt-3 p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-blue-900/20 border-blue-700 text-blue-300' 
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <p className="text-xs">
                💡 <strong>Tip:</strong> You&apos;re currently seeing articles for only <strong>{getRoleLabel(rolePreferences[0])}</strong>.
                Select additional roles to see more diverse content!
              </p>
            </div>
          )}
        </div>

        {/* Selected Roles Summary */}
        {rolePreferences.length > 0 ? (
          <div className={`p-4 rounded-lg mb-4 border-l-4 ${
            isDarkMode 
              ? 'bg-green-950/30 border-green-500' 
              : 'bg-green-50 border-green-500'
          }`}>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
              ✅ You&apos;ll see articles relevant to: {rolePreferences.map(r => getRoleLabel(r)).join(', ')}
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
              Estimated {totalFilteredArticles} articles available
            </p>
          </div>
        ) : (
          <div className={`p-4 rounded-lg mb-4 border-l-4 ${
            isDarkMode 
              ? 'bg-yellow-950/30 border-yellow-500' 
              : 'bg-yellow-50 border-yellow-500'
          }`}>
            <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
              ⚠️ Please select at least one role to see personalized news
            </p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSaveRolePreferences}
          disabled={isSavingRoles || rolePreferences.length === 0}
          className={`w-full px-6 py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            isDarkMode
              ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500'
          }`}
        >
          {isSavingRoles ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving Preferences...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Preferences
            </>
          )}
        </button>
      </div>
    )
  }

  const getCategoryIcon = (category: keyof UserConfigData | 'newsRoles' | 'profile'): string => {
    const icons = {
      statuses: "📊",
      priorities: "⚡",
      types: "🎯",
      timeFrames: "⏰",
      categories: "🏷️",
      assignees: "👤",
      newsRoles: "👔",
      profile: "🔐"
    }
    return icons[category] || "📋"
  }

  const getCategoryLabel = (category: keyof UserConfigData | 'newsRoles' | 'profile'): string => {
    const labels = {
      statuses: "Statuses",
      priorities: "Priorities",
      types: "Types",
      timeFrames: "Time Frames",
      categories: "Categories",
      assignees: "Assignees",
      newsRoles: "News Preferences",
      profile: "Profile & Security"
    }
    return labels[category] || category
  }

  const renderValueList = (category: keyof UserConfigData | 'newsRoles' | 'profile') => {
    if (category === 'newsRoles') {
      return renderNewsRolePreferences()
    }

    if (category === 'profile') {
      return (
        <div className="max-w-md">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-sm ${
                  isDarkMode 
                    ? 'bg-gray-800 border border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Enter current password"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-sm ${
                  isDarkMode 
                    ? 'bg-gray-800 border border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Enter new password (min 6 characters)"
                required
                minLength={6}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {newPassword.length}/6 minimum characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-sm ${
                  isDarkMode 
                    ? 'bg-gray-800 border border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Confirm new password"
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs mt-1 text-red-500">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className={`w-full px-6 py-3 rounded-lg disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 ${
                isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500'
              }`}
            >
              {isChangingPassword ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Changing Password...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Change Password
                </>
              )}
            </button>
          </form>
        </div>
      )
    }
    
    if (!config) return null

    const values = config[category] || []
    const iconMap: Record<string, Record<string, string>> = {
      statuses: {
        "todo": "📋",
        "in-progress": "🔄",
        "review": "👀",
        "testing": "🧪",
        "done": "✅"
      },
      priorities: {
        "urgent": "🚨",
        "high": "🔴",
        "medium": "🟡",
        "low": "🟢"
      },
      types: {
        "design": "🎨",
        "development": "💻",
        "document": "📄",
        "testing": "🧪"
      },
      timeFrames: {
        "today": "⏰",
        "this-week": "📅",
        "next-week": "📆",
        "later": "⏰"
      },
      categories: {
        "general": "📋",
        "work": "💼",
        "personal": "👤",
        "shopping": "🛒",
        "health": "🏥",
        "finance": "💰"
      },
      assignees: {
        "unassigned": "❓",
        "me": "👤",
        "team": "👥"
      }
    }

    return (
      <div className="space-y-3">
        {values.map((value, index) => (
          <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50'}`}>
            <span className="text-lg flex-shrink-0">
              {iconMap[category]?.[value] || "📋"}
            </span>
            <span 
              className={`flex-1 font-medium capitalize truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
              title={value.replace("-", " ")}
            >
              {value.replace("-", " ")}
            </span>
            <button
              onClick={() => handleRemoveValue(category, value)}
              disabled={loading || values.length <= 1}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                isDarkMode 
                  ? 'text-red-400 hover:bg-red-900/30' 
                  : 'text-red-600 hover:bg-red-50'
              }`}
              title={values.length <= 1 ? "Cannot remove the last value" : `Remove ${value}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    )
  }


  // Only show loading/error states for Task Settings (which needs config)
  if (initialTab !== 'newsRoles' && initialTab !== 'profile') {
    if (loading && !config) {
      return (
        <div className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="text-center">
            <div className={`animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4`}></div>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading configuration...</p>
          </div>
        </div>
      )
    }

    if (!config) {
      return (
        <div className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="text-center">
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Failed to load configuration</p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center">
          <div className={`w-10 h-10 ${isDarkMode ? 'bg-purple-900' : 'bg-purple-100'} rounded-xl flex items-center justify-center mr-3`}>
            <svg className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {initialTab === 'newsRoles' ? 'News Preferences' : initialTab === 'profile' ? 'Profile & Security' : 'Task Settings'}
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {initialTab === 'newsRoles' 
                ? 'Select roles to personalize your news feed' 
                : initialTab === 'profile' 
                  ? 'Manage your account and security settings'
                  : 'Customize your task management values'}
            </p>
          </div>
        </div>
        
        {/* Theme Toggle */}
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {isDarkMode ? 'Dark' : 'Light'}
          </span>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isDarkMode 
                ? 'bg-blue-600' 
                : 'bg-gray-200'
            }`}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDarkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Tabs - Only show for Task Settings (which has multiple tabs) */}
      {initialTab !== 'newsRoles' && initialTab !== 'profile' && (
        <div className={`flex border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} overflow-x-auto`}>
          {getAvailableTabs().map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? isDarkMode 
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-900/30'
                    : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{getCategoryIcon(tab)}</span>
              <span className="hidden sm:inline">{getCategoryLabel(tab)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Current Values */}
            <div className="mb-6">
              {/* Only show section header for Task Settings with tabs */}
              {initialTab !== 'newsRoles' && initialTab !== 'profile' && (
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {getCategoryIcon(activeTab)} {getCategoryLabel(activeTab)}
                </h3>
              )}
              {renderValueList(activeTab)}
            </div>

            {/* Add New Value - Only show for config tabs (not newsRoles or profile) */}
            {activeTab !== 'newsRoles' && activeTab !== 'profile' && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className={`text-md font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add New {getCategoryLabel(activeTab).slice(0, -1)}</h4>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {newValue.length}/30
                  </span>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={`Enter new ${getCategoryLabel(activeTab).slice(0, -1).toLowerCase()}`}
                    maxLength={30}
                    className={`flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-sm ${
                      isDarkMode 
                        ? 'bg-gray-800 border border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddValue(activeTab as keyof UserConfigData)
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAddValue(activeTab as keyof UserConfigData)}
                    disabled={loading || !newValue.trim()}
                    className={`px-6 py-2 rounded-lg disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 ${
                      isDarkMode
                        ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300'
                    }`}
                  >
                    {loading && (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Info - Only show for config tabs */}
            {activeTab !== 'newsRoles' && activeTab !== 'profile' && (
              <div className={`rounded-lg p-4 ${
                isDarkMode 
                  ? 'bg-blue-900/30 border border-blue-700' 
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className={`font-medium text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                        Configuration Tips
                      </p>
                      <button
                        onClick={() => setShowTips(!showTips)}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          isDarkMode 
                            ? 'text-blue-300 hover:text-blue-100 hover:bg-blue-800/50' 
                            : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
                        }`}
                        title={showTips ? 'Hide tips' : 'Show tips'}
                      >
                        {showTips ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {showTips && (
                      <ul className={`space-y-1 text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        <li>• These values will appear in your task filters and lane options</li>
                        <li>• You must keep at least one value in each category</li>
                        <li>• Changes are saved automatically to your account</li>
                        <li>• Existing tasks will keep their current values</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Only show for Task Settings */}
      {initialTab !== 'newsRoles' && initialTab !== 'profile' && (
        <div className={`flex justify-end items-center p-6 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <button
            onClick={handleResetConfig}
            disabled={loading}
            className={`px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium ${
              isDarkMode
                ? 'border border-red-600 text-red-400 hover:bg-red-900/30'
                : 'border border-red-300 text-red-600 hover:bg-red-50'
            }`}
          >
            Reset to Defaults
          </button>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Configuration */}
      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Configuration Value"
        message={valueToDelete ? `Are you sure you want to delete "${valueToDelete.value}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={isDeleting}
      />
    </div>
  )
}