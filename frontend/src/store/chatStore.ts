import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { inferenceApi } from '../api/inference'
import { useAuthStore } from './authStore'
import type { ChatMessage } from '../types'

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

interface ChatState {
  sessionsByUser: Record<string, ChatSession[]>
  currentSessionIdByUser: Record<string, string | null>
  streamingContent: string
  isStreaming: boolean
  error: string | null
  model: string
  availableModels: string[]

  // Computed / Accessors
  getSessions: () => ChatSession[]
  currentSession: () => ChatSession | null

  // Session management
  newChat: () => void
  selectSession: (id: string) => void
  deleteSession: (id: string) => void

  // Messaging
  sendMessage: (content: string) => Promise<void>
  retryLastMessage: () => Promise<void>
  editMessage: (index: number, newContent: string) => Promise<void>

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

const getUserId = () => useAuthStore.getState().user?.id || 'anonymous'

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessionsByUser: {},
      currentSessionIdByUser: {},
      streamingContent: '',
      isStreaming: false,
      error: null,
      model: 'llama3.2:3b-instruct-q4_K_M',
      availableModels: [],

      getSessions: () => {
        const userId = getUserId()
        return get().sessionsByUser[userId] || []
      },

      currentSession: () => {
        const userId = getUserId()
        const sessions = get().sessionsByUser[userId] || []
        const currentId = get().currentSessionIdByUser[userId]
        return sessions.find((s) => s.id === currentId) ?? null
      },

      newChat: () => {
        const userId = getUserId()
        const session = createSession()
        set((s) => {
          const userSessions = s.sessionsByUser[userId] || []
          return {
            sessionsByUser: { ...s.sessionsByUser, [userId]: [session, ...userSessions] },
            currentSessionIdByUser: { ...s.currentSessionIdByUser, [userId]: session.id },
            streamingContent: '',
            error: null,
          }
        })
      },

      selectSession: (id) => {
        const userId = getUserId()
        set((s) => ({
          currentSessionIdByUser: { ...s.currentSessionIdByUser, [userId]: id },
          streamingContent: '',
          error: null,
        }))
      },

      deleteSession: (id) => {
        const userId = getUserId()
        set((s) => {
          const userSessions = s.sessionsByUser[userId] || []
          const currentId = s.currentSessionIdByUser[userId]
          const remaining = userSessions.filter((sess) => sess.id !== id)
          const newCurrentId = currentId === id ? remaining[0]?.id ?? null : currentId
          
          return {
            sessionsByUser: { ...s.sessionsByUser, [userId]: remaining },
            currentSessionIdByUser: { ...s.currentSessionIdByUser, [userId]: newCurrentId },
          }
        })
      },

      sendMessage: async (content: string) => {
        if (get().isStreaming) return

        const userId = getUserId()
        let session = get().currentSession()
        
        if (!session) {
          const newSession = createSession()
          set((s) => {
            const userSessions = s.sessionsByUser[userId] || []
            return {
              sessionsByUser: { ...s.sessionsByUser, [userId]: [newSession, ...userSessions] },
              currentSessionIdByUser: { ...s.currentSessionIdByUser, [userId]: newSession.id },
            }
          })
          session = newSession
        }

        const userMsg: ChatMessage = { role: 'user', content, timestamp: Date.now() }
        const updatedMessages = [...session.messages, userMsg]

        const isFirstMessage = session.messages.length === 0
        const title = isFirstMessage
          ? content.slice(0, 40) + (content.length > 40 ? '…' : '')
          : session.title

        set((s) => {
          const userSessions = s.sessionsByUser[userId] || []
          return {
            sessionsByUser: {
              ...s.sessionsByUser,
              [userId]: userSessions.map((sess) =>
                sess.id === session!.id
                  ? { ...sess, messages: updatedMessages, title, updatedAt: Date.now() }
                  : sess
              ),
            },
            isStreaming: true,
            streamingContent: '',
            error: null,
          }
        })

        const sessionId = session.id

        await inferenceApi.streamChatCompletion(
          get().model,
          updatedMessages,
          (chunk) => {
            set((s) => ({ streamingContent: s.streamingContent + chunk }))
          },
          () => {
            const finalContent = get().streamingContent
            const assistantMsg: ChatMessage = { role: 'assistant', content: finalContent, timestamp: Date.now() }
            set((s) => {
              const userSessions = s.sessionsByUser[userId] || []
              return {
                sessionsByUser: {
                  ...s.sessionsByUser,
                  [userId]: userSessions.map((sess) =>
                    sess.id === sessionId
                      ? { ...sess, messages: [...sess.messages, assistantMsg], updatedAt: Date.now() }
                      : sess
                  ),
                },
                streamingContent: '',
                isStreaming: false,
              }
            })
          },
          (err) => {
            set({ error: err, isStreaming: false, streamingContent: '' })
          }
        )
      },

