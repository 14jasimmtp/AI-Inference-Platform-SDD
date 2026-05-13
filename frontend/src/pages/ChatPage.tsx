import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import { MessageList } from '../components/MessageList'
import { InputField } from '../components/InputField'
import { ModelPicker } from '../components/ModelPicker'

const formatDate = (ts: number) => {
  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export const ChatPage: React.FC = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()
  const {
    sessions, currentSessionId, currentSession,
    streamingContent, isStreaming, error,
    model, availableModels,
    newChat, selectSession, deleteSession,
    setModel, sendMessage, loadModels, clearError,
  } = useChatStore()

  const active = currentSession()

  useEffect(() => {
    loadModels()
    if (sessions.length === 0) newChat()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="chat-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">AI Inference</span>
          </div>
        </div>

        {/* New chat button */}
        <button id="new-chat-btn" onClick={newChat} className="new-chat-btn">
          <span>+</span> New Chat
        </button>

        {/* Chat history */}
        <div className="chat-history">
          {sessions.length === 0 && (
            <p className="history-empty">No chats yet</p>
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`history-item ${session.id === currentSessionId ? 'active' : ''}`}
              onClick={() => selectSession(session.id)}
            >
              <div className="history-item-content">
                <span className="history-title">{session.title}</span>
                <span className="history-date">{formatDate(session.updatedAt)}</span>
              </div>
              <button
                className="history-delete"
                onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                title="Delete chat"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.full_name || 'User'}</span>
              <span className="user-role">{user?.role || 'user'}</span>
            </div>
          </div>
          <button id="logout-btn" onClick={handleLogout} className="logout-btn" title="Logout">
            ↩
          </button>
        </div>
      </aside>

      {/* ── Main chat area ── */}
      <main className="chat-main">
        <div className="chat-header">
          <h1 className="chat-title">{active?.title || 'Chat'}</h1>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <span>⚠ {error}</span>
            <button onClick={clearError} className="error-close">✕</button>
          </div>
        )}

        <MessageList
          messages={active?.messages ?? []}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
        />

        {/* Input + Model Picker */}
        <div className="input-zone">
          <InputField
            onSend={sendMessage}
            disabled={isStreaming}
            placeholder={`Message ${model}...`}
          />
          <div className="input-toolbar">
            <ModelPicker
              model={model}
              availableModels={availableModels}
              onSelect={setModel}
              disabled={isStreaming}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
