import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useChatStore } from '../../store/chatStore'
import { useTheme } from '../../hooks/useTheme'

const formatDate = (ts: number) => {
  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const getInitials = (name?: string) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  activeTab: 'chat' | 'chats-list'
  onChangeTab: (tab: 'chat' | 'chats-list') => void
  onOpenSearch: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle, 
  activeTab, 
  onChangeTab, 
  onOpenSearch 
}) => {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()
  const sessionsByUser = useChatStore((state) => state.sessionsByUser)
  const currentSessionIdByUser = useChatStore((state) => state.currentSessionIdByUser)
  const { newChat, selectSession, deleteSession } = useChatStore()
  const { isDark, toggleTheme } = useTheme()

  const userId = user?.id || 'anonymous'
  const sessions = sessionsByUser[userId] || []
  const currentSessionId = currentSessionIdByUser[userId]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Layout icon SVG shared between modes
  const ToggleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  )

  if (!isOpen) {
    // ── COLLAPSED SIDEBAR (64px Wide) ──
    return (
      <aside className="sidebar claude-sans-control" style={{ 
        background: 'var(--color-bg-card)', 
        borderColor: 'var(--color-border-subtle)', 
        borderRight: '1px solid var(--color-border-subtle)',
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '64px',
        flexShrink: 0,
        padding: '20px 8px',
        gap: '20px',
        height: '100%',
        zIndex: 50
      }}>
        {/* Toggle Button at very top */}
        <button 
          onClick={onToggle}
          className="claude-focus-ring"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-accent-amber-glow)'
            e.currentTarget.style.color = 'var(--color-accent-amber)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-text-secondary)'
          }}
          title="Open Sidebar"
        >
          <ToggleIcon />
        </button>

        {/* Center Pill Circle New Chat Button */}
        <button 
          onClick={() => {
            newChat()
            onChangeTab('chat')
          }} 
          className="claude-focus-ring" 
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-bg-canvas)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '50%',
            color: 'var(--color-text-primary)',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-accent-amber-glow)'
            e.currentTarget.style.borderColor = 'var(--color-accent-amber)'
            e.currentTarget.style.color = 'var(--color-accent-amber)'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-canvas)'
            e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
            e.currentTarget.style.color = 'var(--color-text-primary)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="New Chat"
        >
          <span style={{ fontSize: '1.4rem', fontWeight: 300, lineHeight: 0 }}>+</span>
        </button>

        {/* Dynamic Navigation Icons - ONLY Search and Chats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', width: '100%' }}>
          {/* Search Icon */}
          <button 
            onClick={onOpenSearch}
            className="claude-focus-ring"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--color-text-secondary)', 
              cursor: 'pointer', 
              padding: '8px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'var(--transition-smooth)'
            }}
            title="Search Chats (🔍)"
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Chats Bubble */}
          <button 
            onClick={() => onChangeTab('chats-list')}
            className="claude-focus-ring"
            style={{ 
              background: activeTab === 'chats-list' ? 'var(--color-accent-amber-glow)' : 'transparent', 
              border: 'none', 
              color: activeTab === 'chats-list' ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)', 
              cursor: 'pointer', 
              padding: '8px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'var(--transition-smooth)'
            }}
            title="All Chats (💬)"
            onMouseEnter={(e) => {
              if (activeTab !== 'chats-list') e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'chats-list') e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>

        {/* Footer Actions */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          {/* Light/Dark Toggle */}
          <button 
            onClick={toggleTheme} 
            className="claude-focus-ring"
            style={{ 
              padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', 
              color: 'var(--color-text-secondary)', borderRadius: '8px', transition: 'var(--transition-smooth)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title={isDark ? "Light Mode" : "Dark Mode"}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Settings cog */}
          <button 
            onClick={() => navigate('/settings')} 
            className="claude-focus-ring"
            style={{ 
              padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', 
              color: 'var(--color-text-secondary)', borderRadius: '8px', transition: 'var(--transition-smooth)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Settings"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ⚙️
          </button>

          {/* MJ Initials Avatar Bubble */}
          <div 
            onClick={handleLogout}
            style={{ 
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'var(--color-text-primary)', color: 'var(--color-bg-canvas)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'var(--transition-smooth)',
              marginTop: '4px'
            }}
            title={`Logout (${user?.full_name || 'User'})`}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.background = '#ef4444'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = 'var(--color-text-primary)'
              e.currentTarget.style.color = 'var(--color-bg-canvas)'
            }}
          >
            {getInitials(user?.full_name)}
          </div>
        </div>
      </aside>
    )
  }

  // ── EXPANDED SIDEBAR (260px Wide) ──
  return (
    <aside className="sidebar claude-sans-control" style={{ 
      background: 'var(--color-bg-card)', 
      borderRight: '1px solid var(--color-border-subtle)', 
      transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      width: '260px',
      flexShrink: 0,
      padding: '20px 16px',
      gap: '12px',
      height: '100%',
      zIndex: 50
    }}>
      {/* Header logo & toggle */}
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: '8px' }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="logo-icon" style={{ fontSize: '1.3rem' }}>⚡</span>
          <span className="claude-serif-title" style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>AI Inference</span>
        </div>
        
        {/* Toggle Button to collapse */}
        <button 
          onClick={onToggle}
          className="claude-focus-ring"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-accent-amber-glow)'
            e.currentTarget.style.color = 'var(--color-accent-amber)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-text-secondary)'
          }}
          title="Collapse Sidebar"
        >
          <ToggleIcon />
        </button>
      </div>

      {/* Main navigation stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* + New chat button */}
        <button 
          id="new-chat-btn" 
          onClick={() => {
            newChat()
            onChangeTab('chat')
          }} 
          className="claude-focus-ring" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-primary)',
            padding: '10px 12px',
            cursor: 'pointer',
            width: '100%',
            fontSize: '0.95rem',
            fontWeight: 500,
            borderRadius: '8px',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '1.5px solid var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 0
          }}>
            +
          </div>
          <span>New chat</span>
        </button>

        {/* 🔍 Search trigger button */}
        <button 
          onClick={onOpenSearch}
          className="claude-focus-ring"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-primary)',
            padding: '10px 12px',
            cursor: 'pointer',
            width: '100%',
            fontSize: '0.95rem',
            fontWeight: 500,
            borderRadius: '8px',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Search</span>
        </button>

        {/* 💬 Chats trigger button */}
        <button 
          onClick={() => onChangeTab('chats-list')}
          className="claude-focus-ring"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            background: activeTab === 'chats-list' ? 'var(--color-accent-amber-glow)' : 'transparent',
            border: 'none',
            color: activeTab === 'chats-list' ? 'var(--color-accent-amber)' : 'var(--color-text-primary)',
            padding: '10px 12px',
            cursor: 'pointer',
            width: '100%',
            fontSize: '0.95rem',
            fontWeight: 500,
            borderRadius: '8px',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'chats-list') e.currentTarget.style.background = 'var(--bg-hover)'
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'chats-list') e.currentTarget.style.background = 'transparent'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'chats-list' ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Chats</span>
        </button>
      </div>

      {/* Recents Divider Label */}
      <div style={{
        fontSize: '0.8rem',
        fontWeight: 500,
        color: 'var(--color-text-secondary)',
        padding: '12px 12px 4px 12px',
        textTransform: 'none'
      }}>
        Recents
      </div>

      {/* Chat history list */}
      <div className="chat-history" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {sessions.length === 0 && (
          <p className="claude-sans-control" style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '16px 0', fontSize: '0.85rem' }}>
            No chats yet
          </p>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            className="sidebar-history-row claude-focus-ring"
            style={{
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: (session.id === currentSessionId && activeTab === 'chat') ? 'var(--bg-hover)' : 'transparent',
              transition: 'var(--transition-smooth)',
              position: 'relative'
            }}
            onClick={() => {
              selectSession(session.id)
              onChangeTab('chat')
            }}
            onMouseEnter={(e) => {
              if (session.id !== currentSessionId || activeTab !== 'chat') {
                e.currentTarget.style.background = 'var(--bg-hover)'
              }
            }}
            onMouseLeave={(e) => {
              if (session.id !== currentSessionId || activeTab !== 'chat') {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            <span className="claude-sans-control" style={{ 
              fontSize: '0.9rem', 
              color: (session.id === currentSessionId && activeTab === 'chat') ? 'var(--color-accent-amber)' : 'var(--color-text-primary)',
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              transition: 'color 0.2s ease',
              fontWeight: (session.id === currentSessionId && activeTab === 'chat') ? 500 : 400,
              flex: 1,
              marginRight: '8px'
            }}>
              {session.title}
            </span>
            
            <button
              onClick={(e) => { 
                e.stopPropagation()
                if (window.confirm('Delete this chat?')) {
                  deleteSession(session.id)
                }
              }}
              title="Delete chat"
              style={{
                background: 'none', 
                border: 'none', 
                color: 'var(--color-text-secondary)', 
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '4px',
                opacity: (session.id === currentSessionId && activeTab === 'chat') ? 0.7 : 0,
                transition: 'opacity 0.2s ease-in-out'
              }}
              className="sidebar-row-options-btn"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* User Footer block with details */}
      <div className="sidebar-footer" style={{ 
        marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-border-subtle)', 
        display: 'flex', alignItems: 'center', gap: '10px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div style={{ 
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'var(--color-text-primary)', color: 'var(--color-bg-canvas)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, flexShrink: 0, transition: 'var(--transition-smooth)'
          }}>
            {getInitials(user?.full_name)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span className="claude-sans-control" style={{ color: 'var(--color-text-primary)', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name || 'User'}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
              {user?.role || 'user'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme} 
            className="claude-focus-ring"
            style={{ 
              padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer', 
              color: 'var(--color-text-secondary)', borderRadius: '6px', transition: 'var(--transition-smooth)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          
          {/* Settings Button */}
          <button 
            onClick={() => navigate('/settings')} 
            className="claude-focus-ring"
            style={{ 
              padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer', 
              color: 'var(--color-text-secondary)', borderRadius: '6px', transition: 'var(--transition-smooth)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}
            title="Settings"
          >
            ⚙️
          </button>
          
          {/* Logout Button */}
          <button 
            id="logout-btn" 
            onClick={handleLogout} 
            className="claude-focus-ring"
            style={{ 
              padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer', 
              color: 'var(--color-text-secondary)', borderRadius: '6px', transition: 'var(--transition-smooth)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'
              e.currentTarget.style.color = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}
            title="Logout"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
