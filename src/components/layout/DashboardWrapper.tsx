"use client"

import { useState, useEffect, useCallback } from "react"
import { getTasks, getAvailableValues } from "@/lib/tasks"
import { LaneType } from "@/components/layout/LaneSwitcher"
import TaskModal from "@/components/features/tasks/TaskModal"
import DrawerNavigation from "@/components/layout/DrawerNavigation"
import type { Session } from "next-auth"


interface DashboardWrapperProps {
  session: Session
}

export default function DashboardWrapper({ session }: DashboardWrapperProps) {
  const [filters, setFilters] = useState<{
    search?: string
    status?: string
    priority?: string
    tags?: string[]
    assignee?: string
    type?: string
    category?: string
    timeFrame?: string
    dueDateFrom?: string
    dueDateTo?: string
  }>({})
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([])
  const [availablePriorities, setAvailablePriorities] = useState<string[]>([])
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [availableTimeFrames, setAvailableTimeFrames] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableAssignees, setAvailableAssignees] = useState<string[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [laneType, setLaneType] = useState<LaneType>("status")
  
  // Modal state for creating tasks
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Fetch all data including user configuration and task tags
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch tasks for tags
        const tasksResult = await getTasks()
        if (tasksResult?.success && tasksResult.tasks && Array.isArray(tasksResult.tasks)) {
          // Count tag frequency and get top tags
          const tagFrequency = new Map<string, number>()
          tasksResult.tasks.forEach((task: Record<string, unknown>) => {
            if (task.tags && Array.isArray(task.tags)) {
              task.tags.forEach((tag: string) => {
                tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1)
              })
            }
          })
          
          // Sort by frequency (descending) and get top 20 tags
          const topTags = Array.from(tagFrequency.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([tag]) => tag)
          
          setAvailableTags(topTags)
        }

        // Fetch available values from user configuration
        const valuesResult = await getAvailableValues()
        if (valuesResult?.success && valuesResult.values) {
          setAvailableStatuses(valuesResult.values.statuses)
          setAvailablePriorities(valuesResult.values.priorities)
          setAvailableTypes(valuesResult.values.types)
          setAvailableTimeFrames(valuesResult.values.timeFrames)
          setAvailableCategories(valuesResult.values.categories)
          setAvailableAssignees(valuesResult.values.assignees)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchAllData()
  }, [refreshTrigger])

  const handleFilterChange = useCallback((newFilters: {
    search?: string
    status?: string
    priority?: string
    tags?: string[]
    assignee?: string
    type?: string
    category?: string
    timeFrame?: string
    dueDateFrom?: string
    dueDateTo?: string
  }) => {
    setFilters(newFilters)
  }, [])

  const handleTaskCreated = useCallback(() => {
    // Trigger refresh of both task list and available tags
    setRefreshTrigger(prev => prev + 1)
  }, [])

  const handleTaskStatusChange = useCallback(() => {
    // No automatic filter adjustment - let the task disappear if it doesn't match the filter
    // This is the expected behavior of a filter
  }, [])

  return (
    <>
      {/* Drawer Navigation with Kanban Board */}
      <DrawerNavigation
        filters={filters}
        refreshTrigger={refreshTrigger}
        onTaskCreated={handleTaskCreated}
        onTaskStatusChange={handleTaskStatusChange}
        availableTags={availableTags}
        availableStatuses={availableStatuses}
        availablePriorities={availablePriorities}
        availableTypes={availableTypes}
        availableTimeFrames={availableTimeFrames}
        availableCategories={availableCategories}
        availableAssignees={availableAssignees}
        laneType={laneType}
        onLaneTypeChange={setLaneType}
        onFilterChange={handleFilterChange}
        onCreateTask={() => setCreateModalOpen(true)}
        session={session}
      />

      {/* Create Task Modal */}
      <TaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        mode="create"
        onTaskSaved={handleTaskCreated}
        availablePriorities={availablePriorities}
        availableTypes={availableTypes}
        availableTimeFrames={availableTimeFrames}
        availableCategories={availableCategories}
        availableAssignees={availableAssignees}
      />
    </>
  )
}