      retryLastMessage: async () => {
        if (get().isStreaming) return

        const userId = getUserId()
        const session = get().currentSession()
        if (!session || session.messages.length === 0) return

        let updatedMessages = [...session.messages]
        const lastMsg = updatedMessages[updatedMessages.length - 1]

        if (lastMsg.role === 'assistant') {
          updatedMessages.pop()
        }

        if (updatedMessages.length === 0) return
        const lastUserMsg = updatedMessages[updatedMessages.length - 1]
        if (lastUserMsg.role !== 'user') return

        set((s) => {
          const userSessions = s.sessionsByUser[userId] || []
          return {
            sessionsByUser: {
              ...s.sessionsByUser,
              [userId]: userSessions.map((sess) =>
                sess.id === session!.id
                  ? { ...sess, messages: updatedMessages, updatedAt: Date.now() }
                  : sess
              ),
            },
            isStreaming: true,
            streamingContent: '',
            error: null,
          }
        })

        const sessionId = session.id

        await inferenceApi.streamChatCompletion(
          get().model,
          updatedMessages,
          (chunk) => {
            set((s) => ({ streamingContent: s.streamingContent + chunk }))
          },
          () => {
            const finalContent = get().streamingContent
            const assistantMsg: ChatMessage = { role: 'assistant', content: finalContent, timestamp: Date.now() }
            set((s) => {
              const userSessions = s.sessionsByUser[userId] || []
              return {
                sessionsByUser: {
                  ...s.sessionsByUser,
                  [userId]: userSessions.map((sess) =>
                    sess.id === sessionId
                      ? { ...sess, messages: [...sess.messages, assistantMsg], updatedAt: Date.now() }
                      : sess
                  ),
                },
                streamingContent: '',
                isStreaming: false,
              }
            })
          },
          (err) => {
            set({ error: err, isStreaming: false, streamingContent: '' })
          }
        )
      },

      editMessage: async (index: number, newContent: string) => {
        if (get().isStreaming) return

        const userId = getUserId()
        const session = get().currentSession()
        if (!session || index < 0 || index >= session.messages.length) return

        // Truncate messages after index, and update message at index
        const updatedMessages = session.messages.slice(0, index)
        const userMsg: ChatMessage = { 
          role: 'user', 
          content: newContent, 
          timestamp: session.messages[index].timestamp || Date.now() 
        }
        updatedMessages.push(userMsg)

        const isFirstMessage = index === 0
        const title = isFirstMessage
          ? newContent.slice(0, 40) + (newContent.length > 40 ? '…' : '')
          : session.title

        set((s) => {
          const userSessions = s.sessionsByUser[userId] || []
          return {
            sessionsByUser: {
              ...s.sessionsByUser,
              [userId]: userSessions.map((sess) =>
                sess.id === session!.id
                  ? { ...sess, messages: updatedMessages, title, updatedAt: Date.now() }
                  : sess
              ),
            },
            isStreaming: true,
            streamingContent: '',
            error: null,
          }
        })

        const sessionId = session.id

        await inferenceApi.streamChatCompletion(
          get().model,
          updatedMessages,
          (chunk) => {
            set((s) => ({ streamingContent: s.streamingContent + chunk }))
          },
          () => {
            const finalContent = get().streamingContent
            const assistantMsg: ChatMessage = { role: 'assistant', content: finalContent, timestamp: Date.now() }
            set((s) => {
              const userSessions = s.sessionsByUser[userId] || []
              return {
                sessionsByUser: {
                  ...s.sessionsByUser,
                  [userId]: userSessions.map((sess) =>
                    sess.id === sessionId
                      ? { ...sess, messages: [...sess.messages, assistantMsg], updatedAt: Date.now() }
                      : sess
                  ),
                },
                streamingContent: '',
                isStreaming: false,
              }
            })
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
          // Remove auto-selection override if model is already selected to fix Issue #2
          // We only set the model if the currently selected model is NOT in the list
          // AND it's not the initial load where a valid model might already be selected.
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
      name: 'chat-storage-v2',
      partialize: (state) => ({
        sessionsByUser: state.sessionsByUser,
        currentSessionIdByUser: state.currentSessionIdByUser,
        model: state.model,
      }),
    }
  )
)
