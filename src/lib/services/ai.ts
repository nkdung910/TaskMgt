/**
 * AI Summarization Service
 * 
 * This service provides AI-powered summarization of news articles using
 * multiple AI providers (OpenAI, Anthropic) with fallback options.
 */

export interface SummarizationOptions {
  maxLength?: number
  style?: 'brief' | 'detailed' | 'bullet-points'
  focus?: 'technical' | 'business' | 'general'
}

export interface SummarizationResult {
  summary: string
  provider: 'openai' | 'anthropic' | 'fallback'
  confidence: number
  processingTime: number
}

class AISummarizationService {
  private openaiApiKey: string
  private anthropicApiKey: string
  private enabled: boolean

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || ''
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || ''
    this.enabled = process.env.AI_SUMMARIZATION_ENABLED === 'true'
  }

  /**
   * Check if AI summarization is available
   */
  isAvailable(): boolean {
    return this.enabled && (!!this.openaiApiKey || !!this.anthropicApiKey)
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    const providers = []
    if (this.openaiApiKey && this.openaiApiKey !== 'your-openai-api-key-here') {
      providers.push('openai')
    }
    if (this.anthropicApiKey && this.anthropicApiKey !== 'your-anthropic-api-key-here') {
      providers.push('anthropic')
    }
    return providers
  }

  /**
   * Generate summary using OpenAI
   */
  private async summarizeWithOpenAI(
    content: string, 
    options: SummarizationOptions = {}
  ): Promise<SummarizationResult> {
    const startTime = Date.now()
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: this.buildSystemPrompt(options)
            },
            {
              role: 'user',
              content: `Please summarize this tech news article:\n\n${content}`
            }
          ],
          max_tokens: options.maxLength || 150,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const summary = data.choices?.[0]?.message?.content?.trim()

      if (!summary) {
        throw new Error('No summary generated')
      }

      return {
        summary,
        provider: 'openai',
        confidence: 0.9,
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      throw new Error(`OpenAI summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate summary using Anthropic Claude
   */
  private async summarizeWithAnthropic(
    content: string, 
    options: SummarizationOptions = {}
  ): Promise<SummarizationResult> {
    const startTime = Date.now()
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.anthropicApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: options.maxLength || 150,
          messages: [
            {
              role: 'user',
              content: `${this.buildSystemPrompt(options)}\n\nPlease summarize this tech news article:\n\n${content}`
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`)
      }

      const data = await response.json()
      const summary = data.content?.[0]?.text?.trim()

      if (!summary) {
        throw new Error('No summary generated')
      }

      return {
        summary,
        provider: 'anthropic',
        confidence: 0.9,
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      throw new Error(`Anthropic summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate fallback summary using simple text processing
   */
  private generateFallbackSummary(
    content: string, 
    options: SummarizationOptions = {}
  ): SummarizationResult {
    const startTime = Date.now()
    
    // Simple extractive summarization
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20)
      .slice(0, 3) // Take first 3 sentences
    
    let summary = sentences.join('. ')
    
    // Ensure it ends with a period
    if (summary && !summary.endsWith('.')) {
      summary += '.'
    }
    
    // Truncate if too long
    const maxLength = options.maxLength || 150
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...'
    }
    
    return {
      summary: summary || 'Summary not available',
      provider: 'fallback',
      confidence: 0.5,
      processingTime: Date.now() - startTime
    }
  }

  /**
   * Build system prompt based on options
   */
  private buildSystemPrompt(options: SummarizationOptions): string {
    let prompt = 'You are a tech news summarizer. Create a concise, informative summary of the provided tech news article.'
    
    if (options.style === 'brief') {
      prompt += ' Keep it very brief (1-2 sentences).'
    } else if (options.style === 'detailed') {
      prompt += ' Provide a more detailed summary (3-4 sentences).'
    } else if (options.style === 'bullet-points') {
      prompt += ' Format as bullet points highlighting key points.'
    }
    
    if (options.focus === 'technical') {
      prompt += ' Focus on technical details and implications.'
    } else if (options.focus === 'business') {
      prompt += ' Focus on business impact and market implications.'
    }
    
    prompt += ' Write in a clear, professional tone suitable for a tech audience.'
    
    return prompt
  }

  /**
   * Main summarization method with fallback chain
   */
  async summarize(
    content: string, 
    options: SummarizationOptions = {}
  ): Promise<SummarizationResult> {
    if (!this.isAvailable()) {
      console.log('AI summarization not available, using fallback')
      return this.generateFallbackSummary(content, options)
    }

    const providers = this.getAvailableProviders()
    
    // Try providers in order of preference
    for (const provider of providers) {
      try {
        if (provider === 'openai') {
          return await this.summarizeWithOpenAI(content, options)
        } else if (provider === 'anthropic') {
          return await this.summarizeWithAnthropic(content, options)
        }
      } catch (error) {
        console.warn(`${provider} summarization failed:`, error)
        continue
      }
    }
    
    // If all AI providers fail, use fallback
    console.log('All AI providers failed, using fallback summarization')
    return this.generateFallbackSummary(content, options)
  }

  /**
   * Batch summarize multiple articles
   */
  async summarizeBatch(
    articles: Array<{ id: string; content: string; title: string }>,
    options: SummarizationOptions = {}
  ): Promise<Array<{ id: string; summary: string; provider: string; confidence: number }>> {
    const results = []
    
    for (const article of articles) {
      try {
        const result = await this.summarize(article.content, options)
        results.push({
          id: article.id,
          summary: result.summary,
          provider: result.provider,
          confidence: result.confidence
        })
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Failed to summarize article ${article.id}:`, error)
        results.push({
          id: article.id,
          summary: 'Summary not available',
          provider: 'error',
          confidence: 0
        })
      }
    }
    
    return results
  }

  /**
   * Get service status
   */
  getStatus(): {
    enabled: boolean
    available: boolean
    providers: string[]
    fallbackAvailable: boolean
  } {
    return {
      enabled: this.enabled,
      available: this.isAvailable(),
      providers: this.getAvailableProviders(),
      fallbackAvailable: true
    }
  }
}

// Export singleton instance
export const aiSummarizationService = new AISummarizationService()
export default aiSummarizationService
