/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Role Categorization Service
 * 
 * This service calculates relevance scores for news articles
 * based on professional roles (Developer, QC, BA)
 */

export interface RoleScores {
  developer: number
  qc: number
  ba: number
}

// Keyword definitions for each role
const developerKeywords = {
  high: [
    'programming', 'code', 'coding', 'framework', 'library', 'api', 'sdk',
    'typescript', 'javascript', 'python', 'java', 'react', 'vue', 'angular',
    'node.js', 'nodejs', 'architecture', 'design patterns', 'algorithm',
    'data structures', 'backend', 'frontend', 'fullstack', 'software engineer',
    'developer', 'development', 'git', 'github', 'repository'
  ],
  medium: [
    'devops', 'ci/cd', 'cicd', 'docker', 'kubernetes', 'testing framework',
    'debugging', 'performance optimization', 'deployment', 'build', 'compiler',
    'database', 'sql', 'mongodb', 'postgresql', 'redis'
  ],
  low: [
    'technology', 'innovation', 'startup', 'product', 'app', 'application'
  ]
}

const qcKeywords = {
  high: [
    // Core testing terms
    'testing', 'qa', 'qc', 'quality assurance', 'quality control', 'test automation',
    'automated testing', 'manual testing', 'test strategy', 'test plan',
    // Test frameworks and tools
    'selenium', 'cypress', 'playwright', 'puppeteer', 'webdriver', 'appium',
    'jest', 'mocha', 'chai', 'junit', 'testng', 'pytest', 'rspec', 'cucumber',
    'postman', 'rest assured', 'jmeter', 'gatling', 'k6',
    // Testing types
    'unit testing', 'integration testing', 'e2e testing', 'end-to-end testing',
    'regression testing', 'smoke testing', 'sanity testing', 'acceptance testing',
    'functional testing', 'api testing', 'ui testing', 'mobile testing',
    // Quality concepts
    'bug', 'defect', 'issue', 'test case', 'test coverage', 'code coverage',
    'test suite', 'test framework', 'test data', 'test environment',
    'quality metrics', 'defect density', 'test execution', 'test report',
    // Roles
    'tester', 'quality engineer', 'qa engineer', 'sdet', 'test engineer',
    'automation engineer', 'qa analyst', 'test lead'
  ],
  medium: [
    // CI/CD and DevOps
    'ci/cd', 'cicd', 'continuous testing', 'continuous integration',
    'jenkins', 'github actions', 'gitlab ci', 'circleci', 'travis ci',
    // Performance and security
    'performance testing', 'load testing', 'stress testing', 'scalability testing',
    'security testing', 'penetration testing', 'vulnerability testing',
    // Process and methodology
    'code review', 'peer review', 'debugging', 'validation', 'verification',
    'test driven development', 'tdd', 'bdd', 'behavior driven development',
    'shift left testing', 'agile testing', 'devops testing',
    // Tools and platforms
    'jira', 'testrail', 'zephyr', 'xray', 'qtest',
    'browserstack', 'sauce labs', 'lambdatest'
  ],
  low: [
    'development', 'feature', 'release', 'deployment', 'build', 'software'
  ]
}

const baKeywords = {
  high: [
    'business intelligence', 'bi', 'analytics', 'data visualization', 'tableau',
    'power bi', 'powerbi', 'dashboard', 'reporting', 'requirements', 'user stories',
    'stakeholder', 'roi', 'kpi', 'metrics', 'business analyst', 'ba', 'analysis',
    'data analysis', 'business requirements', 'functional requirements', 'use case'
  ],
  medium: [
    'agile', 'scrum', 'kanban', 'jira', 'project management', 'product management',
    'roadmap', 'sprint', 'backlog', 'planning', 'strategy', 'business process',
    'workflow', 'process improvement'
  ],
  low: [
    'coding', 'programming', 'technical implementation', 'development'
  ]
}

/**
 * Calculate role relevance scores for an article using keyword matching
 */
