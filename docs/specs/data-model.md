# Data Model: TaskMgt

**Version**: 1.5.0  
**Last Updated**: October 15, 2025  
**Database**: PostgreSQL with Prisma ORM

## Overview

TaskMgt uses a comprehensive data model supporting task management, tech news integration, and user personalization. The schema includes 6 main entities with full relationships and constraints.

## Database Schema (Prisma)

### User Entity
```prisma
model User {
  id               String         @id @default(cuid())
  email            String         @unique
  password         String
  resetToken       String?        @map("reset_token")
  resetTokenExpiry DateTime?      @map("reset_token_expiry")
  rolePreferences  String[]       @default(["developer"]) @map("role_preferences")
  minRelevance     Int            @default(50) @map("min_relevance")
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")
  tasks            Task[]
  bookmarks        NewsBookmark[]
  digests          NewsDigest[]
  config           UserConfig?

  @@map("app_users")
}
```

**Business Rules**:
- Email must be unique across all users
- Password must be hashed with bcrypt (12+ rounds)
- Each user owns their tasks, bookmarks, and digests (data isolation)
- **v1.4.0**: Reset token is cryptographically secure (crypto.randomBytes(32))
- **v1.4.0**: Reset token expires exactly 1 hour after generation
- **v1.5.0**: Role preferences for news personalization (developer, qc, ba)
- **v1.5.0**: Minimum relevance threshold for news filtering (0-100)

