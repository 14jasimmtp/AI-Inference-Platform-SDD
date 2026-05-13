import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { inferenceApi } from '../api/inference'
import type { ChatMessage } from '../types'

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

interface ChatState {
  sessions: ChatSession[]
  currentSessionId: string | null
  streamingContent: string
  isStreaming: boolean
  error: string | null
  model: string
  availableModels: string[]

  // Computed
  currentSession: () => ChatSession | null

  // Session management
  newChat: () => void
  selectSession: (id: string) => void
  deleteSession: (id: string) => void

  // Messaging
  sendMessage: (content: string) => Promise<void>

  // Models
  setModel: (model: string) => void
  loadModels: () => Promise<void>

  clearError: () => void
}

const generateId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

const createSession = (): ChatSession => ({
  id: generateId(),
  title: 'New Chat',
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      streamingContent: '',
      isStreaming: false,
      error: null,
      model: 'llama3.2:3b-instruct-q4_K_M',
      availableModels: [],

      currentSession: () => {
        const { sessions, currentSessionId } = get()
        return sessions.find((s) => s.id === currentSessionId) ?? null
      },

      newChat: () => {
        const session = createSession()
        set((s) => ({
          sessions: [session, ...s.sessions],
          currentSessionId: session.id,
          streamingContent: '',
          error: null,
        }))
      },

      selectSession: (id) => {
        set({ currentSessionId: id, streamingContent: '', error: null })
      },

      deleteSession: (id) => {
        set((s) => {
          const remaining = s.sessions.filter((sess) => sess.id !== id)
          const newCurrentId =
            s.currentSessionId === id
              ? remaining[0]?.id ?? null
              : s.currentSessionId
          return { sessions: remaining, currentSessionId: newCurrentId }
        })
      },

      sendMessage: async (content: string) => {
        if (get().isStreaming) return

        // Ensure we have an active session
        let session = get().currentSession()
        if (!session) {
          const newSession = createSession()
          set((s) => ({
            sessions: [newSession, ...s.sessions],
            currentSessionId: newSession.id,
          }))
          session = newSession
        }

        const userMsg: ChatMessage = { role: 'user', content }
        const updatedMessages = [...session.messages, userMsg]

        // Derive title from first user message (first 40 chars)
        const isFirstMessage = session.messages.length === 0
        const title = isFirstMessage
          ? content.slice(0, 40) + (content.length > 40 ? '…' : '')
          : session.title

        // Update session with user message
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === session!.id
              ? { ...sess, messages: updatedMessages, title, updatedAt: Date.now() }
              : sess
          ),
          isStreaming: true,
          streamingContent: '',
          error: null,
        }))

        const sessionId = session.id

        await inferenceApi.streamChatCompletion(
          get().model,
          updatedMessages,
          (chunk) => {
            set((s) => ({ streamingContent: s.streamingContent + chunk }))
          },
          () => {
            const finalContent = get().streamingContent
            const assistantMsg: ChatMessage = { role: 'assistant', content: finalContent }
            set((s) => ({
              sessions: s.sessions.map((sess) =>
                sess.id === sessionId
                  ? {
                      ...sess,
                      messages: [...sess.messages, assistantMsg],
                      updatedAt: Date.now(),
                    }
                  : sess
              ),
              streamingContent: '',
              isStreaming: false,
            }))
          },
          (err) => {
            set({ error: err, isStreaming: false, streamingContent: '' })
          }
        )
      },

      setModel: (model) => set({ model }),

      loadModels: async () => {
        try {
          const models = await inferenceApi.listModels()
          set({ availableModels: models })
          const current = get().model
          if (models.length > 0 && !models.includes(current)) {
            set({ model: models[0] })
          }
        } catch (_) {
          // Ollama may not be running
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'chat-storage',
      // Only persist sessions, model choice, and currentSessionId
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        model: state.model,
      }),
    }
  )
)
