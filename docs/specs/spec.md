# Feature Specification: Task Management & Tech News Platform

**Feature Branch**: `001-taskmgt`  
**Created**: September 30, 2025  
**Status**: ✅ **IMPLEMENTED & DEPLOYED**  
**Production URL**: https://taskmgt-virid.vercel.app  
**Version**: v1.5.0 - Tech News Integration, Role-Based Filtering & Advanced Analytics  
**Input**: User description: "Daily Task Management (create tasks with title/description/priority/due date; organize via categories/tags; mark complete and track completion; manage priorities; due date tracking/reminders; task analytics). Tech News Summaries (AI-powered concise summaries; daily digests; multiple sources; AI relevance scoring; save/bookmark articles)."

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a professional user, I want to manage my daily tasks and stay informed about relevant tech news, so that I can maintain productivity while keeping up with industry developments.

**Task Management Flow**: Users create tasks with detailed information (title, description, priority, due dates), organize them using categories and tags, track their completion status, and receive reminders for upcoming deadlines. Users can analyze their productivity through task analytics.

**Tech News Flow**: Users access AI-summarized tech news articles from multiple sources, receive personalized daily digests based on relevance scoring, and bookmark articles they find valuable for later reference.

### Acceptance Scenarios

#### Task Management
1. **Given** a user wants to create a new task, **When** they provide title, description, priority level, and due date, **Then** the system creates the task and makes it available for viewing and editing
2. **Given** a user has multiple tasks, **When** they apply categories and tags to organize them, **Then** the system groups and filters tasks accordingly
2a. **Given** a user wants to filter tasks quickly, **When** they select a tag category (e.g., Context, Type, Project), **Then** the system displays available tags within that category for quick selection
2b. **Given** a user applies multiple tags from different categories, **When** they view the task board, **Then** the system filters tasks matching all selected tags (AND logic)
2c. **Given** a user sees task cards with tags, **When** they click on a tag in the task card, **Then** the system filters the kanban board to show only tasks with that tag
2d. **Given** a user has clicked on multiple tags from task cards, **When** they view the filtered results, **Then** the system shows tasks matching all selected tags
3. **Given** a task is due soon, **When** the due date approaches [NEEDS CLARIFICATION: how many hours/days before?], **Then** the system sends a reminder to the user [NEEDS CLARIFICATION: via what channel - email, push notification, in-app?]
4. **Given** a user completes a task, **When** they mark it as complete, **Then** the system updates the task status and includes it in completion tracking
5. **Given** a user wants insights, **When** they access task analytics, **Then** the system displays completion rates, priority distribution, and other metrics
5a. **Given** a user views the Statistics Dashboard, **When** they want to see task completion activity, **Then** the system displays a heat map showing 4 weeks of past completed tasks and 1 week of upcoming due dates
5b. **Given** a user views the heat map, **When** they see the calendar grid, **Then** completed tasks appear in green shades and upcoming tasks appear in blue shades based on task count intensity
5c. **Given** a user clicks on a heat map cell, **When** the cell has tasks, **Then** the system displays a modal showing all tasks for that day with completion times or due times
5d. **Given** a user has completed tasks more than 1 day ago, **When** they view the kanban board, **Then** the system automatically hides these old completed tasks to reduce clutter
5e. **Given** a user views tasks in kanban board mode, **When** they see tasks organized in lanes/columns (e.g., To Do, In Progress, Done), **Then** the system displays tasks in their appropriate status lanes
5f. **Given** a user wants to change a task's status, **When** they drag a task card from one lane to another, **Then** the system updates the task status and persists the change
5g. **Given** a user is dragging a task, **When** they move it over a valid drop zone, **Then** the system provides visual feedback indicating the task can be dropped
5h. **Given** a user views a task card, **When** the task has a due date, **Then** the system displays remaining days or overdue status with appropriate visual indicators
5i. **Given** a user views a task card with multiple tags, **When** there are more than 3 tags, **Then** the system shows the top 3 tags with a "+X more" indicator

#### Authentication & User Management
6. **Given** a new user wants to use the platform, **When** they provide email and password (8+ characters), **Then** the system creates an account and logs them in
6a. **Given** a registered user wants to access the platform, **When** they provide correct email and password, **Then** the system authenticates them and grants access to their data
6b. **Given** a user is logged in, **When** they access tasks or bookmarks, **Then** the system only displays their own data (data isolation)
6c. **Given** a user provides invalid credentials, **When** they attempt to login, **Then** the system shows an error message without revealing which field is incorrect (security)

