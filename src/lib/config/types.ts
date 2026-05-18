export interface UserConfigData {
  statuses: string[]
  priorities: string[]
  types: string[]
  timeFrames: string[]
  categories: string[]
  assignees: string[]
}

// Default configuration for new users
export const DEFAULT_USER_CONFIG: UserConfigData = {
  statuses: ["todo", "in-progress", "review", "testing", "done"],
  priorities: ["urgent", "high", "medium", "low"],
  types: ["design", "development", "document", "testing"],
  timeFrames: ["today", "this-week", "next-week", "later"],
  categories: ["general", "work", "personal", "shopping", "health", "finance"],
  assignees: ["unassigned", "me"]
}
