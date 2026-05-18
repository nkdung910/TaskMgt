/**
 * Swagger/OpenAPI Configuration
 * 
 * API documentation configuration for TaskMgt application
 */

import swaggerJsdoc from 'swagger-jsdoc'
import { APP_VERSION, APP_NAME } from './version'

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: `${APP_NAME} API`,
    version: APP_VERSION,
    description: 'Task Management & Tech News Platform API Documentation',
    contact: {
      name: 'TaskMgt Team',
      url: 'https://github.com/yourusername/taskmgt'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://taskmgt-virid.vercel.app',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'Session cookie from NextAuth'
      }
    },
    schemas: {
      Task: {
        type: 'object',
        required: ['id', 'title', 'status', 'userId'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique task identifier',
            example: 'clx1234567890'
          },
          title: {
            type: 'string',
            description: 'Task title',
            example: 'Implement user authentication'
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Detailed task description',
            example: 'Add JWT-based authentication system'
          },
          status: {
            type: 'string',
            enum: ['todo', 'in-progress', 'review', 'testing', 'done'],
            description: 'Task status',
            example: 'in-progress'
          },
          priority: {
            type: 'string',
            enum: ['urgent', 'high', 'medium', 'low'],
            description: 'Task priority',
            example: 'high'
          },
          type: {
            type: 'string',
            enum: ['design', 'development', 'document', 'testing'],
            description: 'Task type',
            example: 'development'
          },
          timeFrame: {
            type: 'string',
            enum: ['today', 'this-week', 'next-week', 'later'],
            description: 'Time frame',
            example: 'this-week'
          },
          category: {
            type: 'string',
            description: 'Task category',
            example: 'work'
          },
          assignee: {
            type: 'string',
            nullable: true,
            description: 'Assigned person',
            example: 'john.doe'
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Due date',
            example: '2025-10-20T00:00:00Z'
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Task tags',
            example: ['authentication', 'security']
          },
          userId: {
            type: 'string',
            description: 'Owner user ID',
            example: 'user123'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
            example: '2025-10-12T10:00:00Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
            example: '2025-10-12T15:30:00Z'
          },
          completedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Completion timestamp',
            example: '2025-10-12T16:00:00Z'
          }
        }
      },
      NewsArticle: {
        type: 'object',
        required: ['id', 'title', 'content', 'url', 'source'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique article identifier',
            example: 'news123'
          },
          title: {
            type: 'string',
            description: 'Article title',
            example: 'React 19 Released'
          },
          content: {
            type: 'string',
            description: 'Article content',
            example: 'React 19 introduces new features...'
          },
          summary: {
            type: 'string',
            nullable: true,
            description: 'Article summary',
            example: 'React 19 brings performance improvements'
          },
          url: {
            type: 'string',
            format: 'uri',
            description: 'Article URL',
            example: 'https://react.dev/blog/react-19'
          },
          source: {
            type: 'string',
            description: 'News source',
            example: 'TechCrunch'
          },
          author: {
            type: 'string',
            nullable: true,
            description: 'Article author',
            example: 'John Doe'
          },
          publishedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Publication date',
            example: '2025-10-12T14:00:00Z'
          },
          relevanceScore: {
            type: 'number',
            format: 'float',
            minimum: 0,
            maximum: 1,
            description: 'Relevance score (0-1)',
            example: 0.85
          },
          roleScores: {
            type: 'object',
            description: 'Role-based relevance scores',
            properties: {
              developer: {
                type: 'number',
                example: 0.6
              },
              qc: {
                type: 'number',
                example: 0.4
              },
              ba: {
                type: 'number',
                example: 0.3
              }
            }
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Article tags',
            example: ['react', 'javascript', 'web']
          },
          category: {
            type: 'string',
            nullable: true,
            description: 'Article category',
            example: 'Software Development'
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
            nullable: true,
            description: 'Article image URL',
            example: 'https://example.com/image.jpg'
          },
          isBookmarked: {
            type: 'boolean',
            description: 'Whether user bookmarked this article',
            example: false
          }
        }
      },
      User: {
        type: 'object',
        required: ['id', 'email'],
        properties: {
          id: {
            type: 'string',
            description: 'User ID',
            example: 'user123'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email',
            example: 'user@example.com'
          },
          rolePreferences: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['developer', 'qc', 'ba']
            },
            description: 'Preferred news roles',
            example: ['developer', 'qc']
          },
          minRelevance: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            description: 'Minimum relevance threshold (%)',
            example: 50
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Invalid request'
          },
          code: {
            type: 'string',
            description: 'Error code',
            example: 'VALIDATION_ERROR'
          }
        }
      }
    }
  },
  security: [
    {
      cookieAuth: []
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization'
    },
    {
      name: 'Tasks',
      description: 'Task management operations'
    },
    {
      name: 'News',
      description: 'News articles and aggregation'
    },
    {
      name: 'User',
      description: 'User preferences and configuration'
    },
    {
      name: 'Health',
      description: 'System health and status'
    }
  ]
}

const options = {
  swaggerDefinition,
  apis: [
    './src/app/api/**/*.ts',
    './src/app/api/**/*.js'
  ]
}

export const swaggerSpec = swaggerJsdoc(options)

