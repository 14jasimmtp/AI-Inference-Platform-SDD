// Shared types — not type-only, so they can be imported without `import type`
export const ROLES = ['user', 'assistant', 'system'] as const
export type MessageRole = typeof ROLES[number]

export interface ChatMessage {
  role: MessageRole
  content: string
  timestamp?: number
}
