"use server"

import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { AuthOptionsCompat } from "@/lib/auth/types"
import { prisma } from "@/lib/database"
import { UserConfigData, DEFAULT_USER_CONFIG } from "@/lib/config/types"

// Create default configuration for a new user
export async function createUserConfig(userId: string) {
  try {
    const config = await prisma.userConfig.create({
      data: {
        userId,
        statuses: DEFAULT_USER_CONFIG.statuses,
        priorities: DEFAULT_USER_CONFIG.priorities,
        types: DEFAULT_USER_CONFIG.types,
        timeFrames: DEFAULT_USER_CONFIG.timeFrames,
        categories: DEFAULT_USER_CONFIG.categories,
        assignees: DEFAULT_USER_CONFIG.assignees
      }
    })

    return { success: true, config }
  } catch (error) {
    console.error("Error creating user config:", error)
    return { error: `Failed to create user configuration: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Get user configuration
export async function getUserConfig() {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    let config = await prisma.userConfig.findUnique({
      where: { userId: session.user.id }
    })

    // If no config exists, create default one
    if (!config) {
      const result = await createUserConfig(session.user.id)
      if (result.error) {
        return { error: result.error }
      }
      config = result.config || null
    }

    return { success: true, config }
  } catch (error) {
    console.error("Error fetching user config:", error)
    return { error: `Failed to fetch user configuration: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Update user configuration
export async function updateUserConfig(configData: Partial<UserConfigData>) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    // First ensure config exists
    let config = await prisma.userConfig.findUnique({
      where: { userId: session.user.id }
    })

    if (!config) {
      const createResult = await createUserConfig(session.user.id)
      if (createResult.error) {
        return { error: createResult.error }
      }
      config = createResult.config || null
    }

    // Update the configuration
    const updatedConfig = await prisma.userConfig.update({
      where: { userId: session.user.id },
      data: {
        ...(configData.statuses && { statuses: configData.statuses }),
        ...(configData.priorities && { priorities: configData.priorities }),
        ...(configData.types && { types: configData.types }),
        ...(configData.timeFrames && { timeFrames: configData.timeFrames }),
        ...(configData.categories && { categories: configData.categories }),
        ...(configData.assignees && { assignees: configData.assignees })
      }
    })

    return { success: true, config: updatedConfig }
  } catch (error) {
    console.error("Error updating user config:", error)
    return { error: `Failed to update user configuration: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Add a new value to a configuration category
export async function addConfigValue(category: keyof UserConfigData, value: string) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    // Get current config
    const configResult = await getUserConfig()
    if (configResult.error) {
      return { error: configResult.error }
    }

    const currentConfig = configResult.config!
    const currentValues = currentConfig[category] || []

    // Check if value already exists
    if (currentValues.includes(value)) {
      return { error: `Value '${value}' already exists in ${category}` }
    }

    // Add the new value
    const updatedValues = [...currentValues, value]

    // Update the configuration
    const updateData = { [category]: updatedValues } as Partial<UserConfigData>
    return await updateUserConfig(updateData)
  } catch (error) {
    console.error("Error adding config value:", error)
    return { error: `Failed to add configuration value: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Remove a value from a configuration category
export async function removeConfigValue(category: keyof UserConfigData, value: string) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    // Get current config
    const configResult = await getUserConfig()
    if (configResult.error) {
      return { error: configResult.error }
    }

    const currentConfig = configResult.config!
    const currentValues = currentConfig[category] || []

    // Remove the value
    const updatedValues = currentValues.filter((v: string) => v !== value)

    // Don't allow removing all values
    if (updatedValues.length === 0) {
      return { error: `Cannot remove all values from ${category}. At least one value must remain.` }
    }

    // Update the configuration
    const updateData = { [category]: updatedValues } as Partial<UserConfigData>
    return await updateUserConfig(updateData)
  } catch (error) {
    console.error("Error removing config value:", error)
    return { error: `Failed to remove configuration value: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Reset configuration to defaults
export async function resetUserConfig() {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    return await updateUserConfig(DEFAULT_USER_CONFIG)
  } catch (error) {
    console.error("Error resetting user config:", error)
    return { error: `Failed to reset user configuration: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}
