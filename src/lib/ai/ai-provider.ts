import { AIProviderConfig, AIProviderName } from './ai-types'

export function getAIProviderConfig(): AIProviderConfig {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY
  const rawProvider = (process.env.AI_PROVIDER || 'deterministic').toLowerCase()
  const model = process.env.AI_MODEL || (rawProvider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash')

  let provider: AIProviderName = 'deterministic'
  if (apiKey) {
    if (rawProvider.includes('openai')) provider = 'openai'
    else if (rawProvider.includes('anthropic')) provider = 'anthropic'
    else if (rawProvider.includes('gemini')) provider = 'gemini'
    else provider = 'custom'
  }

  return {
    provider,
    apiKey,
    model,
    isConfigured: Boolean(apiKey && provider !== 'deterministic'),
  }
}

export async function generateStructuredInsight(options: {
  systemPrompt: string
  context: any
  schema?: string
}): Promise<{
  success: boolean
  isConfigured: boolean
  rawOutput?: string
  provider: string
  model: string
  message?: string
}> {
  const config = getAIProviderConfig()

  if (!config.isConfigured || !config.apiKey) {
    return {
      success: false,
      isConfigured: false,
      provider: config.provider,
      model: config.model || 'none',
      message: 'AI Provider Not Configured',
    }
  }

  try {
    // Standard OpenAI-compatible fetch or Gemini fetch where configured
    if (config.provider === 'openai' || config.provider === 'custom') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: options.systemPrompt },
            { role: 'user', content: JSON.stringify(options.context) },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      })

      if (!res.ok) {
        return {
          success: false,
          isConfigured: true,
          provider: config.provider,
          model: config.model || '',
          message: `Provider API HTTP Error ${res.status}`,
        }
      }

      const json = await res.json()
      const content = json.choices?.[0]?.message?.content

      return {
        success: true,
        isConfigured: true,
        rawOutput: content,
        provider: config.provider,
        model: config.model || '',
      }
    }

    // Default fallback if provider API unsupported
    return {
      success: false,
      isConfigured: true,
      provider: config.provider,
      model: config.model || '',
      message: 'AI Provider configuration mode unavailable',
    }
  } catch (err: any) {
    return {
      success: false,
      isConfigured: true,
      provider: config.provider,
      model: config.model || '',
      message: err.message || 'AI request failed',
    }
  }
}
