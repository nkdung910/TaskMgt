import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger'

/**
 * @swagger
 * /api/docs/json:
 *   get:
 *     summary: Download OpenAPI specification as JSON
 *     description: Downloads the OpenAPI specification file
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI JSON file
 */
export async function GET() {
  return new NextResponse(JSON.stringify(swaggerSpec, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="openapi.json"'
    }
  })
}

