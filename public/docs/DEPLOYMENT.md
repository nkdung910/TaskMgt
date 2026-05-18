# TaskMgt Deployment Guide

**Version**: 1.5.0  
**Last Updated**: October 15, 2025

## Overview

This guide covers deploying TaskMgt to production environments, including Vercel, Docker, and other cloud platforms.

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- Environment variables configured
- Domain name (optional but recommended)

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_URL="postgresql://username:password@host:port/database"

# NextAuth.js
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Email (for password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Optional Variables

```bash
# News API (if using external news sources)
NEWS_API_KEY="your-news-api-key"

# OpenAI (for AI features)
OPENAI_API_KEY="your-openai-key"

# Rate Limiting
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="60000"
```

## Deployment Options

### 1. Vercel (Recommended)

#### Automatic Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Vercel Configuration
Create `vercel.json` in project root:
```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret"
  }
}
```

### 2. Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=taskmgt
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 3. Railway Deployment

1. Connect your GitHub repository to Railway
2. Add PostgreSQL service
3. Configure environment variables
4. Deploy automatically

### 4. DigitalOcean App Platform

1. Create new app from GitHub repository
2. Configure build settings:
   - Build Command: `prisma generate && next build`
   - Run Command: `npm start`
3. Add managed PostgreSQL database
4. Configure environment variables
5. Deploy

## Database Setup

### Supabase (Recommended)

1. Create new Supabase project
2. Run database migrations:
```bash
npx prisma db push
```
3. Configure connection string in environment variables

### Self-hosted PostgreSQL

1. Install PostgreSQL 15+
2. Create database:
```sql
CREATE DATABASE taskmgt;
CREATE USER taskmgt_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE taskmgt TO taskmgt_user;
```
3. Run migrations:
```bash
npx prisma migrate deploy
```

## Production Checklist

### Security
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Database credentials secured
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation enabled

### Performance
- [ ] Database indexes optimized
- [ ] CDN configured (if applicable)
- [ ] Caching strategy implemented
- [ ] Image optimization enabled
- [ ] Bundle size optimized

### Monitoring
- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation

### Backup
- [ ] Database backups configured
- [ ] File storage backups (if applicable)
- [ ] Disaster recovery plan
- [ ] Backup testing schedule

## Post-Deployment

### 1. Verify Deployment
```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Test authentication
curl -X POST https://your-domain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Configure Domain
- Update DNS records
- Configure SSL certificate
- Update NEXTAUTH_URL environment variable

### 3. Set Up Monitoring
- Configure error tracking
- Set up performance monitoring
- Configure uptime monitoring
- Set up log aggregation

### 4. Database Maintenance
```bash
# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Check database status
npx prisma db status
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

#### Database Connection Issues
- Verify DATABASE_URL format
- Check database server status
- Verify network connectivity
- Check firewall settings

#### Authentication Issues
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches domain
- Verify session configuration
- Check cookie settings

### Performance Optimization

#### Database
```sql
-- Add indexes for common queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

#### Next.js
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['your-image-domain.com'],
  },
}
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer
- Configure session storage (Redis)
- Database connection pooling
- CDN for static assets

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching strategies
- Monitor resource usage

## Support

For deployment issues:
1. Check the troubleshooting section
2. Review application logs
3. Check database connectivity
4. Verify environment variables
5. Contact support team

## Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **Database Security**: Use strong passwords and limit access
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Input Validation**: Validate all user inputs
6. **Authentication**: Use secure session management
7. **CORS**: Configure CORS properly
8. **Headers**: Set security headers
9. **Updates**: Keep dependencies updated
10. **Monitoring**: Monitor for security issues

