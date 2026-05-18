import { NextResponse } from "next/server"
import { checkDatabaseConnection } from "@/lib/database"
import { APP_VERSION, API_VERSION, APP_NAME } from "@/lib/version"

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the application and database connection
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                 environment:
 *                   type: string
 *                   example: production
 *       503:
 *         description: Database connection failed
 *       500:
 *         description: Health check failed
 */
export async function GET() {
  try {
    const dbStatus = await checkDatabaseConnection()
    
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: {
        app: APP_VERSION,
        api: API_VERSION,
        name: APP_NAME
      },
      database: dbStatus,
      environment: process.env.NODE_ENV || "development"
    }

    const statusCode = dbStatus.connected ? 200 : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    console.error("Health check failed:", error)
    
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
      environment: process.env.NODE_ENV || "development"
    }, { status: 500 })
  }
}
