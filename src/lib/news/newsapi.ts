/**
 * NewsAPI Service
 * 
 * This service handles integration with NewsAPI.org for fetching real news articles.
 * It provides methods to fetch news from various sources and categories.
 */

export interface NewsAPIArticle {
  source: {
    id: string | null
    name: string
  }
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string | null
}

export interface NewsAPIResponse {
  status: string
  totalResults: number
  articles: NewsAPIArticle[]
}

export interface NewsAPISearchParams {
  q?: string
  sources?: string
  domains?: string
  from?: string
  to?: string
  language?: string
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt'
  pageSize?: number
  page?: number
}

export interface NewsAPISource {
  id: string
  name: string
  description: string
  url: string
  category: string
  language: string
  country: string
}

class NewsAPIService {
  private apiKey: string
  private baseUrl: string
  private rateLimitDelay: number = 1000 // 1 second between requests

  constructor() {
    this.apiKey = process.env.NEWSAPI_KEY || ''
    this.baseUrl = process.env.NEWSAPI_BASE_URL || 'https://newsapi.org/v2'
    
    if (!this.apiKey) {
      console.warn('NewsAPI key not found. NewsAPI integration will be disabled.')
    }
  }

  /**
   * Check if NewsAPI is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'your-newsapi-key-here'
  }

  /**
   * Make a request to NewsAPI with rate limiting
   */
  private async makeRequest<T = NewsAPIResponse>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('NewsAPI is not properly configured')
    }

    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    // Add API key
    url.searchParams.append('apiKey', this.apiKey)
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.append(key, value)
      }
    })

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'TaskMgt-NewsApp/1.0'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`NewsAPI request failed: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`)
      }

      const data = await response.json()
      
      if (data.status === 'error') {
        throw new Error(`NewsAPI error: ${data.message}`)
      }

      return data
    } catch (error) {
      console.error('NewsAPI request failed:', error)
      throw error
    }
  }

  /**
   * Get top headlines
   */
  async getTopHeadlines(params: {
    country?: string
    category?: string
    sources?: string
    q?: string
    pageSize?: number
    page?: number
  } = {}): Promise<NewsAPIResponse> {
    const searchParams: Record<string, string> = {}
    
    if (params.country) searchParams.country = params.country
    if (params.category) searchParams.category = params.category
    if (params.sources) searchParams.sources = params.sources
    if (params.q) searchParams.q = params.q
    if (params.pageSize) searchParams.pageSize = params.pageSize.toString()
    if (params.page) searchParams.page = params.page.toString()

    return this.makeRequest('/top-headlines', searchParams)
  }

  /**
   * Search for articles
   */
  async searchEverything(params: NewsAPISearchParams): Promise<NewsAPIResponse> {
    const searchParams: Record<string, string> = {}
    
    if (params.q) searchParams.q = params.q
    if (params.sources) searchParams.sources = params.sources
    if (params.domains) searchParams.domains = params.domains
    if (params.from) searchParams.from = params.from
    if (params.to) searchParams.to = params.to
    if (params.language) searchParams.language = params.language
    if (params.sortBy) searchParams.sortBy = params.sortBy
    if (params.pageSize) searchParams.pageSize = params.pageSize.toString()
    if (params.page) searchParams.page = params.page.toString()

    return this.makeRequest('/everything', searchParams)
  }

  /**
   * Get available sources
   */
  async getSources(params: {
    category?: string
    language?: string
    country?: string
  } = {}): Promise<{ status: string; sources: NewsAPISource[] }> {
    const searchParams: Record<string, string> = {}
    
    if (params.category) searchParams.category = params.category
    if (params.language) searchParams.language = params.language
    if (params.country) searchParams.country = params.country

    return this.makeRequest<{ status: string; sources: NewsAPISource[] }>('/sources', searchParams)
  }

  /**
   * Get tech news specifically
   */
  async getTechNews(params: {
    pageSize?: number
    page?: number
    q?: string
  } = {}): Promise<NewsAPIResponse> {
    const techKeywords = [
      'technology',
      'artificial intelligence',
      'AI',
      'machine learning',
      'software',
      'programming',
      'cybersecurity',
      'blockchain',
      'quantum computing',
      'robotics',
      'automation',
      'cloud computing',
      'data science',
      'mobile app',
      'web development'
    ]

    const searchQuery = params.q || techKeywords.join(' OR ')
    
    return this.searchEverything({
      q: searchQuery,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: params.pageSize || 20,
      page: params.page || 1
    })
  }

  /**
   * Get news by category
   */
  async getNewsByCategory(category: string, params: {
    pageSize?: number
    page?: number
    country?: string
  } = {}): Promise<NewsAPIResponse> {
    return this.getTopHeadlines({
      category: category,
      country: params.country || 'us',
      pageSize: params.pageSize || 20,
      page: params.page || 1
    })
  }

  /**
   * Get news from specific sources
   */
  async getNewsFromSources(sources: string[], params: {
    pageSize?: number
    page?: number
    q?: string
  } = {}): Promise<NewsAPIResponse> {
    return this.getTopHeadlines({
      sources: sources.join(','),
      q: params.q,
      pageSize: params.pageSize || 20,
      page: params.page || 1
    })
  }

  /**
   * Get popular tech sources
   */
  async getPopularTechSources(): Promise<NewsAPISource[]> {
    try {
      const response = await this.getSources({
        category: 'technology',
        language: 'en',
        country: 'us'
      })
      
      return response.sources || []
    } catch (error) {
      console.error('Failed to fetch tech sources:', error)
      return []
    }
  }

  /**
   * Convert NewsAPI article to our internal format
   */
  convertToInternalFormat(apiArticle: NewsAPIArticle): {
    title: string
    content: string
    summary?: string
    url: string
    source: string
    author?: string
    publishedAt: Date
    imageUrl?: string
    tags: string[]
    category?: string
  } {
    // Extract tags from title and description
    const text = `${apiArticle.title} ${apiArticle.description || ''}`.toLowerCase()
    const techKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'ml',
      'blockchain', 'cryptocurrency', 'crypto', 'bitcoin',
      'quantum', 'computing', 'software', 'programming',
      'cybersecurity', 'security', 'hacking', 'privacy',
      'cloud', 'aws', 'azure', 'google cloud',
      'mobile', 'ios', 'android', 'app',
      'web', 'javascript', 'python', 'react', 'vue',
      'data science', 'analytics', 'big data',
      'iot', 'internet of things', 'smart',
      'automation', 'robotics', 'robot',
      'vr', 'ar', 'virtual reality', 'augmented reality',
      '5g', '6g', 'network', 'connectivity',
      'startup', 'venture capital', 'funding',
      'open source', 'github', 'git',
      'database', 'sql', 'nosql',
      'devops', 'kubernetes', 'docker',
      'api', 'microservices', 'serverless'
    ]

    const tags = techKeywords.filter(keyword => 
      text.includes(keyword)
    ).slice(0, 5) // Limit to 5 tags

    // Determine category based on content
    let category = 'Software Development'
    if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('machine learning')) {
      category = 'Software Development'
    } else if (text.includes('test') || text.includes('qa') || text.includes('quality') || text.includes('testing')) {
      category = 'QA & Testing'
    } else if (text.includes('devops') || text.includes('ci/cd') || text.includes('deployment') || text.includes('infrastructure')) {
      category = 'DevOps & Infrastructure'
    } else if (text.includes('security') || text.includes('cybersecurity') || text.includes('vulnerability')) {
      category = 'Security & Testing'
    } else if (text.includes('frontend') || text.includes('react') || text.includes('angular') || text.includes('vue')) {
      category = 'Frontend Development'
    } else if (text.includes('backend') || text.includes('api') || text.includes('microservice') || text.includes('database')) {
      category = 'Backend Development'
    }

    return {
      title: apiArticle.title,
      content: apiArticle.content || apiArticle.description || '',
      summary: apiArticle.description || undefined,
      url: apiArticle.url,
      source: apiArticle.source.name,
      author: apiArticle.author || undefined,
      publishedAt: new Date(apiArticle.publishedAt),
      imageUrl: apiArticle.urlToImage || undefined,
      tags,
      category
    }
  }
}

// Export singleton instance
export const newsAPIService = new NewsAPIService()
export default newsAPIService