#### User Configuration & Customization
6d. **Given** a new user signs up, **When** they complete registration, **Then** the system automatically creates default configuration values for status, priority, type, timeframe, category, and assignee fields
6e. **Given** a user wants to customize their task attributes, **When** they access the Settings page, **Then** the system displays their current configuration for all customizable fields
6f. **Given** a user wants to add a new status value, **When** they enter a new status in the Settings, **Then** the system adds it to their configuration and makes it available in filters and kanban lanes
6g. **Given** a user wants to remove a status value, **When** they delete it from their configuration, **Then** the system prevents removal if it would leave them with no status values (ensures at least one value exists)
6h. **Given** a user has customized their configuration, **When** they create or edit tasks, **Then** the system uses their custom values for dropdowns and options instead of system defaults
6i. **Given** a user has customized their configuration, **When** they view the kanban board, **Then** the system generates lanes based on their custom status, priority, type, timeframe, category, or assignee values
6j. **Given** a user wants to reset their configuration, **When** they click the reset button, **Then** the system restores all fields to default values

#### Tech News Summaries
7. **Given** tech news articles are available, **When** the AI processing runs, **Then** the system generates concise summaries while preserving key information
7a. **Given** a user wants to customize their news experience, **When** they access News Preferences in Settings, **Then** the system displays role selection options (Developer, QC, BA, etc.) with article counts and minimum relevance slider
7b. **Given** a user selects specific roles, **When** they view the news feed, **Then** the system displays only articles relevant to their selected roles based on AI role scoring
7c. **Given** a user adjusts minimum relevance score, **When** they set the threshold (0-85%), **Then** the system filters articles to show only those meeting or exceeding the relevance threshold
7d. **Given** a user sets a high relevance threshold (>70%), **When** they view the settings, **Then** the system displays a warning about potentially seeing fewer articles
8. **Given** a user accesses the platform daily, **When** they view their daily digest, **Then** the system presents articles ranked by AI relevance scoring and filtered by user's role preferences
8a. **Given** a user hasn't visited in 24+ hours, **When** they access the news page, **Then** the system automatically fetches fresh news articles if needed
9. **Given** multiple news sources are available, **When** articles are aggregated, **Then** the system displays content from diverse sources including RSS feeds and NewsAPI
10. **Given** a user finds an article valuable, **When** they save/bookmark it, **Then** the system stores the article for later access
11. **Given** a user has bookmarked articles, **When** they access their saved items, **Then** the system displays all bookmarked articles organized by date

### Edge Cases
- What happens when a user tries to sign up with an email that already exists?
- ✅ **RESOLVED v1.4.0**: How does the system handle forgotten passwords? → Full password reset flow via email with secure tokens
- What happens when a user's session expires while they're working?
- ✅ **RESOLVED v1.4.0**: What if user requests password reset for non-existent email? → Generic success message (security)
- ✅ **RESOLVED v1.4.0**: What if reset token expires? → Show error and prompt to request new reset link
- ✅ **RESOLVED v1.4.0**: What if user tries to reuse reset token? → Token cleared after use, cannot reuse
- What happens when a task due date is in the past and the task is not completed?
- How does the system handle tasks with no due date?
- What happens if a user tries to drag a task but drops it in an invalid location?
- How does the system handle drag-and-drop on mobile/touch devices?
- What happens if a network error occurs while a task is being dragged between lanes?
- What happens if the AI summarization service is unavailable?
- How does the system handle news articles from sources that update or delete content after being summarized?
- What happens when a user tries to create a task with invalid or missing required fields?
- How does the system handle duplicate news articles from different sources?
- What happens to reminder notifications if the user changes a task's due date?
- How are categories/tags managed when they're no longer used by any tasks?
- How does keyboard navigation work for drag-and-drop operations (accessibility)?

## Requirements *(mandatory)*

### Functional Requirements