### Task Entity
```prisma
model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      String    @default("todo")
  priority    String    @default("medium")
  type        String    @default("development")
  timeFrame   String    @default("this-week") @map("time_frame")
  category    String    @default("general")
  assignee    String?
  dueDate     DateTime? @map("due_date")
  tags        String[]  @default([])
  userId      String    @map("user_id")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  completedAt DateTime? @map("completed_at")
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Business Rules**:
- Title is required, description is optional
- Status: "todo", "in-progress", "review", "testing", "done"
- Priority: "urgent", "high", "medium", "low"
- Type: "design", "development", "document", "testing"
- Time Frame: "today", "this-week", "next-week", "later"
- Category: "general", "work", "personal", "shopping", "health", "finance"
- Assignee: Optional user assignment
- Tags stored as string array for flexible categorization
- Tasks belong to specific user (data isolation)
- Soft delete: completedAt marks completion, no hard deletion

### NewsArticle Entity
```prisma
model NewsArticle {
  id             String         @id @default(cuid())
  title          String
  content        String
  summary        String?
  url            String         @unique
  source         String
  author         String?
  publishedAt    DateTime       @map("published_at")
  relevanceScore Float?         @map("relevance_score")
  tags           String[]       @default([])
  category       String?
  imageUrl       String?        @map("image_url")
  roleScores     Json?          @default("{}") @map("role_scores")
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")
  bookmarks      NewsBookmark[]
}
```

**Business Rules**:
- Title and content are required
- URL must be unique across all articles
- Summary is optional (AI-generated)
- Source indicates news provider
- Relevance score for AI ranking (0-1 scale)
- **v1.5.0**: Role scores stored as JSON for Developer, QC, BA relevance
- **v1.5.0**: Category for news organization
- **v1.5.0**: Image URL for article thumbnails

### NewsBookmark Entity
```prisma
model NewsBookmark {
  id        String      @id @default(cuid())
  userId    String      @map("user_id")
  articleId String      @map("article_id")
  createdAt DateTime    @default(now()) @map("created_at")
  article   NewsArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])
  @@map("news_bookmarks")
}
```

**Business Rules**:
- Unique constraint on userId + articleId (one bookmark per user per article)
- Bookmarks belong to specific user (data isolation)
- Cascade delete when user or article is deleted

### NewsDigest Entity
```prisma
model NewsDigest {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  date      DateTime
  articles  String[]
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@map("news_digests")
}
```

**Business Rules**:
- Unique constraint on userId + date (one digest per user per day)
- Articles stored as array of article IDs
- Digests belong to specific user (data isolation)
- **v1.5.0**: Personalized daily news summaries

### UserConfig Entity
```prisma
model UserConfig {
  id         String   @id @default(cuid())
  userId     String   @unique @map("user_id")
  statuses   String[] @default(["todo", "in-progress", "review", "testing", "done"])
  priorities String[] @default(["urgent", "high", "medium", "low"])
  types      String[] @default(["design", "development", "document", "testing"])
  timeFrames String[] @default(["today", "this-week", "next-week", "later"]) @map("time_frames")
  categories String[] @default(["general", "work", "personal", "shopping", "health", "finance"])
  assignees  String[] @default(["unassigned", "me"])
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_configs")
}
```

**Business Rules**:
- One-to-one relationship with User
- Customizable task attributes for each user
- Default values provided for new users
- **v1.5.0**: User-specific task management configuration

## Entity Relationships

```
User (1) ←→ (many) Task
User (1) ←→ (many) NewsBookmark
User (1) ←→ (many) NewsDigest
User (1) ←→ (1) UserConfig
NewsArticle (1) ←→ (many) NewsBookmark
```

**Constraints**:
- Cascade delete: When user is deleted, all related data is deleted
- Foreign key constraints ensure referential integrity
- User isolation: Users can only access their own data
- Unique constraints prevent duplicate bookmarks and digests

## Validation Rules

### User Validation
- Email: Valid email format, unique, required
- Password: Minimum 6 characters, hashed with bcrypt (12+ rounds)
- **v1.4.0** Reset Token: Optional, 64-character hex string
- **v1.4.0** Reset Token Expiry: Optional, must be future timestamp
- **v1.5.0** Role Preferences: Array of strings, valid roles: "developer", "qc", "ba"
- **v1.5.0** Min Relevance: Integer, 0-100 range

### Task Validation
- Title: Required, max 200 characters
- Description: Optional, max 1000 characters
- Status: Must be one of configured statuses
- Priority: Must be one of configured priorities
- Type: Must be one of configured types
- Time Frame: Must be one of configured time frames
- Category: Must be one of configured categories
- Assignee: Optional, must be valid assignee
- Due Date: Optional, must be future date
- Tags: Array of strings, max 10 tags, each tag max 30 characters

### NewsArticle Validation
- Title: Required, max 200 characters
- Content: Required, max 50000 characters
- URL: Required, valid URL format, unique
- Summary: Optional, max 2000 characters
- Source: Required, max 100 characters
- Author: Optional, max 100 characters
- Relevance Score: Optional, 0-1 range
- **v1.5.0** Role Scores: JSON object with developer, qc, ba scores (0-1)
- **v1.5.0** Category: Optional, max 50 characters
- **v1.5.0** Image URL: Optional, valid URL format

### UserConfig Validation
- Statuses: Array of strings, max 20 items, each max 50 characters
- Priorities: Array of strings, max 20 items, each max 50 characters
- Types: Array of strings, max 20 items, each max 50 characters
- Time Frames: Array of strings, max 20 items, each max 50 characters
- Categories: Array of strings, max 20 items, each max 50 characters
- Assignees: Array of strings, max 20 items, each max 100 characters

## Database Indexes

```sql
-- User indexes
CREATE INDEX idx_users_email ON app_users(email);
CREATE INDEX idx_reset_token ON app_users(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX idx_reset_token_expiry ON app_users(reset_token_expiry) WHERE reset_token_expiry IS NOT NULL;

-- Task indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at) WHERE completed_at IS NOT NULL;

-- News Article indexes
CREATE INDEX idx_news_articles_source ON news_articles(source);
CREATE INDEX idx_news_articles_category ON news_articles(category);
CREATE INDEX idx_news_articles_published_at ON news_articles(published_at);
CREATE INDEX idx_news_articles_relevance_score ON news_articles(relevance_score) WHERE relevance_score IS NOT NULL;
CREATE INDEX idx_news_articles_created_at ON news_articles(created_at);

-- News Bookmark indexes
CREATE INDEX idx_news_bookmarks_user_id ON news_bookmarks(user_id);
CREATE INDEX idx_news_bookmarks_article_id ON news_bookmarks(article_id);
CREATE INDEX idx_news_bookmarks_created_at ON news_bookmarks(created_at);

-- News Digest indexes
CREATE INDEX idx_news_digests_user_id ON news_digests(user_id);
CREATE INDEX idx_news_digests_date ON news_digests(date);
CREATE INDEX idx_news_digests_user_date ON news_digests(user_id, date);

