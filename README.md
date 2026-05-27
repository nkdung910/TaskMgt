# TaskMgt - Daily Task Management & Tech News Platform

A modern task management application built with Next.js 15, featuring drag-and-drop Kanban boards, user authentication, and tech news integration.

## 🚀 Features

- ✅ **User Authentication** - Secure signup/login with NextAuth.js
- ✅ **Task Management** - Create, update, and organize tasks with full CRUD operations
- ✅ **Drag & Drop Kanban** - Visual task organization with @dnd-kit and 6 lane types
- ✅ **User Configuration** - Customizable task attributes (status, priority, type, timeframe, category, assignee)
- ✅ **Dynamic Filtering** - Advanced multi-criteria search with visual indicators
- ✅ **Enhanced Task Cards** - Improved date display with remaining/overdue days and clickable tags
- ✅ **Settings Management** - Complete UI for managing user-specific configurations
- ✅ **Statistics Dashboard** - Task analytics with visual charts and progress tracking
- ✅ **User Data Isolation** - Each user sees only their own tasks and configurations
- ✅ **Responsive Design** - Mobile-first design working on all devices
- ✅ **Production Ready** - Deployed on Vercel with Supabase PostgreSQL

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5.9.2
- **UI**: React 19.1.0 + Tailwind CSS 4.1.13
- **Database**: PostgreSQL 15 + Prisma ORM
- **Authentication**: NextAuth.js v4.24.11
- **Drag & Drop**: @dnd-kit/core
- **Deployment**: Vercel + Supabase + GitHub Actions

## 🏃‍♂️ Quick Start

### Local Development

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd TaskMgt
   npm install
   ```

2. **Setup Database**
   ```bash
   # Start PostgreSQL with Docker
   docker-compose up -d
   
   # Run database migrations
   npx prisma migrate dev
   npx prisma generate
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) to see the app.

### Production Deployment

#### Option 1: Vercel Deployment (Recommended)
1. **Setup Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Connect your repository

2. **Setup Supabase Database**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your database URL

3. **Configure Environment Variables**
   ```bash
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="https://your-app.vercel.app"
   DATABASE_URL="your-supabase-database-url"
   NODE_ENV="production"
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

#### Option 2: Manual Deployment
📖 **Detailed Setup**: See deployment documentation in the specs folder.

## 📁 Project Structure

```
TaskMgt/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── login/          # Authentication pages
│   │   └── page.tsx        # Main dashboard
│   ├── components/         # React components
│   │   ├── DragDropKanban.tsx
│   │   ├── TaskForm.tsx
│   │   └── ...
│   ├── lib/               # Utilities
│   │   ├── auth.ts        # NextAuth configuration
│   │   ├── db.ts          # Prisma client
│   │   └── task-actions.ts
│   └── types/             # TypeScript definitions
├── prisma/                # Database schema
├── specs/                 # Project documentation
└── railway.json          # Railway configuration
```

## 🧪 Testing

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

### Manual Testing
1. Sign up for a new account
2. Create tasks with different statuses, priorities, and due dates
3. Drag tasks between Kanban columns
4. Test user configuration in Settings
5. Click on task card tags to filter
6. Verify user data isolation
7. Check responsive design on mobile

## 📚 Documentation

### User Documentation
- [User Guide](./USER_GUIDE.md) - **How to use news features, scoring system, and daily digest** ⭐
- [API Documentation](https://taskmgt-virid.vercel.app/api-docs) - Swagger/OpenAPI interactive docs

### Technical Documentation
- [Current Status](./specs/001-taskmgt/CURRENT_STATUS.md) - Project status and completed features
- [Feature Specification](./specs/001-taskmgt/spec.md) - Detailed requirements and user scenarios
- [Deployment Guide](./specs/001-taskmgt/docs/DEPLOYMENT.md) - Production deployment instructions
- [Authentication Setup](./specs/001-taskmgt/docs/AUTHENTICATION.md) - Auth system documentation
- [Development Tasks](./specs/001-taskmgt/tasks.md) - Implementation phases and progress

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Commands
```bash
npx prisma studio    # Open Prisma Studio
npx prisma migrate dev  # Run migrations
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes
```

## 🚨 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Database Connection**
```bash
# Check Docker is running
docker-compose ps

# Reset database
docker-compose down
docker-compose up -d
```

**Vercel Deployment**
```bash
# Check deployment logs
vercel logs

# View environment variables
vercel env ls
```

**Swagger UI Warning (Safe to Ignore)**
If you see `UNSAFE_componentWillReceiveProps` warning when visiting `/api-docs`, this is a known issue with the `swagger-ui-react` library (v5.29.4) and can be safely ignored. It doesn't affect functionality. See: https://github.com/swagger-api/swagger-ui/issues/9047

## 📈 Roadmap

### v1.5.0 (Current) ✅
- ✅ Tech news integration with RSS feeds (10 specialized sources)
- ✅ Role-based news filtering (Developer, QC, BA)
- ✅ AI-powered relevance scoring with keyword matching
- ✅ Daily news digest generation (curated top 20 articles)
- ✅ Task completion heat map visualization
- ✅ Password reset functionality with email service
- ✅ Comprehensive test suite (279 tests - 100% passing)
- ✅ API documentation with Swagger/OpenAPI
- ✅ In-app documentation viewer

### v1.6.0 (Next)
- [ ] Task due date notifications
- [ ] Advanced task search and sorting
- [ ] Task templates and recurring tasks
- [ ] Improved mobile experience
- [ ] E2E tests with Playwright

### v2.0.0 (Future)
- [ ] AI-powered article summaries
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Real-time notifications

## ⚠️ Known Issues

### Swagger UI Warning (Non-Critical)
When visiting `/api-docs`, you may see a React strict mode warning about `UNSAFE_componentWillReceiveProps` in the browser console. This warning specifically mentions the `ModelCollapse` component.

**Root Cause:** This is a known issue with the `swagger-ui-react` library (v5.29.4) using deprecated React lifecycle methods.

**Impact:** None - API documentation works perfectly and this warning can be safely ignored.

**Status:** Waiting for upstream fix in swagger-ui-react  
**Reference:** https://github.com/swagger-api/swagger-ui/issues/9462

**Note:** This warning only appears in development mode and does not affect production builds.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for simple deployment
- Supabase for excellent database and auth services
- Prisma for excellent database tooling
- @dnd-kit for smooth drag-and-drop

---

**Built with ❤️ using Next.js 15 and modern web technologies**
# TaskMgt
# TaskMgt
# TaskMgt
# TaskMgt
# TaskMgt
