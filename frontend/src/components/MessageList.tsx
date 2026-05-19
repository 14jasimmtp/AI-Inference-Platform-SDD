import React, { useEffect, useRef, useState } from 'react'
import { Copy, Check, Pencil, RotateCw } from 'lucide-react'
import type { ChatMessage } from '../types'
import { useChatStore } from '../store/chatStore'

interface Props {
  messages: ChatMessage[]
  streamingContent: string
  isStreaming: boolean
  onRetry?: () => void
}

// Highly robust, lightweight Markdown parsing function with zero external dependencies
const parseMarkdown = (text: string): React.ReactNode[] => {
  if (!text) return []

  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  // Parse inline styles (bold, italic, code) inside a line
  const parseInline = (lineText: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let currentText = ''
    let idx = 0

    while (idx < lineText.length) {
      // 1. Inline code: `code`
      if (lineText[idx] === '`') {
        if (currentText) {
          parts.push(currentText)
          currentText = ''
        }
        const nextBacktick = lineText.indexOf('`', idx + 1)
        if (nextBacktick !== -1) {
          const codeContent = lineText.substring(idx + 1, nextBacktick)
          parts.push(<code key={`code-${idx}`} className="markdown-code-inline">{codeContent}</code>)
          idx = nextBacktick + 1
          continue
        }
      }

      // 2. Bold (double asterisks): **text**
      if (lineText.startsWith('**', idx)) {
        if (currentText) {
          parts.push(currentText)
          currentText = ''
        }
        const nextAsterisk = lineText.indexOf('**', idx + 2)
        if (nextAsterisk !== -1) {
          const boldContent = lineText.substring(idx + 2, nextAsterisk)
          parts.push(<strong key={`bold-${idx}`} className="markdown-bold">{parseInline(boldContent)}</strong>)
          idx = nextAsterisk + 2
          continue
        }
      }

      // 3. Bold/Italic (single asterisk/underscore): *text* or _text_
      if (lineText[idx] === '*' || lineText[idx] === '_') {
        const char = lineText[idx]
        if (currentText) {
          parts.push(currentText)
          currentText = ''
        }
        const nextChar = lineText.indexOf(char, idx + 1)
        if (nextChar !== -1) {
          const italicContent = lineText.substring(idx + 1, nextChar)
          parts.push(<strong key={`bold-single-${idx}`} className="markdown-bold">{parseInline(italicContent)}</strong>)
          idx = nextChar + 1
          continue
        }
      }

      currentText += lineText[idx]
      idx++
    }

    if (currentText) {
      parts.push(currentText)
    }

    return parts.length === 1 ? parts[0] : <React.Fragment key={idx}>{parts}</React.Fragment>
  }

  let lineIdx = 0
  while (lineIdx < lines.length) {
    const line = lines[lineIdx]
    const trimmed = line.trim()

    // 1. Headers: #, ##, ###
    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={lineIdx} className="markdown-h1">{parseInline(trimmed.substring(2))}</h1>)
      lineIdx++
      continue
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={lineIdx} className="markdown-h2">{parseInline(trimmed.substring(3))}</h2>)
      lineIdx++
      continue
    }
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={lineIdx} className="markdown-h3">{parseInline(trimmed.substring(4))}</h3>)
      lineIdx++
      continue
    }

    // 2. Code Blocks: ```code```
    if (trimmed.startsWith('```')) {
      const codeLines = []
      let blockLineIdx = lineIdx + 1
      while (blockLineIdx < lines.length && !lines[blockLineIdx].trim().startsWith('```')) {
        codeLines.push(lines[blockLineIdx])
        blockLineIdx++
      }
      const codeContent = codeLines.join('\n')
      elements.push(
        <div key={lineIdx} className="markdown-code-block-container">
          <pre className="markdown-code-block">
            <code>{codeContent}</code>
          </pre>
        </div>
      )
      lineIdx = blockLineIdx + 1
      continue
    }

    // 3. Unordered list item: e.g. "  * item" or "    - item"
    const unorderedMatch = line.match(/^(\s*)([-*•])\s+(.*)/)
    if (unorderedMatch) {
      const spaces = unorderedMatch[1] || ''
      const content = unorderedMatch[3] || ''
      const indentLevel = Math.max(0, Math.floor(spaces.length / 2))
      
      elements.push(
        <div 
          key={lineIdx} 
          className="markdown-li" 
          style={{ 
            paddingLeft: `${indentLevel * 1.5 + 1.25}rem`,
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            margin: '6px 0'
          }}
        >
          <span style={{ 
            color: 'var(--color-text-secondary)', 
            userSelect: 'none', 
            fontSize: '1.2rem',
            lineHeight: '1.4rem',
            marginTop: '-2px'
          }}>•</span>
          <div style={{ flex: 1, fontSize: '0.95rem', lineHeight: '1.6', color: 'inherit' }}>
            {parseInline(content)}
          </div>
        </div>
      )
      lineIdx++
      continue
    }

    // 4. Ordered list item: e.g. "  1. item"
    const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/)
    if (orderedMatch) {
      const spaces = orderedMatch[1] || ''
      const num = orderedMatch[2]
      const content = orderedMatch[3] || ''
      const indentLevel = Math.max(0, Math.floor(spaces.length / 2))

      elements.push(
        <div 
          key={lineIdx} 
          className="markdown-li" 
          style={{ 
            paddingLeft: `${indentLevel * 1.5 + 1.25}rem`,
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            margin: '6px 0'
          }}
        >
          <span style={{ 
            color: 'var(--color-text-secondary)', 
            userSelect: 'none', 
            minWidth: '1.2rem', 
            textAlign: 'right',
            fontSize: '0.95rem',
            lineHeight: '1.6'
          }}>{num}.</span>
          <div style={{ flex: 1, fontSize: '0.95rem', lineHeight: '1.6', color: 'inherit' }}>
            {parseInline(content)}
          </div>
        </div>
      )
      lineIdx++
      continue
    }

    // 5. Paragraph / Empty line
    if (trimmed === '') {
      elements.push(<div key={lineIdx} className="markdown-spacer" />)
    } else {
      const spacesMatch = line.match(/^(\s+)(.*)/)
      const spaces = spacesMatch ? spacesMatch[1] : ''
      const content = spacesMatch ? spacesMatch[2] : line
      const indentLevel = Math.max(0, Math.floor(spaces.length / 2))

      elements.push(
        <p 
          key={lineIdx} 
          className="markdown-p"
          style={{ 
            paddingLeft: indentLevel > 0 ? `${indentLevel * 1.5 + 1.25 + 0.75}rem` : '0',
            margin: '6px 0',
            fontSize: '0.95rem',
            lineHeight: '1.6'
          }}
        >
          {parseInline(content)}
        </p>
      )
    }
    lineIdx++
  }

  return elements
}

