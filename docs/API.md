# TaskMgt API Documentation

**Version**: 1.5.0  
**Base URL**: `/api`

## Overview

TaskMgt provides a comprehensive REST API for task management, user authentication, and news integration. All endpoints are documented with Swagger/OpenAPI specifications.

## Authentication

Most API endpoints require authentication via NextAuth.js session cookies.

### Headers
```
Content-Type: application/json
Cookie: next-auth.session-token=<session_token>
```

## Core Endpoints

### Tasks API

#### Get Tasks
- **GET** `/api/tasks`
- **Description**: Retrieve user's tasks with optional filtering
- **Query Parameters**:
  - `status` (optional): Filter by task status
  - `priority` (optional): Filter by priority level
  - `category` (optional): Filter by category
  - `limit` (optional): Number of tasks to return
  - `offset` (optional): Pagination offset

#### Create Task
- **POST** `/api/tasks`
- **Description**: Create a new task
- **Body**:
```json
{
  "title": "Task title",
  "description": "Task description",
  "status": "todo",
  "priority": "medium",
  "type": "feature",
  "timeFrame": "short",
  "category": "development",
  "assignee": "user@example.com",
  "dueDate": "2025-12-31T23:59:59Z",
  "tags": ["urgent", "frontend"]
}
```

#### Update Task
- **PUT** `/api/tasks/[id]`
- **Description**: Update an existing task
- **Body**: Same as create task (partial updates supported)

#### Delete Task
- **DELETE** `/api/tasks/[id]`
- **Description**: Delete a task

### News API

#### Get News Articles
- **GET** `/api/news`
- **Description**: Retrieve news articles with filtering
- **Query Parameters**:
  - `category` (optional): Filter by news category
  - `source` (optional): Filter by news source
  - `tags` (optional): Filter by tags
  - `limit` (optional): Number of articles to return
  - `offset` (optional): Pagination offset

#### Get Daily Digest
- **GET** `/api/news/digest`
- **Description**: Get personalized daily news digest
- **Query Parameters**:
  - `date` (optional): Specific date (YYYY-MM-DD format)

#### Bookmark Article
- **POST** `/api/news/bookmarks`
- **Description**: Bookmark a news article
- **Body**:
```json
{
  "articleId": "article-uuid"
}
```

### User Configuration API

#### Get User Config
- **GET** `/api/user/news-preferences`
- **Description**: Get user's news preferences and configuration

#### Update User Config
- **PUT** `/api/user/news-preferences`
- **Description**: Update user's news preferences
- **Body**:
```json
{
  "roles": ["developer", "qc"],
  "minRelevance": 70,
  "sources": ["hackernews", "github"],
  "categories": ["development", "testing"]
}
```

## Admin Endpoints

### News Management

#### Fetch Latest News
- **POST** `/api/admin/news/fetch`
- **Description**: Manually trigger news fetching
- **Authentication**: Admin only

#### Aggregate News
- **POST** `/api/admin/news/aggregate`
- **Description**: Process and store news articles
- **Authentication**: Admin only

#### Generate Digest
- **POST** `/api/admin/news/digest`
- **Description**: Generate daily digest for all users
- **Authentication**: Admin only

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

- **General API**: 100 requests per minute per user
- **News API**: 50 requests per minute per user
- **Admin API**: 20 requests per minute per admin

## Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **429**: Too Many Requests
- **500**: Internal Server Error

## Interactive Documentation

Visit `/api-docs` in your browser for interactive Swagger documentation with live API testing capabilities.

## Examples

### JavaScript/TypeScript
```typescript
// Get user's tasks
const response = await fetch('/api/tasks', {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
});
const tasks = await response.json();

// Create a new task
const newTask = await fetch('/api/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Implement new feature',
    description: 'Add user authentication',
    status: 'todo',
    priority: 'high',
    type: 'feature'
  })
});
```

### cURL
```bash
# Get tasks
curl -X GET "https://your-domain.com/api/tasks" \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=your-session-token"

# Create task
curl -X POST "https://your-domain.com/api/tasks" \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=your-session-token" \
  -d '{
    "title": "New task",
    "status": "todo",
    "priority": "medium"
  }'
```

## Support

For API support and questions, please refer to the main documentation or contact the development team.

