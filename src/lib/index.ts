// Main lib exports - organized by feature modules
// Using explicit exports to avoid naming conflicts

// Auth module
export * from './auth'

// Tasks module  
export * from './tasks'

// Config module
export * from './config'

// Services module
export * from './services'

// Utils module
export * from './utils'

// Database module - explicit exports to avoid conflicts
export { prisma, checkDatabaseConnection } from './database/connection'
export { supabase, supabaseAdmin } from './database/supabase'
export { 
  supabase as supabaseClient, 
  signUp as supabaseSignUp, 
  signIn as supabaseSignIn, 
  signOut as supabaseSignOut, 
  getCurrentUser, 
  getTasks as supabaseGetTasks, 
  createTask as supabaseCreateTask, 
  updateTask as supabaseUpdateTask, 
  deleteTask as supabaseDeleteTask, 
  subscribeToTasks 
} from './database/supabase-client'

// News module - explicit exports to avoid conflicts
export { 
  getNewsArticles, 
  getBookmarkedArticles,
  bookmarkArticle,
  removeBookmark,
  getDailyDigest,
  getNewsCategories,
  getNewsSources,
  getNewsTags
} from './news/actions'
export type { NewsArticle, NewsBookmark, NewsDigest } from './news/actions'
export { calculateRoleScores } from './news/categorizer'
export type { RoleScores } from './news/categorizer'
export * from './news/digest-generator'
export * from './news/aggregator'
export * from './news/newsapi'
