import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '../store/chatStore'
import type { ChatSession } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import { MessageList } from '../components/MessageList'
import { InputField } from '../components/InputField'
import { ModelPicker } from '../components/ModelPicker'
import { Sidebar } from '../components/layout/Sidebar'

const getRelativeTime = (ts: number) => {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export const ChatPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const sessionsByUser = useChatStore((state) => state.sessionsByUser)
  const {
    currentSession,
    streamingContent, isStreaming, error,
    model, availableModels,
    newChat, selectSession, deleteSession,
    setModel, sendMessage, loadModels, clearError, retryLastMessage,
  } = useChatStore()

  const userId = user?.id || 'anonymous'
  const sessions = sessionsByUser[userId] || []
  const active = currentSession()
  const messages = active?.messages ?? []
  const isNewChat = messages.length === 0

  // Dual state modes: 'chat' | 'chats-list'
  const [viewMode, setViewMode] = useState<'chat' | 'chats-list'>('chat')
  const [inputValue, setInputValue] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Search Modal states
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeeperSearchEnabled, setIsDeeperSearchEnabled] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Chats List states
  const [listSearchQuery, setListSearchQuery] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])

  useEffect(() => {
    loadModels()
    if (sessions.length === 0) newChat()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus search input when opening modal
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Timezone greeting computations
  const hour = new Date().getHours()
  const displayName = user?.full_name ? user.full_name.trim().split(/\s+/)[0] : 'Jasim'
  let greetingTime = 'Hello'
  let greetingIcon = '✨'
  if (hour < 12) { greetingTime = 'Morning'; greetingIcon = '🌅' }
  else if (hour < 17) { greetingTime = 'Afternoon'; greetingIcon = '🍊' }
  else { greetingTime = 'Evening'; greetingIcon = '🌙' }

  // ── SEARCH LOGIC (Matches titles & message content dynamically) ──
  const getSearchResults = (): ChatSession[] => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return sessions.filter((sess) => {
      const matchTitle = sess.title.toLowerCase().includes(q)
      if (isDeeperSearchEnabled) {
        const matchMsg = sess.messages.some((m) => m.content.toLowerCase().includes(q))
        return matchTitle || matchMsg
      }
      return matchTitle
    })
  }

  // ── CHATS LIST LOGIC ──
  const getFilteredListSessions = (): ChatSession[] => {
    if (!listSearchQuery.trim()) return sessions
    const q = listSearchQuery.toLowerCase()
    return sessions.filter((sess) => sess.title.toLowerCase().includes(q))
  }

  const handleSelectRow = (id: string) => {
    setSelectedSessionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    const allIds = getFilteredListSessions().map((s) => s.id)
    if (selectedSessionIds.length === allIds.length) {
      setSelectedSessionIds([])
    } else {
      setSelectedSessionIds(allIds)
    }
  }

  const handleDeleteSelected = () => {
    selectedSessionIds.forEach((id) => {
      deleteSession(id)
    })
    setSelectedSessionIds([])
    setIsEditMode(false)
  }

  const handleRowClick = (session: ChatSession) => {
    if (isEditMode) {
      handleSelectRow(session.id)
    } else {
      selectSession(session.id)
      setViewMode('chat')
      setIsSidebarOpen(true)
    }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--color-bg-canvas)',
      color: 'var(--color-text-primary)',
      transition: 'var(--transition-smooth)',
      width: '100%',
      position: 'relative'
    }}>
      {/* ── Sidebar ── */}
      <Sidebar 
        isOpen={viewMode === 'chats-list' ? false : isSidebarOpen} // Collapses sidebar automatically in Chats List as per screenshot
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTab={viewMode}
        onChangeTab={(tab) => {
          setViewMode(tab)
          setIsEditMode(false)
          setSelectedSessionIds([])
          if (tab === 'chats-list') {
            setIsSidebarOpen(false)
          } else {
            setIsSidebarOpen(true)
          }
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* ── Main Canvas ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-bg-canvas)',
        transition: 'var(--transition-smooth)',
        position: 'relative'
      }}>
        {/* Global Error Banner */}
        {error && (
          <div className="claude-sans-control" style={{
            margin: '12px 24px 0',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: '#ef4444',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 20
          }}>
            <span>⚠ {error}</span>
            <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* ── VIEWPORT MODE: CHATS LIST (Image 2 & 3) ── */}
        {viewMode === 'chats-list' ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '48px 24px',
            overflowY: 'auto',
            background: 'var(--color-bg-canvas)',
            width: '100%'
          }}>
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Header section (Image 2 vs Image 3) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 className="claude-serif-title" style={{ fontSize: '2.2rem', fontWeight: 500, margin: 0, color: 'var(--color-text-primary)' }}>
                  Chats
                </h1>

                {/* Top Action buttons */}
                {!isEditMode ? (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="claude-sans-control claude-focus-ring"
                      style={{
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '999px',
                        padding: '8px 18px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-card)'}
                    >
                      Select chats
                    </button>
                    <button
                      onClick={() => {
                        newChat()
                        setViewMode('chat')
                        setIsSidebarOpen(true)
                      }}
                      className="claude-sans-control claude-focus-ring"
                      style={{
                        background: 'var(--color-text-primary)',
                        border: 'none',
                        borderRadius: '999px',
                        padding: '8px 18px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--color-bg-canvas)',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      New chat
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className="claude-sans-control" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      {selectedSessionIds.length} selected
                    </span>
                    <button
                      onClick={handleSelectAll}
                      className="claude-sans-control claude-focus-ring"
                      style={{
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {selectedSessionIds.length === getFilteredListSessions().length ? 'Deselect all' : 'Select all'}
                    </button>
                    <button
                      disabled
                      className="claude-sans-control"
                      style={{
                        background: 'var(--color-border-subtle)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-secondary)',
                        cursor: 'not-allowed',
                        opacity: 0.6
                      }}
                    >
                      Move to project
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={selectedSessionIds.length === 0}
                      className="claude-sans-control claude-focus-ring"
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        color: selectedSessionIds.length === 0 ? 'var(--color-text-secondary)' : '#ef4444',
                        cursor: selectedSessionIds.length === 0 ? 'not-allowed' : 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedSessionIds.length > 0) e.currentTarget.style.background = 'rgba(239,68,68,0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setIsEditMode(false)
                        setSelectedSessionIds([])
                      }}
                      className="claude-sans-control claude-focus-ring"
                      style={{
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Real-time search box (Image 2) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '12px',
                padding: '12px 18px',
                width: '100%',
                transition: 'var(--transition-smooth)'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.2" style={{ marginRight: '12px', flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  className="claude-sans-control"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.95rem',
                    color: 'var(--color-text-primary)',
                    width: '100%'
                  }}
                />
                {listSearchQuery && (
                  <button
                    onClick={() => setListSearchQuery('')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.1rem' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Chat Session rows list */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: '8px' }}>
                {getFilteredListSessions().length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                    No sessions found.
                  </div>
                ) : (
                  getFilteredListSessions().map((sess) => {
                    const isSelected = selectedSessionIds.includes(sess.id)
                    return (
                      <div
                        key={sess.id}
                        onClick={() => handleRowClick(sess)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '18px 16px',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(0,0,0,0.015)' : 'transparent',
                          transition: 'var(--transition-smooth)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.01)'
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                          {isEditMode && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(sess.id)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                          )}
                          <span className="claude-serif-title" style={{
                            fontSize: '1.05rem',
                            color: 'var(--color-text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontWeight: 500
                          }}>
                            {sess.title}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                          {getRelativeTime(sess.updatedAt)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── VIEWPORT MODE: CHAT WORKSPACE ── */
          <>
            {/* Header (Only visible during active chat) */}
            {!isNewChat && (
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--color-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--color-bg-canvas)',
                transition: 'var(--transition-smooth)'
              }}>
                <h1 className="claude-serif-title" style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', margin: 0 }}>
                  {active?.title || 'Chat'}
                </h1>
              </div>
            )}

            {isNewChat ? (
              /* STATE A: STARTING A NEW CHAT (Centered Welcome Canvas - Image 1) */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                padding: '0 24px',
                width: '100%',
                transition: 'var(--transition-smooth)'
              }}>
                <div style={{
                  width: '100%',
                  maxWidth: '800px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '32px',
                  transform: 'translateY(-30px)',
                  transition: 'var(--transition-smooth)'
                }}>
                  {/* Dynamic Serif Title */}
                  <h2 className="claude-serif-title" style={{
                    fontSize: '2.6rem',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    margin: 0
                  }}>
                    <span style={{ color: 'var(--color-accent-amber)' }}>{greetingIcon}</span>
                    {greetingTime}, {displayName}
                  </h2>

                  {/* Centered Input Box Container */}
                  <div style={{ width: '100%' }}>
                    <InputField
                      onSend={sendMessage}
                      disabled={isStreaming}
                      placeholder="How can I help you today?"
                      value={inputValue}
                      onChange={setInputValue}
                      modelPicker={
                        <ModelPicker
                          model={model}
                          availableModels={availableModels}
                          onSelect={setModel}
                          disabled={isStreaming}
                        />
                      }
                    />
                  </div>

                  {/* Quick suggestion chips under chat bar */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '-8px'
                  }}>
                    {[
                      { label: 'Write', icon: '📝', prompt: 'Write a comprehensive guide on...' },
                      { label: 'Learn', icon: '🎓', prompt: 'Explain the concept of...' },
                      { label: 'Code', icon: '💻', prompt: 'Help me write code to...' },
                      { label: 'Life stuff', icon: '☕', prompt: 'Plan a relaxing weekend itinerary for...' }
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        onClick={() => setInputValue(chip.prompt)}
                        className="claude-sans-control claude-focus-ring"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'var(--color-bg-card)',
                          border: '1px solid var(--color-border-subtle)',
                          borderRadius: '999px',
                          padding: '8px 16px',
                          fontSize: '0.85rem',
                          color: 'var(--color-text-secondary)',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--color-accent-amber-glow)'
                          e.currentTarget.style.color = 'var(--color-accent-amber)'
                          e.currentTarget.style.borderColor = 'var(--color-accent-amber-glow)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--color-bg-card)'
                          e.currentTarget.style.color = 'var(--color-text-secondary)'
                          e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
                        }}
                      >
                        <span>{chip.icon}</span>
                        <span>{chip.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* STATE B: ACTIVE CHAT SESSION (Bottom Pinned View - Image 2) */
              <>
                {/* Scrollable Message History */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  overflowY: 'auto',
                  scrollBehavior: 'smooth',
                  width: '100%',
                }}>
                  <div style={{ width: '100%', maxWidth: '850px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <MessageList
                      messages={messages}
                      streamingContent={streamingContent}
                      isStreaming={isStreaming}
                      onRetry={retryLastMessage}
                    />
                  </div>
                </div>

                {/* Pinned Bottom Input Bar Card */}
                <div style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0 24px 24px 24px',
                  background: 'linear-gradient(180deg, transparent 0%, var(--color-bg-canvas) 20%)',
                  zIndex: 10
                }}>
                  <div style={{ width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column' }}>
                    <InputField
                      onSend={sendMessage}
                      disabled={isStreaming}
                      placeholder={`Message ${model}...`}
                      value={inputValue}
                      onChange={setInputValue}
                      modelPicker={
                        <ModelPicker
                          model={model}
                          availableModels={availableModels}
                          onSelect={setModel}
                          disabled={isStreaming}
                        />
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* ── 3. GLOBAL SEARCH MODAL OVERLAY (Image 4) ── */}
      {isSearchOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fade-in 0.25s ease-out'
        }} onClick={() => setIsSearchOpen(false)}>
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Search Input field */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.2" style={{ marginRight: '12px' }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="claude-sans-control"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  color: 'var(--color-text-primary)',
                  width: '100%'
                }}
              />
              <button
                onClick={() => {
                  if (searchQuery) setSearchQuery('')
                  else setIsSearchOpen(false)
                }}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Results scroll area */}
            <div style={{ flex: 1, maxHeight: '280px', overflowY: 'auto', padding: '12px 0' }}>
              {!searchQuery.trim() ? (
                <div style={{ padding: '24px 20px', color: 'var(--color-text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>
                  Type to search through chat titles & message contents
                </div>
              ) : (
                <>
                  <p className="claude-sans-control" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 20px 8px 20px' }}>
                    Search results
                  </p>
                  {getSearchResults().length === 0 ? (
                    <div style={{ padding: '16px 20px', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      No matching chats found
                    </div>
                  ) : (
                    getSearchResults().map((sess) => (
                      <div
                        key={sess.id}
                        onClick={() => {
                          const matchedIdx = sess.messages.findIndex((m) =>
                            m.content.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          if (matchedIdx !== -1) {
                            sessionStorage.setItem('targetMessageIndex', String(matchedIdx))
                          }
                          selectSession(sess.id)
                          setViewMode('chat')
                          setIsSidebarOpen(true)
                          setIsSearchOpen(false)
                          setSearchQuery('')
                        }}
                        style={{
                          padding: '12px 20px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          transition: 'var(--transition-smooth)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-border-subtle)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span className="claude-serif-title" style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                          {sess.title}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          Last active {getRelativeTime(sess.updatedAt)}
                        </span>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>

            {/* Search deeper row */}
            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingBottom: '16px' }}>
              <p className="claude-sans-control" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 20px 4px 20px' }}>
                Search deeper
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 20px 0 20px',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', cursor: 'pointer' }} onClick={() => setIsDeeperSearchEnabled(!isDeeperSearchEnabled)}>
                  <span className="claude-sans-control" style={{ fontSize: '0.925rem', fontWeight: 500, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔍 Search inside message contents
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    Enables deep matching through historical conversation text
                  </span>
                </div>
                
                {/* Custom Minimalist Toggle Switch */}
                <div 
                  className="claude-focus-ring"
                  style={{
                    width: '38px',
                    height: '22px',
                    borderRadius: '999px',
                    background: isDeeperSearchEnabled ? 'var(--color-accent-amber)' : 'var(--color-border-subtle)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    position: 'relative',
                    transition: 'background 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'pointer',
                    outline: 'none',
                    flexShrink: 0
                  }}
                  onClick={() => setIsDeeperSearchEnabled(!isDeeperSearchEnabled)}
                  title={isDeeperSearchEnabled ? "Disable deeper search" : "Enable deeper search"}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    position: 'absolute',
                    top: '2px',
                    left: isDeeperSearchEnabled ? '18px' : '2px',
                    transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styled search animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-up {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