#### Task Management
- **FR-001**: System MUST allow users to create tasks with title, description, priority level, and due date
- **FR-002**: System MUST enable users to organize tasks using categories and tags
- **FR-002a**: System MUST organize tags into predefined tag categories for intuitive filtering (e.g., Context, Type, Project, Priority, Time)
- **FR-002b**: System MUST provide quick filter UI grouped by tag categories
- **FR-002c**: System MUST support multi-tag filtering with AND logic (show tasks matching all selected tags)
- **FR-002d**: System MUST display visual indicators (colors/icons) to distinguish tag categories
- **FR-002e**: System MUST show tag count badges indicating how many tasks use each tag
- **FR-002f**: System MUST allow users to create custom tags within predefined categories
- **FR-003**: System MUST allow users to mark tasks as complete
- **FR-004**: System MUST track task completion status and maintain completion history
- **FR-005**: System MUST support priority management with [NEEDS CLARIFICATION: what priority levels - e.g., High/Medium/Low, or numbered 1-5?]
- **FR-006**: System MUST track due dates for all tasks where specified
- **FR-007**: System MUST send reminders for tasks approaching their due dates [NEEDS CLARIFICATION: timing and delivery method?]
- **FR-008**: System MUST provide task analytics showing completion metrics, priority distribution, and productivity trends
- **FR-008a**: System MUST display a heat map visualization showing task completion activity for 4 weeks past and 1 week future
- **FR-008b**: System MUST use green color intensity (5 levels) for past completed tasks in the heat map
- **FR-008c**: System MUST use blue color intensity (4 levels) for future upcoming tasks in the heat map
- **FR-008d**: System MUST make heat map cells clickable to show detailed task list for that specific day
- **FR-008e**: System MUST display task completion times for past tasks and due times for future tasks in heat map modal
- **FR-008f**: System MUST automatically hide completed tasks from kanban board after 1 day to reduce visual clutter
- **FR-008g**: System MUST track task completion timestamp (completedAt) when status changes to done/completed
- **FR-009**: System MUST allow users to edit existing tasks
- **FR-010**: System MUST allow users to delete tasks
- **FR-011**: System MUST persist all task data [NEEDS CLARIFICATION: retention period?]
- **FR-011a**: System MUST provide a kanban board view displaying tasks organized in status-based lanes/columns
- **FR-011b**: System MUST allow users to drag and drop tasks between lanes to update task status
- **FR-011c**: System MUST provide visual feedback during drag operations (e.g., hover states, drop zone indicators)
- **FR-011d**: System MUST support drag-and-drop on both desktop (mouse) and mobile (touch) devices
- **FR-011e**: System MUST support keyboard navigation for drag-and-drop operations for accessibility
- **FR-011f**: System MUST persist status changes immediately when a task is dropped in a new lane
- **FR-011g**: System MUST handle drag-and-drop errors gracefully and revert changes if save fails
- **FR-011h**: System MUST display task due dates with remaining days or overdue status with appropriate visual indicators (red for overdue, yellow for due soon, blue for normal)
- **FR-011i**: System MUST show the top 3 tags on task cards with a "+X more" indicator for additional tags
- **FR-011j**: System MUST make task card tags clickable to filter the kanban board by that tag
- **FR-011k**: System MUST support tag filtering from task cards with toggle behavior (click to add, click again to remove from filter)

#### Tech News Summaries
- **FR-012**: System MUST generate concise AI-powered summaries of tech news articles
- **FR-012a**: System MUST calculate role-based relevance scores for each article across multiple professional roles (Developer, QC, BA, etc.)
- **FR-012b**: System MUST store role scores in a flexible JSONB format to support adding new roles without database schema changes
- **FR-013**: System MUST aggregate news from multiple sources including RSS feeds (TechCrunch, Hacker News, etc.) and NewsAPI
- **FR-014**: System MUST score article relevance using AI based on content analysis and keyword matching for each professional role
- **FR-014a**: System MUST allow users to select which professional roles they're interested in through News Preferences settings
- **FR-014b**: System MUST allow users to set minimum relevance threshold (0-85%) to filter articles by quality
- **FR-014c**: System MUST display article counts for each role to help users make informed preference choices
- **FR-014d**: System MUST warn users when setting high relevance thresholds (>70%) that may result in fewer articles
- **FR-015**: System MUST provide daily news digests to users filtered by their role preferences and relevance threshold
- **FR-015a**: System MUST automatically fetch fresh news when users haven't visited in 24+ hours
- **FR-015b**: System MUST track last fetch timestamp in browser storage to prevent excessive API calls
- **FR-016**: System MUST allow users to save/bookmark articles for later reference
- **FR-017**: System MUST display bookmarked articles in a dedicated view
- **FR-018**: System MUST preserve original article links alongside summaries
- **FR-019**: System MUST update news content daily through automated aggregation
- **FR-020**: System MUST handle content from diverse news sources with different formats
- **FR-020a**: System MUST handle duplicate articles from different sources using URL-based deduplication with upsert operations

