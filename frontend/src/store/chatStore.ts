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
  streamingSessionId: string | null  // tracks WHICH session owns the stream
  isStreaming: boolean
  error: string | null
  model: string
  availableModels: string[]

  // Internal: AbortController for in-flight inference
  _abortController: AbortController | null

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
  stopInference: () => void

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
      streamingSessionId: null,
      isStreaming: false,
      error: null,
      model: 'llama3.2:3b-instruct-q4_K_M',
      availableModels: [],
      _abortController: null,

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
            streamingSessionId: null,
            error: null,
          }
        })
      },

      selectSession: (id) => {
        const userId = getUserId()
        set((s) => ({
          currentSessionIdByUser: { ...s.currentSessionIdByUser, [userId]: id },
          error: null,
          // Don't clear streamingContent or streamingSessionId — the stream
          // continues in the background and only writes to the correct session
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

      stopInference: () => {
        const ctrl = get()._abortController
        if (ctrl) {
          ctrl.abort()
        }
        // The abort handler in the stream will call onDone which saves
        // whatever content has been streamed so far
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

        const abortController = new AbortController()
        const sessionId = session.id

        set((s) => {
          const userSessions = s.sessionsByUser[userId] || []
          return {
            sessionsByUser: {
              ...s.sessionsByUser,
              [userId]: userSessions.map((sess) =>
                sess.id === sessionId
                  ? { ...sess, messages: updatedMessages, title, updatedAt: Date.now() }
                  : sess
              ),
            },
            isStreaming: true,
            streamingContent: '',
            streamingSessionId: sessionId,
            error: null,
            _abortController: abortController,
          }
        })

        await inferenceApi.streamChatCompletion(
          get().model,
          updatedMessages,
          (chunk) => {
            // Only accumulate if we're still streaming for this session
            if (get().streamingSessionId === sessionId) {
              set((s) => ({ streamingContent: s.streamingContent + chunk }))
            }
          },
          () => {
            const finalContent = get().streamingContent
            if (finalContent.trim()) {
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
                  streamingSessionId: null,
                  isStreaming: false,
                  _abortController: null,
                }
              })
            } else {
              set({ streamingContent: '', streamingSessionId: null, isStreaming: false, _abortController: null })
            }
          },
          (err) => {
            set({ error: err, isStreaming: false, streamingContent: '', streamingSessionId: null, _abortController: null })
          },
          abortController.signal
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

        const abortController = new AbortController()
        const sessionId = session.id

        set((s) => {
          const userSessions = s.sessionsByUser[userId] || []
          return {
            sessionsByUser: {
              ...s.sessionsByUser,
              [userId]: userSessions.map((sess) =>
                sess.id === sessionId
                  ? { ...sess, messages: updatedMessages, updatedAt: Date.now() }
                  : sess
              ),
            },
            isStreaming: true,
            streamingContent: '',
            streamingSessionId: sessionId,
            error: null,
            _abortController: abortController,
          }
        })

        await inferenceApi.streamChatCompletion(
          get().model,
          updatedMessages,
          (chunk) => {
            if (get().streamingSessionId === sessionId) {
              set((s) => ({ streamingContent: s.streamingContent + chunk }))
            }
          },
          () => {
            const finalContent = get().streamingContent
            if (finalContent.trim()) {
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
                  streamingSessionId: null,
                  isStreaming: false,
                  _abortController: null,
                }
              })
            } else {
              set({ streamingContent: '', streamingSessionId: null, isStreaming: false, _abortController: null })
            }
          },
          (err) => {
            set({ error: err, isStreaming: false, streamingContent: '', streamingSessionId: null, _abortController: null })
          },
          abortController.signal
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

        const abortController = new AbortController()
        const sessionId = session.id

        set((s) => {
          const userSessions = s.sessionsByUser[userId] || []
          return {
            sessionsByUser: {
              ...s.sessionsByUser,
              [userId]: userSessions.map((sess) =>
                sess.id === sessionId
                  ? { ...sess, messages: updatedMessages, title, updatedAt: Date.now() }
                  : sess
              ),
            },
            isStreaming: true,
            streamingContent: '',
            streamingSessionId: sessionId,
            error: null,
            _abortController: abortController,
          }
        })

        await inferenceApi.streamChatCompletion(
          get().model,
          updatedMessages,
          (chunk) => {
            if (get().streamingSessionId === sessionId) {
              set((s) => ({ streamingContent: s.streamingContent + chunk }))
            }
          },
          () => {
            const finalContent = get().streamingContent
            if (finalContent.trim()) {
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
                  streamingSessionId: null,
                  isStreaming: false,
                  _abortController: null,
                }
              })
            } else {
              set({ streamingContent: '', streamingSessionId: null, isStreaming: false, _abortController: null })
            }
          },
          (err) => {
            set({ error: err, isStreaming: false, streamingContent: '', streamingSessionId: null, _abortController: null })
          },
          abortController.signal
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
