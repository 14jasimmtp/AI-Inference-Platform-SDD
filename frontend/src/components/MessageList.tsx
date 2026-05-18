import React, { useEffect, useRef } from 'react'
import type { ChatMessage } from '../types'

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

  let inList = false
  let listItems: React.ReactNode[] = []
  let listType: 'ul' | 'ol' = 'ul'

  const flushList = (key: string | number) => {
    if (listItems.length > 0) {
      if (listType === 'ul') {
        elements.push(<ul key={`ul-${key}`} className="markdown-ul">{listItems}</ul>)
      } else {
        elements.push(<ol key={`ol-${key}`} className="markdown-ol">{listItems}</ol>)
      }
      listItems = []
    }
    inList = false
  }

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

    // 1. Headers: #, ##, ###
    if (line.startsWith('# ')) {
      flushList(lineIdx)
      elements.push(<h1 key={lineIdx} className="markdown-h1">{parseInline(line.substring(2))}</h1>)
      lineIdx++
      continue
    }
    if (line.startsWith('## ')) {
      flushList(lineIdx)
      elements.push(<h2 key={lineIdx} className="markdown-h2">{parseInline(line.substring(3))}</h2>)
      lineIdx++
      continue
    }
    if (line.startsWith('### ')) {
      flushList(lineIdx)
      elements.push(<h3 key={lineIdx} className="markdown-h3">{parseInline(line.substring(4))}</h3>)
      lineIdx++
      continue
    }

    // 2. Unordered lists: starting with "- ", "* ", "• "
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      if (!inList || listType !== 'ul') {
        flushList(lineIdx)
        inList = true
        listType = 'ul'
      }
      let content = line.substring(2)
      // Check for single asterisk typo (common in Llama/Ollama lists)
      const firstAsteriskIdx = content.indexOf('*')
      if (firstAsteriskIdx !== -1) {
        const lastAsteriskIdx = content.lastIndexOf('*')
        if (firstAsteriskIdx === lastAsteriskIdx) {
          const charBefore = firstAsteriskIdx > 0 ? content[firstAsteriskIdx - 1] : ''
          const charAfter = firstAsteriskIdx < content.length - 1 ? content[firstAsteriskIdx + 1] : ''
          const isMath = charBefore === ' ' && charAfter === ' ' && !isNaN(Number(content[firstAsteriskIdx - 2]))
          if (!isMath && (charBefore === ':' || charAfter === ' ' || charAfter === '')) {
            content = '*' + content
          }
        }
      }
      listItems.push(<li key={`li-${lineIdx}`} className="markdown-li">{parseInline(content)}</li>)
      lineIdx++
      continue
    }

    // 3. Ordered lists: starting with digits followed by dot "1. ", "2. ", etc.
    const orderedMatch = line.match(/^(\d+)\.\s(.*)/)
    if (orderedMatch) {
      if (!inList || listType !== 'ol') {
        flushList(lineIdx)
        inList = true
        listType = 'ol'
      }
      let content = orderedMatch[2]
      // Check for single asterisk typo in ordered lists
      const firstAsteriskIdx = content.indexOf('*')
      if (firstAsteriskIdx !== -1) {
        const lastAsteriskIdx = content.lastIndexOf('*')
        if (firstAsteriskIdx === lastAsteriskIdx) {
          const charBefore = firstAsteriskIdx > 0 ? content[firstAsteriskIdx - 1] : ''
          const charAfter = firstAsteriskIdx < content.length - 1 ? content[firstAsteriskIdx + 1] : ''
          const isMath = charBefore === ' ' && charAfter === ' ' && !isNaN(Number(content[firstAsteriskIdx - 2]))
          if (!isMath && (charBefore === ':' || charAfter === ' ' || charAfter === '')) {
            content = '*' + content
          }
        }
      }
      listItems.push(<li key={`li-${lineIdx}`} className="markdown-li">{parseInline(content)}</li>)
      lineIdx++
      continue
    }

    // 4. Code Blocks: ```code```
    if (line.trim().startsWith('```')) {
      flushList(lineIdx)
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

    // 5. Standard paragraph/blank lines
    if (line.trim() === '') {
      flushList(lineIdx)
      elements.push(<div key={lineIdx} className="markdown-spacer" />)
    } else {
      flushList(lineIdx)
      elements.push(<p key={lineIdx} className="markdown-p">{parseInline(line)}</p>)
    }
    lineIdx++
  }

  flushList('end')
  return elements
}

const RoleAvatar: React.FC<{ role: string }> = ({ role }) => (
  <div className={`avatar ${role}`}>
    {role === 'user' ? '👤' : '🤖'}
  </div>
)

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="bubble-action-btn"
      title="Copy to clipboard"
    >
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  )
}

const MessageBubble: React.FC<{
  msg: ChatMessage;
  isLastUser: boolean;
  onRetry?: () => void;
}> = ({ msg, isLastUser, onRetry }) => (
  <div className={`message-row ${msg.role}`}>
    <RoleAvatar role={msg.role} />
    <div className={`bubble ${msg.role} ${msg.role === 'user' && isLastUser ? 'has-retry' : ''}`}>
      <div className="bubble-content markdown-body">{parseMarkdown(msg.content)}</div>
      
      {msg.role === 'assistant' && (
        <div className="bubble-actions">
          <CopyButton text={msg.content} />
        </div>
      )}

      {msg.role === 'user' && isLastUser && onRetry && (
        <div className="bubble-actions">
          <button
            onClick={onRetry}
            className="bubble-action-btn"
            title="Regenerate response"
          >
            🔄 Retry
          </button>
        </div>
      )}
    </div>
  </div>
)

export const MessageList: React.FC<Props> = ({ messages, streamingContent, isStreaming, onRetry }) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const lastUserIndex = messages.map((m) => m.role).lastIndexOf('user')

  return (
    <div className="message-list">
      {messages.length === 0 && !isStreaming && (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <h3>Start a conversation</h3>
          <p>Ask anything — your AI assistant is ready.</p>
        </div>
      )}
      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          msg={msg}
          isLastUser={msg.role === 'user' && i === lastUserIndex}
          onRetry={onRetry}
        />
      ))}
      {isStreaming && streamingContent && (
        <div className="message-row assistant">
          <RoleAvatar role="assistant" />
          <div className="bubble assistant streaming">
            <div className="bubble-content markdown-body">
              {parseMarkdown(streamingContent)}
              <span className="cursor-blink">▋</span>
            </div>
          </div>
        </div>
      )}
      {isStreaming && !streamingContent && (
        <div className="message-row assistant">
          <RoleAvatar role="assistant" />
          <div className="bubble assistant">
            <div className="typing-indicator">
              <span /><span /><span />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
