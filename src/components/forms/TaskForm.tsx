"use client"

import { useState } from "react"
import { createTask } from "@/lib/tasks"
import Calendar from "@/components/Calendar"
import { showToast } from "@/lib/utils"

interface TaskFormProps {
  onTaskCreated?: () => void
}

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState("medium")
  const [type, setType] = useState("development")
  const [timeFrame, setTimeFrame] = useState("this-week")
  const [category, setCategory] = useState("general")
  const [tags, setTags] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (loading) return
    
    setLoading(true)

    try {
      // Parse tags from comma-separated string
      const tagsArray = tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
      
      // Add timeout to prevent hanging
      const createTaskPromise = createTask({
        title,
        description,
        dueDate: dueDate || null,
        priority,
        type,
        timeFrame,
        category,
        tags: tagsArray
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      )
      
      const result = await Promise.race([createTaskPromise, timeoutPromise]) as { error?: string; success?: boolean; task?: Record<string, unknown> }

      if (result?.error) {
        showToast.error(`Error: ${result.error}`)
      } else {
        showToast.success("Task created successfully!")
        setTitle("")
        setDescription("")
        setDueDate("")
        setPriority("medium")
        setTags("")
        // Call the callback to refresh the task list
        onTaskCreated?.()
      }
    } catch {
      showToast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-2">
          Task Title *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
          placeholder="What needs to be done?"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
          placeholder="Add more details about this task..."
        />
      </div>

      <div>
        <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-800 mb-2">
          Due Date
        </label>
        <Calendar
          value={dueDate}
          onChange={setDueDate}
          placeholder="Select due date"
          calendarOnly={true}
          compact={true}
          height="h-12"
        />
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-semibold text-gray-800 mb-2">
          Priority
        </label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
        >
          <option value="urgent">🚨 Urgent</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-semibold text-gray-800 mb-2">
          Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
        >
          <option value="design">🎨 Design</option>
          <option value="development">💻 Development</option>
          <option value="document">📄 Document</option>
          <option value="testing">🧪 Testing</option>
        </select>
      </div>

      <div>
        <label htmlFor="timeFrame" className="block text-sm font-semibold text-gray-800 mb-2">
          Time Frame
        </label>
        <select
          id="timeFrame"
          value={timeFrame}
          onChange={(e) => setTimeFrame(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
        >
          <option value="today">🔥 Today</option>
          <option value="this-week">📅 This Week</option>
          <option value="next-week">📆 Next Week</option>
          <option value="later">⏰ Later</option>
        </select>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-semibold text-gray-800 mb-2">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
        >
          <option value="general">📝 General</option>
          <option value="work">💼 Work</option>
          <option value="personal">👤 Personal</option>
          <option value="shopping">🛒 Shopping</option>
          <option value="health">🏥 Health</option>
          <option value="finance">💰 Finance</option>
          <option value="travel">✈️ Travel</option>
          <option value="home">🏠 Home</option>
          <option value="education">📚 Education</option>
          <option value="entertainment">🎬 Entertainment</option>
          <option value="family">👨‍👩‍👧‍👦 Family</option>
          <option value="fitness">💪 Fitness</option>
        </select>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-semibold text-gray-800 mb-2">
          Tags
        </label>
        <input
          type="text"
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          maxLength={30}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
          placeholder="e.g., @office, #coding, $project-name (comma separated)"
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">
            Use prefixes: @ (context), # (type), $ (project), ⚡ (energy), ⏱ (duration), 👤 (person)
          </p>
          <p className="text-xs text-gray-400">
            {tags.length}/30
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Task...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Task
          </div>
        )}
      </button>

    </form>
  )
}
