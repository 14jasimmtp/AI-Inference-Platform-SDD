import React from 'react'
import type { ChatSession } from '../../../store/chatStore'
import { getRelativeTime } from '../../../utils/time'

interface ChatsListViewProps {
  sessions: ChatSession[];
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
  selectedSessionIds: string[];
  handleSelectAll: () => void;
  handleDeleteSelected: () => void;
  listSearchQuery: string;
  setListSearchQuery: (val: string) => void;
  handleRowClick: (session: ChatSession) => void;
  handleSelectRow: (id: string) => void;
  onNewChat: () => void;
}

export const ChatsListView: React.FC<ChatsListViewProps> = ({
  sessions,
  isEditMode,
  setIsEditMode,
  selectedSessionIds,
  handleSelectAll,
  handleDeleteSelected,
  listSearchQuery,
  setListSearchQuery,
  handleRowClick,
  handleSelectRow,
  onNewChat
}) => {
  return (
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
        {/* Header section */}
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
                onClick={onNewChat}
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
                {selectedSessionIds.length === sessions.length ? 'Deselect all' : 'Select all'}
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

        {/* Real-time search box */}
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
              x
            </button>
          )}
        </div>

        {/* Chat Session rows list */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: '8px' }}>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
              No sessions found.
            </div>
          ) : (
            sessions.map((sess) => {
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
  )
}
