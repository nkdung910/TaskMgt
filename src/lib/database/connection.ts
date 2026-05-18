import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with connection pooling and error handling
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'], // Only log errors, no query logs
  errorFormat: 'pretty',
})

// Connection management for development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

// Simple health check function
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { connected: true, message: 'Database connected successfully' }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { connected: false, message: 'Database connection failed', error }
  }
}