const MessageBubble: React.FC<{
  msg: ChatMessage
  index: number
  messages: ChatMessage[]
  isLastUser: boolean
  onRetry?: () => void
  isHighlighted?: boolean
}> = ({ msg, index, messages, isLastUser, onRetry, isHighlighted = false }) => {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(msg.content)
  
  const editMessage = useChatStore((s) => s.editMessage)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleSaveEdit = async () => {
    const trimmed = editText.trim()
    if (!trimmed) return
    setIsEditing(false)
    await editMessage(index, trimmed)
  }

  const handleRetryUser = async () => {
    await editMessage(index, msg.content)
  }

  const handleAssistantRetry = async () => {
    if (index > 0) {
      const precedingUserMsg = messages[index - 1]
      if (precedingUserMsg && precedingUserMsg.role === 'user') {
        await editMessage(index - 1, precedingUserMsg.content)
      }
    } else if (onRetry) {
      onRetry()
    }
  }

  const formatTime = (ts?: number) => {
    const date = ts ? new Date(ts) : new Date()
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (msg.role === 'user') {
    return (
      <div 
        id={`msg-bubble-${index}`}
        className={`message-row-wrapper ${isHighlighted ? 'highlight-pulse' : ''}`}
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          width: '100%',
          position: 'relative',
          padding: '4px 0',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Hover action menu for User Messages — displayed directly to the left of the user pill */}
        {!isEditing && (
          <div className="user-bubble-actions">
            <span className="user-bubble-time">{formatTime(msg.timestamp)}</span>
            
            <div className="tooltip-wrapper">
              <button onClick={handleRetryUser} className="user-action-btn" aria-label="Retry">
                <RotateCw size={13} />
              </button>
              <span className="tooltip-text">Retry</span>
            </div>

            <div className="tooltip-wrapper">
              <button onClick={() => setIsEditing(true)} className="user-action-btn" aria-label="Edit">
                <Pencil size={13} />
              </button>
              <span className="tooltip-text">Edit</span>
            </div>

            <div className="tooltip-wrapper">
              <button onClick={handleCopy} className="user-action-btn" aria-label="Copy">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
              <span className="tooltip-text">{copied ? 'Copied' : 'Copy'}</span>
            </div>
          </div>
        )}

        {/* User Content Bubble */}
        <div style={{
          padding: '10px 16px',
          borderRadius: '20px',
          background: 'var(--color-bubble-user)',
          color: 'var(--color-bubble-user-text)',
          maxWidth: '70%',
          position: 'relative',
          animation: 'fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="inline-editor-textarea"
                rows={Math.max(editText.split('\n').length, 2)}
                style={{ minWidth: '280px' }}
                autoFocus
              />
              <div className="inline-editor-actions">
                <button 
                  onClick={handleSaveEdit} 
                  disabled={!editText.trim()} 
                  className="inline-editor-btn submit"
                >
                  Save & Submit
                </button>
                <button 
                  onClick={() => {
                    setIsEditing(false)
                    setEditText(msg.content)
                  }} 
                  className="inline-editor-btn cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="claude-sans-control markdown-body" style={{ color: 'inherit', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {parseMarkdown(msg.content)}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Assistant & System Messages
  return (
    <div 
      id={`msg-bubble-${index}`}
      className={`message-row-wrapper ${isHighlighted ? 'highlight-pulse' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        width: '100%',
        padding: '8px 0 16px 0',
        position: 'relative',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{
        color: 'var(--color-text-primary)',
        width: '100%',
        position: 'relative',
        animation: 'fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div 
          className="claude-serif-title markdown-body" 
          style={{ 
            fontSize: '1.05rem',
            lineHeight: '1.7',
            color: 'inherit'
          }}
        >
          {parseMarkdown(msg.content)}
        </div>

        {/* Assistant action controls underneath the text bubble — closely aligned */}
        <div className="assistant-bubble-actions" style={{ marginTop: '4px' }}>
          <div className="tooltip-wrapper">
            <button onClick={handleCopy} className="assistant-action-btn" aria-label="Copy response">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span style={{ fontSize: '11px' }}>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <span className="tooltip-text">Copy response</span>
          </div>

          <div className="tooltip-wrapper">
            <button onClick={handleAssistantRetry} className="assistant-action-btn" aria-label="Retry response">
              <RotateCw size={13} />
              <span style={{ fontSize: '11px' }}>Retry</span>
            </button>
            <span className="tooltip-text">Retry response</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export const MessageList: React.FC<Props> = ({ messages, streamingContent, isStreaming, onRetry }) => {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)

  useEffect(() => {
    // Check if we have a scroll target from a search result select
    const targetIdxStr = sessionStorage.getItem('targetMessageIndex')
    if (targetIdxStr !== null) {
      const idx = parseInt(targetIdxStr, 10)
      if (!isNaN(idx)) {
        setHighlightedIndex(idx)
        sessionStorage.removeItem('targetMessageIndex')

        // Scroll to the element after a short layout pass
        setTimeout(() => {
          const el = document.getElementById(`msg-bubble-${idx}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 180)

        // Clear highlight class after animation finishes
        setTimeout(() => {
          setHighlightedIndex(null)
        }, 3600)
        return
      }
    }

    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const lastUserIndex = messages.map((m) => m.role).lastIndexOf('user')

  return (
    <div className="message-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 0' }}>
      {messages.length === 0 && !isStreaming && (
        <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
          <div className="empty-icon" style={{ fontSize: '2.5rem', marginBottom: '16px' }}>✨</div>
          <h3 className="claude-serif-title" style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Start a conversation</h3>
          <p className="claude-sans-control" style={{ fontSize: '0.9rem' }}>Ask anything — your AI assistant is ready.</p>
        </div>
      )}
      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          index={i}
          msg={msg}
          messages={messages}
          isLastUser={msg.role === 'user' && i === lastUserIndex}
          onRetry={onRetry}
          isHighlighted={i === highlightedIndex}
        />
      ))}
      {isStreaming && streamingContent && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          width: '100%',
          padding: '8px 0 16px 0',
          position: 'relative'
        }}>
          <div style={{
            color: 'var(--color-text-primary)',
            width: '100%',
            position: 'relative'
          }}>
            <div 
              className="claude-serif-title markdown-body" 
              style={{ 
                fontSize: '1.05rem',
                lineHeight: '1.7',
                color: 'inherit'
              }}
            >
              {parseMarkdown(streamingContent)}
              <span className="cursor-blink" style={{ color: 'var(--color-accent-amber)', marginLeft: '2px', fontWeight: 'bold' }}>▋</span>
            </div>
          </div>
        </div>
      )}
      {isStreaming && !streamingContent && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          width: '100%',
          padding: '8px 0 16px 0',
          position: 'relative'
        }}>
          {/* Custom smooth breathing/typing bouncing dot loader */}
          <div className="typing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
