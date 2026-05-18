# Deployment Strategy

## Overview
TaskMgt uses Supabase for hosting and GitHub Actions for continuous deployment. The strategy follows a phased approach: simple auto-deployment initially, with advanced deployment features in later phases.

---

## Phase 1: Simple Deployment (Initial)

### Goal
Get the application deployed quickly with basic automation, avoiding over-engineering and unnecessary gates.

### Infrastructure

#### Supabase Platform
**Why Supabase?**
- Simple PostgreSQL + Next.js setup
- Automatic HTTPS and custom domains
- Built-in environment variable management
- No DevOps complexity for small teams
- Free tier available for development

**Services**:
```
┌─────────────────────────────────────┐
│ Supabase Project: TaskMgt            │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │ PostgreSQL Database          │  │
│  │ - Version: 15                │  │
│  │ - Auto-backups: Daily        │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Next.js Application          │  │
│  │ - Node.js 20                 │  │
│  │ - Auto-scaling               │  │
│  │ - HTTPS enabled              │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### Deployment Pipeline (Simple)

```
Developer → Push to main → GitHub Actions
                              ↓
                        Run Tests (Jest + Playwright)
                              ↓
                         Tests Pass? ─────→ No → Stop, notify
                              ↓ Yes
                        Build Next.js
                              ↓
                      Deploy to Supabase
                              ↓
                    Run Database Migrations (Prisma)
                              ↓
                         Done! ✅
```

### GitHub Actions Workflow (Phase 1)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Supabase

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Deploy to Supabase
        if: success()
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: taskmgt
```

### Environment Variables (Supabase)

```bash
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=<railway-provided>
NEXTAUTH_SECRET=<generate-random-string>
NEXTAUTH_URL=https://taskmgt.up.railway.app
BCRYPT_ROUNDS=10
SESSION_MAX_AGE=2592000

# AI Service (to be configured)
AI_API_KEY=<your-ai-service-key>
AI_API_URL=<your-ai-service-url>

# News Sources (to be configured)
NEWS_API_KEY=<your-news-api-key>
```

### Database Migrations

**Automatic on Deployment**:
```json
// package.json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start"
  }
}
```

Supabase runs `npm run build` → migrations run automatically before build.

### What's SIMPLE in Phase 1

✅ **Single Environment**: Only production (no staging)  
✅ **Auto-Deploy**: Every push to `main` deploys automatically  
✅ **Basic Health Check**: Tests must pass to deploy  
✅ **No Manual Approval**: Fully automated (no gates)  
✅ **No Rollback Strategy**: Fix-forward approach (push fix to main)  
✅ **No Preview Deployments**: Only production environment  
✅ **Basic Monitoring**: Supabase's built-in monitoring  

### Deployment Checklist (Phase 1)

**One-Time Setup**:
- [ ] Create Supabase account and project
- [ ] Add PostgreSQL service to Supabase
- [ ] Add Next.js app service to Supabase
- [ ] Configure environment variables in Supabase
- [ ] Add `RAILWAY_TOKEN` to GitHub Secrets
- [ ] Configure custom domain (optional)
- [ ] Test first deployment manually

**Per Deployment** (Automated):
- [ ] Push to `main` branch
- [ ] GitHub Actions runs tests automatically
- [ ] If tests pass, deploy to Supabase automatically
- [ ] Supabase runs database migrations
- [ ] Supabase restarts application
- [ ] Verify deployment via health check URL

### Monitoring (Phase 1)

**Built-in Supabase Monitoring**:
- Application logs (stdout/stderr)
- CPU and memory usage
- Request metrics
- Deployment history

**Basic Health Check**:
```typescript
// src/app/api/health/route.ts
export async function GET() {
  // Check database connection
  const dbHealthy = await prisma.$queryRaw`SELECT 1`;
  
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected'
  });
}
```

### Estimated Deploy Time
- **Full Pipeline**: 5-8 minutes
  - Tests: 3-5 minutes
  - Build: 1-2 minutes
  - Deploy: 1 minute

---

## Phase 2: Advanced Deployment (Later)

### Additional Environments

```
Development → Feature Branch → Push
                  ↓
            Preview Deployment (Supabase)
                  ↓
            Manual Testing
                  ↓
            Merge to main
                  ↓
            Staging Deployment (Supabase)
                  ↓
            Smoke Tests + Manual QA
                  ↓
            Manual Approval
                  ↓
            Production Deployment (Supabase)
```

### Preview Deployments

**Feature**: Supabase creates preview deployment for each PR

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Deploy preview
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: taskmgt-preview
      
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployment: https://taskmgt-pr-${{ github.event.number }}.up.railway.app'
            })
```

### Blue-Green Deployment

**Strategy**: Zero-downtime deployments

```
Production Traffic
    ↓
   Load Balancer
    ↓
┌────────────┐
│   Blue     │ ← Current version (v1.0)
│ (running)  │
└────────────┘
    
Deploy v1.1 to Green
    ↓
┌────────────┐
│   Green    │ ← New version (v1.1)
│ (deploying)│
└────────────┘
    
Health check passes?
    ↓ Yes
Switch traffic to Green
    ↓
