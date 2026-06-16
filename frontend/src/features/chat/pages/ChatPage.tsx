import React, { useEffect, useState, useRef } from 'react'
import { useChatStore } from '../../../store/chatStore'
import type { ChatSession } from '../../../store/chatStore'
import { useAuthStore } from '../../../store/authStore'
import { Sidebar } from '../../../components/layout/Sidebar'
import { GlobalSearchModal } from '../components/GlobalSearchModal'
import { ChatsListView } from '../components/ChatsListView'
import { ChatWelcomeScreen } from '../components/ChatWelcomeScreen'
import { ActiveChatArea } from '../components/ActiveChatArea'

export const ChatPage: React.FC = () => {
  const { user } = useAuthStore()
  const sessionsByUser = useChatStore((state) => state.sessionsByUser)
  const {
    currentSession,
    streamingContent, streamingSessionId, isStreaming, error,
    model, availableModels,
    newChat, selectSession, deleteSession,
    setModel, sendMessage, loadModels, clearError, retryLastMessage, stopInference,
  } = useChatStore()

  const userId = user?.id || 'anonymous'
  const sessions = sessionsByUser[userId] || []
  const active = currentSession()
  const messages = active?.messages ?? []
  const isNewChat = messages.length === 0
  // Only show streaming content if this session owns the stream
  const isStreamingThisChat = isStreaming && streamingSessionId === active?.id
  const visibleStreamingContent = isStreamingThisChat ? streamingContent : ''

  // Dual state modes: 'chat' | 'chats-list'
  const [viewMode, setViewMode] = useState<'chat' | 'chats-list'>('chat')
  const [inputValue, setInputValue] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Search Modal states
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeeperSearchEnabled, setIsDeeperSearchEnabled] = useState(false)

  // Chats List states
  const [listSearchQuery, setListSearchQuery] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])

  useEffect(() => {
    loadModels()
    if (sessions.length === 0) newChat()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Timezone greeting computations
  const hour = new Date().getHours()
  const displayName = user?.full_name ? user.full_name.trim().split(/\s+/)[0] : 'Jasim'
  let greetingTime = 'Hello'
  let greetingLabel = 'Start'
  if (hour < 12) { greetingTime = 'Morning'; greetingLabel = 'AM' }
  else if (hour < 17) { greetingTime = 'Afternoon'; greetingLabel = 'PM' }
  else { greetingTime = 'Evening'; greetingLabel = 'PM' }

  // Search logic matches titles and message content dynamically.
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

  // Chats list logic.
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
      {/* Sidebar */}
      <Sidebar
        isOpen={viewMode === 'chats-list' ? false : isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTab={viewMode}
        onChangeTab={(tab: any) => {
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

      {/* Main Canvas */}
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
            <span>{error}</span>
            <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>x</button>
          </div>
        )}

        {/* Viewport mode: chats list */}
        {viewMode === 'chats-list' ? (
          <ChatsListView
            sessions={getFilteredListSessions()}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            selectedSessionIds={selectedSessionIds}
            handleSelectAll={handleSelectAll}
            handleDeleteSelected={handleDeleteSelected}
            listSearchQuery={listSearchQuery}
            setListSearchQuery={setListSearchQuery}
            handleRowClick={handleRowClick}
            handleSelectRow={handleSelectRow}
            onNewChat={() => {
              newChat()
              setViewMode('chat')
              setIsSidebarOpen(true)
            }}
          />
        ) : (
          /* Viewport mode: chat workspace */
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
              <ChatWelcomeScreen
                greetingLabel={greetingLabel}
                greetingTime={greetingTime}
                displayName={displayName}
                sendMessage={sendMessage}
                stopInference={stopInference}
                isStreaming={isStreaming}
                inputValue={inputValue}
                setInputValue={setInputValue}
                model={model}
                availableModels={availableModels}
                setModel={setModel}
              />
            ) : (
              <ActiveChatArea
                messages={messages}
                visibleStreamingContent={visibleStreamingContent}
                isStreamingThisChat={isStreamingThisChat}
                retryLastMessage={retryLastMessage}
                sendMessage={sendMessage}
                stopInference={stopInference}
                isStreaming={isStreaming}
                model={model}
                availableModels={availableModels}
                setModel={setModel}
                inputValue={inputValue}
                setInputValue={setInputValue}
              />
            )}
          </>
        )}
      </main>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isDeeperSearchEnabled={isDeeperSearchEnabled}
        setIsDeeperSearchEnabled={setIsDeeperSearchEnabled}
        searchResults={getSearchResults()}
        onSelectSession={(id, matchedIdx) => {
          if (matchedIdx !== undefined) {
            sessionStorage.setItem('targetMessageIndex', String(matchedIdx))
          }
          selectSession(id)
          setViewMode('chat')
          setIsSidebarOpen(true)
          setIsSearchOpen(false)
          setSearchQuery('')
        }}
      />
    </div>
  )
}