#### User Configuration & Customization
- **FR-020a**: System MUST provide user-specific configuration for task attributes (status, priority, type, timeframe, category, assignee)
- **FR-020b**: System MUST automatically create default configuration for new users during signup
- **FR-020c**: System MUST allow users to add custom values to any configurable field through a Settings interface
- **FR-020d**: System MUST prevent users from removing all values from any configurable field (minimum one value required)
- **FR-020e**: System MUST use user configuration values in all dropdowns, filters, and kanban lane generation
- **FR-020f**: System MUST allow users to reset their configuration to system defaults
- **FR-020g**: System MUST isolate configuration settings per user (users cannot see or modify other users' configurations)
- **FR-020h**: System MUST persist configuration changes immediately and apply them to the current session
- **FR-020i**: System MUST validate configuration values before saving (e.g., prevent duplicates, validate format)

#### Cross-Feature Requirements
- **FR-021**: System MUST support multi-user authentication with simple email/password signup and login
- **FR-021a**: System MUST validate email format and enforce minimum password requirements (8+ characters)
- **FR-021b**: System MUST hash passwords securely before storage (bcrypt or similar)
- **FR-021c**: System MUST maintain user sessions with secure token management
- **FR-021d**: System MUST isolate each user's tasks, categories, tags, and bookmarks (data privacy)
- **FR-021e**: Advanced security features (2FA, SSO, OAuth) are planned for future phases
- **FR-022**: System MUST provide a unified, responsive interface for both task management and news features that works seamlessly on desktop, tablet, and mobile devices
- **FR-023**: System MUST ensure data privacy - users can only access their own tasks, analytics, and bookmarked articles
- **FR-024**: System MUST provide smooth animations and transitions (60fps target) for UI interactions including drag-and-drop
- **FR-025**: System MUST meet accessibility standards (WCAG 2.1 AA minimum) including keyboard navigation and screen reader support

#### Testing & Quality Assurance (Phase 1 - Simple)
- **FR-026**: System MUST have basic unit tests for critical functions (auth, tag parsing)
- **FR-027**: System MUST have simple integration tests for main API endpoints
- **FR-028**: System MUST have ONE E2E test for complete user flow (signup → login → create task → drag task)
- **FR-029**: Advanced testing (performance, load, visual regression) planned for later phases

#### Deployment & Operations (Phase 1 - Simple)
- **FR-030**: System MUST be manually deployable to Supabase hosting platform
- **FR-031**: System MUST have basic automated deployment via GitHub Actions (test → deploy)
- **FR-032**: Database migrations MUST run automatically on deployment
- **FR-033**: Advanced deployment features (staging, preview environments, rollback) planned for later phases

### Key Entities

- **User**: Represents a registered user account with attributes including email (unique identifier), hashed password, display name, account creation date, and last login timestamp. Each user has isolated access to their own tasks and data
- **UserConfig**: Represents user-specific configuration settings with attributes including customizable arrays for statuses, priorities, types, timeFrames, categories, and assignees. Each user has one configuration record that controls their task management experience
- **Task**: Represents a user's to-do item with attributes including title, description, priority level, due date, status (e.g., To Do, In Progress, Done), completion status, categories, tags, position/order within lane, user ownership, creation timestamp, and completion timestamp
- **Lane/Column**: Represents a status category in the kanban board (e.g., "To Do", "In Progress", "Done") containing multiple tasks
- **Category**: Represents a high-level grouping mechanism for tasks (e.g., "Work", "Personal", "Shopping")
- **Tag**: Represents a flexible labeling system for tasks, allowing multiple tags per task for cross-categorization. Tags are organized into predefined categories for quick filtering
- **Tag Category**: Represents a grouping of related tags to enable quick filtering (e.g., "Context" includes tags like @home, @office, @computer; "Type" includes tags like #meeting, #coding, #research)
- **Reminder**: Represents a notification trigger associated with a task's due date
- **Task Analytics**: Represents aggregated data about task completion rates, priority distribution, and productivity metrics over time
- **News Article**: Represents a tech news item with attributes including original title, source, publication date, original URL, summary status, and role-based relevance scores stored in JSONB format
- **Article Summary**: Represents the AI-generated concise version of a news article
- **Role Scores**: Represents AI-calculated relevance ratings for each professional role (Developer, QC, BA, etc.) stored as JSONB object (e.g., {"developer": 0.8, "qc": 0.4, "ba": 0.6})
- **User News Preferences**: Represents user-selected roles and minimum relevance threshold for personalized news filtering
- **Daily Digest**: Represents a curated collection of news articles presented to the user on a given day, filtered by user preferences
- **Bookmark**: Represents a user's saved article reference for later reading, with user ownership for data isolation
- **News Source**: Represents an external tech news provider/website from which articles are aggregated (RSS feeds, NewsAPI)
- **Heat Map Cell**: Represents a single day in the task activity heat map with task count, completion/due status, and color intensity
- **Task Analytics**: Represents aggregated statistics including completion heat map (4 weeks past + 1 week future), status distribution, priority distribution, and performance metrics

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [X] No implementation details (languages, frameworks, APIs)
- [X] Focused on user value and business needs
- [X] Written for non-technical stakeholders
- [X] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain - **MULTIPLE CLARIFICATIONS NEEDED**
- [ ] Requirements are testable and unambiguous - **SOME AMBIGUITY REMAINS**
- [ ] Success criteria are measurable - **PARTIALLY DEFINED**
- [ ] Scope is clearly bounded - **YES**
- [ ] Dependencies and assumptions identified - **PARTIALLY DEFINED**

---

## Execution Status
*Updated by main() during processing*

- [X] User description parsed
- [X] Key concepts extracted
- [X] Ambiguities marked
- [X] User scenarios defined
- [X] Requirements generated
- [X] Entities identified
- [ ] Review checklist passed - **AWAITING CLARIFICATIONS**

---

## ✅ Implementation Status

### Completed Features (v1.5.0)

#### Task Management (v1.0-1.4)
- **✅ Authentication**: NextAuth.js with email/password, user isolation
- **✅ Password Reset**: Complete forgot password flow with email integration (v1.4.0)
  - Secure reset tokens with 1-hour expiry
  - Resend API email service
  - Professional HTML email templates with improved button visibility
  - Rate limiting (3 requests/15min per email)
  - Dark mode support for all auth pages
- **✅ Task Management**: Full CRUD with 5-status workflow (To Do → In Progress → Review → Testing → Done)
- **✅ Dynamic Kanban**: 6 lane types (Status, Priority, Type, Time, Category, Assignee)
- **✅ Advanced Filtering**: Multi-criteria search and filtering with visual indicators
- **✅ Enhanced Calendar**: Custom date picker with quick selection and past date support
- **✅ User Configuration System**: Customizable task attributes (status, priority, type, timeframe, category, assignee) with Settings UI
- **✅ Dynamic Lane Generation**: Kanban lanes automatically adapt to user's custom configuration
- **✅ Enhanced Task Cards**: Improved date display with remaining/overdue days and visual indicators
- **✅ Clickable Tags**: Task card tags are clickable for instant filtering with toggle behavior
- **✅ Settings Management**: Complete UI for managing user-specific task configurations
- **✅ Drag & Drop**: Advanced drag and drop with cross-column and same-column reordering
- **✅ Responsive Design**: Mobile-first design working on all devices

#### Advanced Analytics & Automation (v1.5.0)
- **✅ Task Completion Heat Map**: 5-week visualization (4 weeks past + 1 week future)
  - Green color intensity (5 levels) for completed tasks
  - Blue color intensity (4 levels) for upcoming due dates
  - Full-width expandable layout utilizing horizontal space
  - Clickable cells showing detailed task lists with completion/due times
  - Timezone-aware date handling for accurate grouping
- **✅ Auto-Hide Completed Tasks**: Tasks completed >1 day ago automatically hidden from kanban
- **✅ Completion Timestamp Tracking**: Automatic completedAt field when marking tasks done
- **✅ Enhanced Statistics Dashboard**: Completion rates, priority/status/type distributions, performance metrics

#### Tech News Integration (v1.5.0)
- **✅ News Aggregation**: Multi-source fetching (RSS feeds + NewsAPI)
  - TechCrunch, Hacker News, The Verge, Ars Technica RSS feeds
  - NewsAPI integration for broader coverage
  - Duplicate detection via URL-based upsert
- **✅ AI-Powered Summaries**: Concise article summaries preserving key information
- **✅ Role-Based Categorization**: AI scoring for Developer, QC, BA roles
  - Flexible JSONB schema for adding roles without migrations
  - Keyword-based analysis with cross-role relevance boosting
  - Baseline scores ensuring articles visible across roles
- **✅ News Preferences UI**: User-customizable filtering
  - Multi-role selection with live article counts
  - Minimum relevance slider (0-85%) with warning for high thresholds
  - Automatic preference save to user profile
- **✅ Personalized News Feed**: Role-filtered article display
  - Sorted by publication date (latest first)
  - 24-hour auto-refresh using localStorage timestamp
  - Proper date handling preventing NaN/NaN/NaN display
- **✅ Daily Digest**: Curated personalized news
  - Up to 20 articles matching user roles
  - 30% max relevance threshold for digests (broader than feed)
  - Filtered by user preferences
- **✅ Bookmarks**: Save articles for later with user isolation
- **✅ Settings Organization**: Separated into 3 menu items
  - Task Settings (status, priority, type, etc. with reset button)
  - News Preferences (roles, relevance threshold)
  - Profile & Security (user info, password)

#### Testing & Documentation (v1.5.0)
- **✅ Comprehensive Test Suite**: 279 passing tests
  - 63 news feature tests (API, bookmarks, digest, preferences)
  - 58 task management tests (CRUD, filtering, config)
  - 67 security tests (password, SQL injection, XSS, CSRF, rate limiting)
  - 33 E2E automated tests covering manual test cases
  - 9 test suites with full coverage
- **✅ API Documentation**: OpenAPI 3.0 / Swagger integration
  - Interactive Swagger UI at /api-docs
  - JSON spec download at /api/docs/json
  - JSDoc annotations for all endpoints
  - 20+ documented endpoints
- **✅ CI/CD Pipeline**: GitHub Actions with real PostgreSQL
  - Test, lint, and build workflows
  - PostgreSQL service for integration testing
  - Automated secrets management via GitHub CLI
- **✅ Version Management**: Centralized version tracking
  - Single source of truth (src/lib/version.ts)
  - Displayed in footer, health API, and Swagger docs
- **✅ Production Deployment**: Live application on Vercel + Supabase

### Clarifications Resolved
1. **Priority Levels**: ✅ Implemented as Urgent, High, Medium, Low with color coding
2. **User Model**: ✅ Multi-user platform with data isolation per user
3. **Authentication**: ✅ NextAuth.js with email/password credentials + password reset flow
4. **Analytics Metrics**: ✅ Completion rates, priority distribution, status breakdowns, heat map visualization
5. **Data Retention**: ✅ All task data persisted in Supabase PostgreSQL (indefinite retention)
6. **User Configuration**: ✅ Customizable task attributes with Settings UI and automatic default creation
7. **Date Display**: ✅ Task cards show remaining days or overdue status with color-coded visual indicators
8. **Tag Interaction**: ✅ Task card tags are clickable for instant filtering with hover effects and toggle behavior
9. **Dynamic UI**: ✅ All dropdowns, filters, and kanban lanes adapt to user's custom configuration
10. **News Sources**: ✅ RSS feeds (TechCrunch, Hacker News, The Verge, Ars Technica) + NewsAPI
11. **AI Relevance Scoring**: ✅ Role-based scoring (Developer, QC, BA) using keyword analysis
12. **News Update Frequency**: ✅ Daily aggregation + 24-hour auto-refresh on user visit
13. **Daily Digest Timing**: ✅ On-demand generation filtered by user preferences
14. **Heat Map Time Range**: ✅ 4 weeks historical + 1 week future with color differentiation
15. **Completed Task Auto-Hide**: ✅ Tasks >1 day old automatically hidden from kanban

### Outstanding for Future Phases
- **Reminder System**: Email/push notifications for upcoming due dates (planned for v2.0)
- **Advanced Analytics**: Velocity tracking, burndown charts, trend analysis (planned for v2.0)
- **Team Collaboration**: Multi-user task sharing, team boards, assignments (planned for v2.0)
- **Additional News Roles**: PM, DevOps, Designer roles with custom scoring (planned for v1.6)
- **News Categories**: Topic-based filtering (AI, Cloud, Security, etc.) (planned for v1.6)
- **Mobile Apps**: Native iOS/Android applications (planned for v3.0)

---