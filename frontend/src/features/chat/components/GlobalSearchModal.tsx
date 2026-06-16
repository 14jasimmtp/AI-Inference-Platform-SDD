import React, { useEffect, useRef } from 'react'
import type { ChatSession } from '../../../store/chatStore'
import { getRelativeTime } from '../../../utils/time'

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isDeeperSearchEnabled: boolean;
  setIsDeeperSearchEnabled: (val: boolean) => void;
  searchResults: ChatSession[];
  onSelectSession: (id: string, matchedIdx?: number) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen, onClose, searchQuery, setSearchQuery, isDeeperSearchEnabled, setIsDeeperSearchEnabled, searchResults, onSelectSession
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null;

  return (
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
    }} onClick={onClose}>
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
              else onClose()
            }}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
          >
            x
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
              {searchResults.length === 0 ? (
                <div style={{ padding: '16px 20px', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  No matching chats found
                </div>
              ) : (
                searchResults.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => {
                      const matchedIdx = sess.messages.findIndex((m) =>
                        m.content.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      onSelectSession(sess.id, matchedIdx !== -1 ? matchedIdx : undefined)
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
                Search inside message contents
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
