// Type alias to work around NextAuth v4 + Next.js 15 compatibility issues
// This avoids ESLint errors while maintaining type safety
export type AuthOptionsCompat = Record<string, unknown>

