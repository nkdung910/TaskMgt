/**
 * Application Version
 * 
 * Single source of truth for application version number
 */

export const APP_VERSION = '1.5.0'
export const APP_NAME = 'TaskMgt'
export const API_VERSION = '1.5.0'

export const VERSION_INFO = {
  app: APP_VERSION,
  api: API_VERSION,
  name: APP_NAME,
  buildDate: new Date().toISOString(),
  features: [
    'Task Management with Kanban boards',
    'Tech News Aggregation with RSS feeds',
    'Role-based News Filtering (Developer, QC, BA)',
    'Daily News Digest',
    'User Authentication & Password Reset',
    'Customizable Task Configuration',
    'Statistics Dashboard',
    'Comprehensive API Documentation'
  ]
}

export function getVersionString(): string {
  return `${APP_NAME} v${APP_VERSION}`
}

export function getFullVersionInfo(): string {
  return `${APP_NAME} v${APP_VERSION} (API v${API_VERSION})`
}

