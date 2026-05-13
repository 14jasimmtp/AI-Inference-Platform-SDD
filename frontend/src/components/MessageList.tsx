import React, { useEffect, useRef } from 'react'
import type { ChatMessage } from '../types'

interface Props {
  messages: ChatMessage[]
  streamingContent: string
  isStreaming: boolean
}

const RoleAvatar: React.FC<{ role: string }> = ({ role }) => (
  <div className={`avatar ${role}`}>
    {role === 'user' ? '👤' : '🤖'}
  </div>
)

const MessageBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => (
  <div className={`message-row ${msg.role}`}>
    <RoleAvatar role={msg.role} />
    <div className={`bubble ${msg.role}`}>
      <pre className="bubble-content">{msg.content}</pre>
    </div>
  </div>
)

export const MessageList: React.FC<Props> = ({ messages, streamingContent, isStreaming }) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

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
        <MessageBubble key={i} msg={msg} />
      ))}
      {isStreaming && streamingContent && (
        <div className="message-row assistant">
          <RoleAvatar role="assistant" />
          <div className="bubble assistant streaming">
            <pre className="bubble-content">{streamingContent}</pre>
            <span className="cursor-blink">▋</span>
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