-- User Config indexes
CREATE INDEX idx_user_configs_user_id ON user_configs(user_id);
```

## Migration History

### v1.0.0 - Initial Schema
- User, Task, and basic Bookmark entities
- Basic authentication and task management

### v1.4.0 - Password Reset
```sql
-- Add password reset fields to app_users table
ALTER TABLE app_users 
  ADD COLUMN reset_token TEXT,
  ADD COLUMN reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add partial indexes for performance
CREATE INDEX idx_reset_token ON app_users(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX idx_reset_token_expiry ON app_users(reset_token_expiry) WHERE reset_token_expiry IS NOT NULL;
```

### v1.5.0 - Tech News Integration
```sql
-- Add news-related tables
CREATE TABLE news_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  url TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  author TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  relevance_score REAL,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  image_url TEXT,
  role_scores JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE news_bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

CREATE TABLE news_digests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  articles TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Add user preferences for news
ALTER TABLE app_users 
  ADD COLUMN role_preferences TEXT[] DEFAULT '{"developer"}',
  ADD COLUMN min_relevance INTEGER DEFAULT 50;

-- Add completed_at to tasks
ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
```

## Data Access Patterns

### User Isolation
All queries must include user context:
```sql
-- Correct: User-specific tasks
SELECT * FROM tasks WHERE user_id = ? AND status = ?;

-- Incorrect: All tasks (security violation)
SELECT * FROM tasks WHERE status = ?;
```

### Common Queries

#### Task Management
1. **User's tasks by status**: `SELECT * FROM tasks WHERE user_id = ? AND status = ?`
2. **User's tasks with tags**: `SELECT * FROM tasks WHERE user_id = ? AND tags @> ?`
3. **User's overdue tasks**: `SELECT * FROM tasks WHERE user_id = ? AND due_date < NOW()`
4. **User's completed tasks**: `SELECT * FROM tasks WHERE user_id = ? AND completed_at IS NOT NULL`

#### News Management
5. **User's bookmarks**: `SELECT * FROM news_bookmarks WHERE user_id = ? ORDER BY created_at DESC`
6. **Articles by source**: `SELECT * FROM news_articles WHERE source = ? ORDER BY published_at DESC`
7. **Articles by category**: `SELECT * FROM news_articles WHERE category = ? ORDER BY published_at DESC`
8. **User's daily digest**: `SELECT * FROM news_digests WHERE user_id = ? AND date = ?`

#### Authentication
9. **Find user by reset token**: `SELECT * FROM app_users WHERE reset_token = ? AND reset_token_expiry > NOW()`
10. **Find user by email**: `SELECT id, email FROM app_users WHERE email = ?`

## Performance Considerations

### Query Optimization
- Composite indexes for common query patterns
- Partial indexes for optional fields
- JSONB indexes for role scores
- Array indexes for tags and preferences

### Connection Management
- Connection pooling for high concurrency
- Prepared statements for repeated queries
- Query timeout configuration
- Database connection monitoring

### Caching Strategy
- Redis for session storage
- Application-level caching for user configs
- CDN for static assets
- Database query result caching

## Security Considerations

### Data Isolation
- Row-level security: Users can only access their own data
- Application-level filtering: All queries include user_id
- Database-level constraints: Foreign keys enforce relationships
- API rate limiting per user

### Sensitive Data
- Passwords: Always hashed with bcrypt (12+ rounds)
- Reset Tokens: Cryptographically secure, never logged
- User data: Encrypted in transit (HTTPS)
- No sensitive data in logs or error messages

### Input Validation
- SQL injection prevention with parameterized queries
- XSS prevention with input sanitization
- CSRF protection with tokens
- Rate limiting on authentication endpoints

## Backup Strategy

### Current Implementation
- Supabase automatic daily backups
- Manual backup before migrations
- Point-in-time recovery available

### Future Enhancements
- Automated backup verification
- Cross-region backup replication
- Backup encryption
- Disaster recovery testing

## Monitoring and Analytics

### Database Metrics
- Query performance monitoring
- Connection pool utilization
- Index usage statistics
- Slow query identification

### Application Metrics
- User activity tracking
- Task completion rates
- News engagement metrics
- Error rate monitoring

## Future Enhancements

### Planned Features
- Advanced analytics dashboard
- Team collaboration features
- Mobile app integration
- AI-powered task suggestions
- Advanced news filtering
- Export/import functionality

### Schema Evolution
- Version-controlled migrations
- Backward compatibility
- Gradual feature rollouts
- A/B testing support