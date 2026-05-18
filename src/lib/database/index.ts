// Database module exports
export * from './connection'
export { supabase, supabaseAdmin } from './supabase'
export { 
  supabase as supabaseClient, 
  signUp, 
  signIn, 
  signOut, 
  getCurrentUser, 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  subscribeToTasks 
} from './supabase-client'