┌────────────┐
│   Green    │ ← New version (v1.1) serving traffic
│ (active)   │
└────────────┘
    
Keep Blue as backup for 24h
```

### Rollback Strategy

**Automated Rollback**:
```yaml
- name: Health check after deployment
  run: |
    sleep 30
    response=$(curl -f https://taskmgt.up.railway.app/api/health)
    if [ $? -ne 0 ]; then
      echo "Health check failed, rolling back..."
      railway rollback --service taskmgt
      exit 1
    fi
```

**Manual Rollback**:
```bash
# Via Supabase CLI
railway rollback --service taskmgt

# Or via Supabase dashboard
# Click "Deployments" → Select previous deployment → "Redeploy"
```

### Advanced Monitoring & Observability

**Tools**:
- **Logging**: Datadog, LogRocket, or Sentry
- **APM**: New Relic or Datadog APM
- **Error Tracking**: Sentry
- **Uptime Monitoring**: Pingdom or UptimeRobot

**Metrics to Track**:
```typescript
✓ Response times (p50, p95, p99)
✓ Error rates (4xx, 5xx)
✓ Database query performance
✓ Memory and CPU usage
✓ Active user sessions
✓ API endpoint usage
✓ Deployment frequency
✓ Mean time to recovery (MTTR)
```

### Database Management

**Backup Strategy**:
- Daily automated backups (Supabase built-in)
- Pre-deployment database snapshot
- Point-in-time recovery capability

**Migration Safety**:
```yaml
- name: Run migrations with safety checks
  run: |
    # Backup database first
    railway db:backup
    
    # Run migrations
    npx prisma migrate deploy
    
    # Verify migrations
    npx prisma db:check
```

### Security Enhancements

**Phase 2 Security**:
- [ ] Secrets rotation (automated)
- [ ] Rate limiting at edge (Cloudflare)
- [ ] DDoS protection
- [ ] WAF (Web Application Firewall)
- [ ] Regular security scans
- [ ] Dependency vulnerability monitoring
- [ ] SSL certificate auto-renewal

### Performance Optimization

**CDN Integration**:
- Cloudflare or Vercel Edge Network
- Static asset caching
- Image optimization
- Geographic distribution

**Database Optimization**:
- Connection pooling (PgBouncer)
- Read replicas for scaling
- Query optimization and indexing
- Database performance monitoring

---

## Disaster Recovery

### Phase 1 (Basic)
- Supabase automatic daily backups
- Database can be restored from backup via Supabase dashboard
- Manual recovery process (documented)

### Phase 2 (Advanced)
- Automated backup verification
- Multi-region redundancy
- Automated failover
- Recovery Time Objective (RTO): < 1 hour
- Recovery Point Objective (RPO): < 15 minutes

---

## Cost Estimation

### Phase 1 (Supabase)
```
PostgreSQL (Starter): $5/month
Next.js App (Starter): $5/month
Total: ~$10/month

(Free tier available for development)
```

### Phase 2 (With Advanced Features)
```
PostgreSQL (Pro): $20/month
Next.js App (Pro): $20/month
Monitoring (Datadog): $15/month
CDN (Cloudflare Pro): $20/month
Total: ~$75/month
```

---

## Setup Instructions

### Initial Supabase Setup

1. **Install Supabase CLI**:
```bash
npm i -g @railway/cli
railway login
```

2. **Create Project**:
```bash
railway init
railway add postgresql
```

3. **Configure Environment Variables**:
```bash
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)
railway variables set NEXTAUTH_URL=https://taskmgt.up.railway.app
railway variables set BCRYPT_ROUNDS=10
```

4. **Link GitHub Repository**:
- Go to Supabase dashboard
- Click "Connect GitHub"
- Select repository
- Enable "Deploy on push to main"

5. **Deploy**:
```bash
railway up
```

### Local Development with Supabase DB

```bash
# Link to Supabase project
railway link

# Pull environment variables
railway variables

# Run migrations against Supabase DB
DATABASE_URL=$(railway variables get DATABASE_URL) npx prisma migrate dev
```

---

## Troubleshooting

### Common Issues (Phase 1)

**Deployment Fails**:
1. Check GitHub Actions logs
2. Verify tests are passing locally
3. Check Supabase logs for build errors

**Database Connection Issues**:
1. Verify `DATABASE_URL` is set correctly
2. Check Supabase PostgreSQL service is running
3. Verify Prisma client is generated

**Environment Variables Missing**:
1. Check Supabase dashboard → Variables
2. Verify all required variables are set
3. Redeploy to pick up new variables

### Health Check Endpoint

```bash
# Check if app is running
curl https://taskmgt.up.railway.app/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-09-30T12:00:00Z",
  "database": "connected"
}
```

---

## Success Metrics

### Phase 1 (Simple)
- [ ] Deployment success rate > 95%
- [ ] Deploy time < 10 minutes
- [ ] Zero manual deployment steps
- [ ] All deployments tested automatically

### Phase 2 (Advanced)
- [ ] Zero-downtime deployments
- [ ] Rollback time < 5 minutes
- [ ] Uptime > 99.9%
- [ ] Mean time to recovery < 1 hour