export function calculateRoleScores(article: {
  title: string
  content: string
  summary?: string | null
  tags: string[]
  category?: string | null
}): RoleScores {
  // Combine all text for analysis
  const text = `${article.title} ${article.content} ${article.summary || ''} ${article.tags.join(' ')}`.toLowerCase()
  
  const scores: RoleScores = {
    developer: 0,
    qc: 0,
    ba: 0
  }
  
  // Developer scoring
  const devHighMatches = developerKeywords.high.filter(kw => text.includes(kw)).length
  const devMediumMatches = developerKeywords.medium.filter(kw => text.includes(kw)).length
  const devLowMatches = developerKeywords.low.filter(kw => text.includes(kw)).length
  
  scores.developer = Math.min(1.0, 
    (devHighMatches * 0.15) + 
    (devMediumMatches * 0.08) + 
    (devLowMatches * 0.03)
  )
  
  // QC scoring
  const qcHighMatches = qcKeywords.high.filter(kw => text.includes(kw)).length
  const qcMediumMatches = qcKeywords.medium.filter(kw => text.includes(kw)).length
  const qcLowMatches = qcKeywords.low.filter(kw => text.includes(kw)).length
  
  scores.qc = Math.min(1.0,
    (qcHighMatches * 0.15) +
    (qcMediumMatches * 0.08) +
    (qcLowMatches * 0.03)
  )
  
  // BA scoring
  const baHighMatches = baKeywords.high.filter(kw => text.includes(kw)).length
  const baMediumMatches = baKeywords.medium.filter(kw => text.includes(kw)).length
  const baLowMatches = baKeywords.low.filter(kw => text.includes(kw)).length
  
  scores.ba = Math.min(1.0,
    (baHighMatches * 0.15) +
    (baMediumMatches * 0.08) +
    (baLowMatches * 0.03)
  )
  
  // Apply category-based boost
  if (article.category) {
    applyCategoryBoost(scores, article.category)
  }
  
  // Apply cross-role relevance for tech articles
  // If it's highly relevant to one role, it has some relevance to others
  const maxScore = Math.max(scores.developer, scores.qc, scores.ba)
  
  if (maxScore > 0.5) {
    // For highly relevant articles, boost other roles proportionally
    if (scores.qc < maxScore * 0.7) {
      scores.qc = Math.max(scores.qc, maxScore * 0.7)
    }
    if (scores.ba < maxScore * 0.6) {
      scores.ba = Math.max(scores.ba, maxScore * 0.6)
    }
    if (scores.developer < maxScore * 0.8) {
      scores.developer = Math.max(scores.developer, maxScore * 0.8)
    }
  } else if (maxScore > 0.3) {
    // For moderately relevant articles
    if (scores.qc < 0.3) {
      scores.qc = Math.max(scores.qc, maxScore * 0.6)
    }
    if (scores.ba < 0.3) {
      scores.ba = Math.max(scores.ba, maxScore * 0.5)
    }
  } else {
    // For low relevance articles, ensure minimum baseline
    // Normalize if all scores are still 0 (fallback to balanced relevance)
    if (scores.developer === 0 && scores.qc === 0 && scores.ba === 0) {
      scores.developer = 0.4
      scores.qc = 0.3
      scores.ba = 0.3
    } else {
      // Ensure minimum scores for tech content
      scores.developer = Math.max(scores.developer, 0.2)
      scores.qc = Math.max(scores.qc, 0.15)
      scores.ba = Math.max(scores.ba, 0.15)
    }
  }
  
  return scores
}

/**
 * Apply category-based boost to role scores
 */
function applyCategoryBoost(scores: RoleScores, category: string) {
  const categoryBoosts: Record<string, Partial<RoleScores>> = {
    'Software Development': { developer: 0.3 },
    'QA & Testing': { qc: 0.4, developer: 0.2 },
    'DevOps & Infrastructure': { developer: 0.3, qc: 0.1 },
    'Security & Testing': { qc: 0.3, developer: 0.2 },
    'Frontend Development': { developer: 0.3, qc: 0.2 },
    'Backend Development': { developer: 0.3, qc: 0.1 },
    'Technology': { developer: 0.1, qc: 0.1, ba: 0.1 },
    'Development': { developer: 0.3 }
  }
  
  const boost = categoryBoosts[category]
  if (boost) {
    if (boost.developer) scores.developer = Math.min(1.0, scores.developer + boost.developer)
    if (boost.qc) scores.qc = Math.min(1.0, scores.qc + boost.qc)
    if (boost.ba) scores.ba = Math.min(1.0, scores.ba + boost.ba)
  }
}

/**
 * Calculate role scores for all existing articles in database
 * This is a one-time backfill operation
 */
export async function backfillRoleScores() {
  const { prisma } = await import('@/lib/database')
  
  try {
    console.log('🔄 Starting role score backfill...')
    
    // Get all articles
    const articles = await prisma.newsArticle.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        tags: true,
        category: true,
        roleScores: true
      }
    })
    
    console.log(`📊 Found ${articles.length} articles to score`)
    
    let updated = 0
    for (const article of articles) {
      // Skip if already has scores
      const existingScores = article.roleScores as any
      if (existingScores && Object.keys(existingScores).length > 0) {
        continue
      }

      const scores = calculateRoleScores(article)
      
      // Store scores as JSONB
      await prisma.newsArticle.update({
        where: { id: article.id },
        data: {
          roleScores: {
            developer: scores.developer,
            qc: scores.qc,
            ba: scores.ba
          }
        }
      })
      
      updated++
      
      if (updated % 10 === 0) {
        console.log(`✅ Scored ${updated}/${articles.length} articles`)
      }
    }
    
    console.log(`✅ Backfill complete: ${updated} articles scored`)
    return { success: true, updated }
  } catch (error) {
    console.error('❌ Backfill error:', error)
    return { success: false, error }
  }
}

