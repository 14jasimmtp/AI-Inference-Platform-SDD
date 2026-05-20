import { useAuthStore } from '../store/authStore'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export interface StreamChunk {
  id: string
  model: string
  choices: Array<{
    delta: { role?: string; content: string }
    finish_reason: string | null
  }>
}

// Re-export ChatMessage from types for backward compat
export type { ChatMessage } from '../types'

export const inferenceApi = {
  listModels: async (): Promise<string[]> => {
    const token = localStorage.getItem('access_token')
    const res = await fetch(`${API_BASE}/v1/models`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401) {
      useAuthStore.getState().logout()
      throw new Error('Unauthorized')
    }
    if (!res.ok) throw new Error('Failed to list models')
    const data = await res.json()
    return (data.data || []).map((m: { id: string }) => m.id)
  },

  streamChatCompletion: async (
    model: string,
    messages: import('../types').ChatMessage[],
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (err: string) => void
  ) => {
    const token = localStorage.getItem('access_token')
    const testRpm = localStorage.getItem('test_rate_limit_rpm')
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
    if (testRpm && testRpm !== 'default') {
      headers['x-test-rate-limit-rpm'] = testRpm
    }

    try {
      const response = await fetch(`${API_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, stream: true }),
      })

      if (response.status === 401) {
        useAuthStore.getState().logout()
        onError('Unauthorized')
        return
      }

      if (!response.ok) {
        const err = await response.json()
        onError(err?.error?.message || `HTTP ${response.status}`)
        return
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n').filter((l) => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.replace('data: ', '').trim()
          if (data === '[DONE]') { onDone(); return }
          try {
            const chunk: StreamChunk = JSON.parse(data)
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) onChunk(content)
          } catch (_) { /* skip malformed */ }
        }
      }
      onDone()
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Unknown error')
    }
  },
}
