import { LaneType } from "@/components/layout/LaneSwitcher"

// Helper function to get theme-aware colors (Safari-compatible)
export const getThemeAwareColors = (isDarkMode: boolean) => ({
  gray: isDarkMode 
    ? { bg: "bg-gray-800", border: "border-gray-700", text: "text-gray-100" }
    : { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-900" },
  blue: isDarkMode
    ? { bg: "bg-gray-800", border: "border-blue-700", text: "text-gray-100" }
    : { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900" },
  yellow: isDarkMode
    ? { bg: "bg-gray-800", border: "border-yellow-700", text: "text-gray-100" }
    : { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-900" },
  purple: isDarkMode
    ? { bg: "bg-gray-800", border: "border-purple-700", text: "text-gray-100" }
    : { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-900" },
  green: isDarkMode
    ? { bg: "bg-gray-800", border: "border-green-700", text: "text-gray-100" }
    : { bg: "bg-green-50", border: "border-green-200", text: "text-green-900" },
  red: isDarkMode
    ? { bg: "bg-gray-800", border: "border-red-700", text: "text-gray-100" }
    : { bg: "bg-red-50", border: "border-red-200", text: "text-red-900" },
  orange: isDarkMode
    ? { bg: "bg-gray-800", border: "border-orange-700", text: "text-gray-100" }
    : { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-900" }
})

export interface LaneConfig {
  id: string
  title: string
  color: string
  borderColor: string
  textColor?: string
  icon: string
  order: number
}

// Workflow-based lanes (enhanced with 5 status options) - Safari compatible
export const statusLanes: LaneConfig[] = [
  {
    id: "todo",
    title: "To Do",
    color: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: "📋",
    order: 1
  },
  {
    id: "in-progress",
    title: "In Progress", 
    color: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: "🔄",
    order: 2
  },
  {
    id: "review",
    title: "Review",
    color: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: "👀",
    order: 3
  },
  {
    id: "testing",
    title: "Testing",
    color: "bg-purple-50",
    borderColor: "border-purple-200",
    icon: "🧪",
    order: 4
  },
  {
    id: "done",
    title: "Done",
    color: "bg-green-50", 
    borderColor: "border-green-200",
    icon: "✅",
    order: 5
  }
]

// Priority-based lanes (enhanced) - Safari compatible
export const priorityLanes: LaneConfig[] = [
  {
    id: "urgent",
    title: "Urgent",
    color: "bg-red-100",
    borderColor: "border-red-300", 
    icon: "🚨",
    order: 1
  },
  {
    id: "high",
    title: "High Priority",
    color: "bg-red-50",
    borderColor: "border-red-200", 
    icon: "🔴",
    order: 2
  },
  {
    id: "medium",
    title: "Medium Priority",
    color: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: "🟡", 
    order: 3
  },
  {
    id: "low",
    title: "Low Priority",
    color: "bg-green-50",
    borderColor: "border-green-200",
    icon: "🟢",
    order: 4
  }
]

// Type-based lanes (Design, Development, Document, Testing) - Safari compatible
export const typeLanes: LaneConfig[] = [
  {
    id: "design",
    title: "Design",
    color: "bg-pink-50",
    borderColor: "border-pink-200",
    icon: "🎨",
    order: 1
  },
  {
    id: "development",
    title: "Development",
    color: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: "💻",
    order: 2
  },
  {
    id: "document",
    title: "Document",
    color: "bg-green-50",
    borderColor: "border-green-200",
    icon: "📄",
    order: 3
  },
  {
    id: "testing",
    title: "Testing",
    color: "bg-purple-50",
    borderColor: "border-purple-200",
    icon: "🧪",
    order: 4
  }
]

// Time-based lanes (Today, This Week, Next Week, Later) - Safari compatible
export const timeLanes: LaneConfig[] = [
  {
    id: "today",
    title: "Today",
    color: "bg-red-50",
    borderColor: "border-red-200",
    icon: "🔥",
    order: 1
  },
  {
    id: "this-week",
    title: "This Week",
    color: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: "📅",
    order: 2
  },
  {
    id: "next-week",
    title: "Next Week",
    color: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: "📆",
    order: 3
  },
  {
    id: "later",
    title: "Later",
    color: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: "⏰",
    order: 4
  }
]

// Category-based lanes (dynamic based on user's tasks)
export const getCategoryLanes = (categories: string[], colors: ReturnType<typeof getThemeAwareColors>): LaneConfig[] => {
  const categoryIcons: Record<string, string> = {
    general: "📝",
    work: "💼", 
    personal: "👤",
    shopping: "🛒",
    health: "🏥",
    finance: "💰",
    travel: "✈️",
    home: "🏠",
    education: "📚",
    entertainment: "🎬",
    family: "👨‍👩‍👧‍👦",
    fitness: "💪"
  }

  const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
    general: colors.gray,
    work: colors.blue,
    personal: colors.purple,
    shopping: colors.orange,
    health: colors.red,
    finance: colors.green,
    travel: colors.blue,
    home: colors.yellow,
    education: colors.purple,
    entertainment: colors.purple,
    family: colors.orange,
    fitness: colors.green
  }

  return categories.map((category, index) => ({
    id: category,
    title: category.charAt(0).toUpperCase() + category.slice(1),
    color: categoryColors[category]?.bg || categoryColors.general.bg,
    borderColor: categoryColors[category]?.border || categoryColors.general.border,
    textColor: categoryColors[category]?.text || categoryColors.general.text,
    icon: categoryIcons[category] || "📁",
    order: index + 1
  }))
}

// Assignee-based lanes (dynamic based on task assignees)
export const getAssigneeLanes = (assignees: string[], colors: ReturnType<typeof getThemeAwareColors>): LaneConfig[] => {
  const assigneeIcons: Record<string, string> = {
    unassigned: "❓",
    admin: "👑",
    developer: "👨‍💻",
    designer: "👨‍🎨",
    manager: "👔",
    tester: "🧪",
    analyst: "📊"
  }

  const assigneeColors: Record<string, { bg: string; border: string; text: string }> = {
    unassigned: colors.gray,
    admin: colors.purple,
    developer: colors.blue,
    designer: colors.purple,
    manager: colors.green,
    tester: colors.orange,
    analyst: colors.blue
  }

  // Generate colors for custom assignees
  const colorOptions = [
    colors.blue,
    colors.green,
    colors.orange,
    colors.yellow,
    colors.purple,
    colors.green,
    colors.green,
    colors.purple
  ]

  return assignees.map((assignee, index) => {
    // Use predefined colors/icons or generate for custom assignees
    const colorIndex = assignees.indexOf(assignee) % colorOptions.length
    const customColor = colorOptions[colorIndex]
    
    return {
      id: assignee,
      title: assignee === "unassigned" ? "Unassigned" : (assignee || "").charAt(0).toUpperCase() + (assignee || "").slice(1),
      color: assigneeColors[assignee]?.bg || customColor.bg,
      borderColor: assigneeColors[assignee]?.border || customColor.border,
      textColor: assigneeColors[assignee]?.text || customColor.text,
      icon: assigneeIcons[assignee] || "👤",
      order: assignee === "unassigned" ? 0 : index + 1
    }
  }).sort((a, b) => a.order - b.order)
}

// Get lanes based on lane type and user configuration
export const getLanesForType = (laneType: LaneType, userConfig?: {
  statuses?: string[]
  priorities?: string[]
  types?: string[]
  timeFrames?: string[]
  categories?: string[]
  assignees?: string[]
}, isDarkMode: boolean = false): LaneConfig[] => {
  const colors = getThemeAwareColors(isDarkMode)
  switch (laneType) {
    case "status":
      return userConfig?.statuses ? getCustomStatusLanes(userConfig.statuses, colors) : getThemeAwareStatusLanes(colors)
    case "priority": 
      return userConfig?.priorities ? getCustomPriorityLanes(userConfig.priorities, colors) : getThemeAwarePriorityLanes(colors)
    case "type":
      return userConfig?.types ? getCustomTypeLanes(userConfig.types, colors) : getThemeAwareTypeLanes(colors)
    case "time":
      return userConfig?.timeFrames ? getCustomTimeLanes(userConfig.timeFrames, colors) : getThemeAwareTimeLanes(colors)
    case "category":
      return userConfig?.categories ? getCategoryLanes(userConfig.categories, colors) : getCategoryLanes(["general"], colors)
    case "assignee":
      return userConfig?.assignees ? getAssigneeLanes(userConfig.assignees, colors) : getAssigneeLanes(["unassigned"], colors)
    default:
      return userConfig?.statuses ? getCustomStatusLanes(userConfig.statuses, colors) : getThemeAwareStatusLanes(colors)
  }
}

// Theme-aware lane functions
const getThemeAwareStatusLanes = (colors: ReturnType<typeof getThemeAwareColors>): LaneConfig[] => [
  {
    id: "todo",
    title: "To Do",
    color: colors.gray.bg,
    borderColor: colors.gray.border,
    textColor: colors.gray.text,
    icon: "📋",
    order: 1
  },
  {
    id: "in-progress",
    title: "In Progress", 
    color: colors.blue.bg,
    borderColor: colors.blue.border,
    textColor: colors.blue.text,
    icon: "🔄",
    order: 2
  },
  {
    id: "review",
    title: "Review",
    color: colors.yellow.bg,
    borderColor: colors.yellow.border,
    textColor: colors.yellow.text,
    icon: "👀",
    order: 3
  },
  {
    id: "testing",
    title: "Testing",
    color: colors.purple.bg,
    borderColor: colors.purple.border,
    textColor: colors.purple.text,
    icon: "🧪",
    order: 4
  },
  {
    id: "done",
    title: "Done",
    color: colors.green.bg, 
    borderColor: colors.green.border,
    textColor: colors.green.text,
    icon: "✅",
    order: 5
  }
]

const getThemeAwarePriorityLanes = (colors: ReturnType<typeof getThemeAwareColors>): LaneConfig[] => [
  {
    id: "urgent",
    title: "Urgent",
    color: colors.red.bg,
    borderColor: colors.red.border,
    textColor: colors.red.text,
    icon: "🚨",
    order: 1
  },
  {
    id: "high",
    title: "High",
    color: colors.orange.bg,
    borderColor: colors.orange.border,
    textColor: colors.orange.text,
    icon: "⬆️",
    order: 2
  },
  {
    id: "medium",
    title: "Medium",
    color: colors.yellow.bg,
    borderColor: colors.yellow.border,
    textColor: colors.yellow.text,
    icon: "➡️",
    order: 3
  },
  {
    id: "low",
    title: "Low",
    color: colors.green.bg,
    borderColor: colors.green.border,
    textColor: colors.green.text,
    icon: "⬇️",
    order: 4
  }
]

const getThemeAwareTypeLanes = (colors: ReturnType<typeof getThemeAwareColors>): LaneConfig[] => [
  {
    id: "design",
    title: "Design",
    color: colors.purple.bg,
    borderColor: colors.purple.border,
    textColor: colors.purple.text,
    icon: "🎨",
    order: 1
  },
  {
    id: "development",
    title: "Development",
    color: colors.blue.bg,
    borderColor: colors.blue.border,
    textColor: colors.blue.text,
    icon: "💻",
    order: 2
  },
  {
    id: "document",
    title: "Document",
    color: colors.yellow.bg,
    borderColor: colors.yellow.border,
    textColor: colors.yellow.text,
    icon: "📄",
    order: 3
  },
  {
    id: "testing",
    title: "Testing",
    color: colors.green.bg,
    borderColor: colors.green.border,
    textColor: colors.green.text,
    icon: "🧪",
    order: 4
  }
]

const getThemeAwareTimeLanes = (colors: ReturnType<typeof getThemeAwareColors>): LaneConfig[] => [
  {
    id: "today",
    title: "Today",
    color: colors.red.bg,
    borderColor: colors.red.border,
    textColor: colors.red.text,
    icon: "🔥",
    order: 1
  },
  {
    id: "this-week",
    title: "This Week",
    color: colors.orange.bg,
    borderColor: colors.orange.border,
    textColor: colors.orange.text,
    icon: "📅",
    order: 2
  },
  {
    id: "next-week",
    title: "Next Week",
    color: colors.yellow.bg,
    borderColor: colors.yellow.border,
    textColor: colors.yellow.text,
    icon: "⏭️",
    order: 3
  },
  {
    id: "later",
    title: "Later",
    color: colors.gray.bg,
    borderColor: colors.gray.border,
    textColor: colors.gray.text,
    icon: "⏰",
    order: 4
  }
]

// Helper functions to create custom lanes from user configuration
const getCustomStatusLanes = (statuses: string[], colors: ReturnType<typeof getThemeAwareColors>): LaneConfig[] => {
  const statusIcons: Record<string, string> = {
    "todo": "📋",
    "in-progress": "🔄",
    "review": "👀",
    "testing": "🧪",
    "done": "✅",
    "lane-review": "👀"
  }
  
  const statusColors: Record<string, { bg: string; border: string; text: string }> = {
    "todo": colors.gray,
    "in-progress": colors.blue,
    "review": colors.yellow,
    "testing": colors.purple,
    "done": colors.green,
    "lane-review": colors.yellow
  }

  return statuses.map((status, index) => ({
    id: status,
    title: status === "in-progress" ? "In Progress" : 
           status === "lane-review" ? "Lane Review" :
           status.charAt(0).toUpperCase() + status.slice(1),
    color: statusColors[status]?.bg || statusColors.todo.bg,
    borderColor: statusColors[status]?.border || statusColors.todo.border,
    textColor: statusColors[status]?.text || statusColors.todo.text,
    icon: statusIcons[status] || "📋",
    order: index + 1
  }))
}

const getCustomPriorityLanes = (priorities: string[], colors: ReturnType<typeof getThemeAwareColors>): LaneConfig[] => {
  const priorityIcons: Record<string, string> = {
    "urgent": "🚨",
    "high": "🔴",
    "medium": "🟡",
    "low": "🟢"
  }
  
  const priorityColors: Record<string, { bg: string; border: string; text: string }> = {
    "urgent": colors.red,
    "high": colors.orange,
    "medium": colors.yellow,
    "low": colors.green
  }

  return priorities.map((priority, index) => ({
    id: priority,
    title: priority === "high" ? "High Priority" :
           priority === "medium" ? "Medium Priority" :
           priority === "low" ? "Low Priority" :
           priority.charAt(0).toUpperCase() + priority.slice(1),
    color: priorityColors[priority]?.bg || priorityColors.medium.bg,
    borderColor: priorityColors[priority]?.border || priorityColors.medium.border,
    textColor: priorityColors[priority]?.text || priorityColors.medium.text,
    icon: priorityIcons[priority] || "⚪",
    order: index + 1
  }))
}

const getCustomTypeLanes = (types: string[], colors: ReturnType<typeof getThemeAwareColors>): LaneConfig[] => {
  const typeIcons: Record<string, string> = {
    "design": "🎨",
    "development": "💻",
    "document": "📄",
    "documentation": "📝",
    "testing": "🧪",
    "meeting": "🤝",
    "research": "🔍",
    "planning": "📋",
    "review": "👀",
    "bug": "🐛",
    "feature": "✨"
  }
  
  const typeColors: Record<string, { bg: string; border: string; text: string }> = {
    "design": colors.purple,
    "development": colors.blue,
    "document": colors.green,
    "documentation": colors.green,
    "testing": colors.purple,
    "meeting": colors.blue,
    "research": colors.orange,
    "planning": colors.blue,
    "review": colors.yellow,
    "bug": colors.red,
    "feature": colors.green
  }

  return types.map((type, index) => ({
    id: type,
    title: type.charAt(0).toUpperCase() + type.slice(1),
    color: typeColors[type]?.bg || typeColors.development.bg,
    borderColor: typeColors[type]?.border || typeColors.development.border,
    textColor: typeColors[type]?.text || typeColors.development.text,
    icon: typeIcons[type] || "📋",
    order: index + 1
  }))
}

const getCustomTimeLanes = (timeFrames: string[], colors: ReturnType<typeof getThemeAwareColors>): LaneConfig[] => {
  const timeIcons: Record<string, string> = {
    "today": "⏰",
    "this-week": "📅",
    "this-month": "📆",
    "next-week": "📆",
    "next-month": "📅",
    "later": "⏰"
  }
  
  const timeColors: Record<string, { bg: string; border: string; text: string }> = {
    "today": colors.red,
    "this-week": colors.orange,
    "this-month": colors.yellow,
    "next-week": colors.yellow,
    "next-month": colors.blue,
    "later": colors.gray
  }

  return timeFrames.map((timeFrame, index) => ({
    id: timeFrame,
    title: timeFrame === "this-week" ? "This Week" :
           timeFrame === "next-week" ? "Next Week" :
           timeFrame === "this-month" ? "This Month" :
           timeFrame === "next-month" ? "Next Month" :
           timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1),
    color: timeColors[timeFrame]?.bg || timeColors.later.bg,
    borderColor: timeColors[timeFrame]?.border || timeColors.later.border,
    textColor: timeColors[timeFrame]?.text || timeColors.later.text,
    icon: timeIcons[timeFrame] || "⏰",
    order: index + 1
  }))
}

// Get the field name for grouping tasks
export const getGroupingField = (laneType: LaneType): string => {
  switch (laneType) {
    case "status":
      return "status"
    case "priority":
      return "priority" 
    case "type":
      return "type"
    case "time":
      return "timeFrame"
    case "category":
      return "category"
    case "assignee":
      return "assignee"
    default:
      return "status"
  }
}
