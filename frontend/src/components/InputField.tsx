import React, { useState, useRef, useEffect } from 'react'

interface Props {
  onSend: (message: string) => void
  disabled: boolean
  placeholder?: string
  modelPicker?: React.ReactNode
  value?: string
  onChange?: (val: string) => void
}

export const InputField: React.FC<Props> = ({
  onSend,
  disabled,
  placeholder = 'Send a message...',
  modelPicker,
  value: controlledValue,
  onChange: controlledOnChange,
}) => {
  const [localValue, setLocalValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const value = controlledValue !== undefined ? controlledValue : localValue
  const setValue = controlledOnChange !== undefined ? controlledOnChange : setLocalValue

  useEffect(() => {
    if (!disabled && textareaRef.current) textareaRef.current.focus()
  }, [disabled])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = () => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
    }
  }

  return (
    <div 
      className="claude-focus-ring"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-card)',
        border: `1px solid ${isFocused ? 'var(--color-accent-amber)' : 'var(--color-border-subtle)'}`,
        boxShadow: isFocused ? '0 0 0 4px var(--color-accent-amber-glow)' : '0 2px 12px rgba(0,0,0,0.03)',
        borderRadius: '16px',
        padding: '16px 16px 12px 16px',
        transition: 'var(--transition-smooth)',
        width: '100%'
      }}
    >
      {/* Top Part: Textarea */}
      <textarea
        ref={textareaRef}
        id="chat-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="claude-sans-control"
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          outline: 'none',
          color: 'var(--color-text-primary)',
          fontSize: '1.05rem',
          lineHeight: '1.5',
          resize: 'none',
          maxHeight: '200px',
          overflowY: 'auto',
          padding: '0 0 10px 0',
          fontFamily: 'inherit'
        }}
      />

      {/* Bottom Part: Action Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: '100%',
        borderTop: '1px solid var(--color-border-subtle)',
        paddingTop: '10px',
        marginTop: '2px'
      }}>
        {/* Right Side: Model Picker, Send Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {modelPicker}

          {/* Send message button */}
          <button
            id="send-btn"
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className="claude-focus-ring"
            style={{
              width: '32px', height: '32px',
              background: (disabled || !value.trim()) ? 'var(--color-border-subtle)' : 'var(--color-text-primary)',
              color: 'var(--color-bg-canvas)',
              border: 'none',
              borderRadius: '50%',
              cursor: (disabled || !value.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'var(--transition-smooth)',
              opacity: (disabled || !value.trim()) ? 0.4 : 1
            }}
            onMouseEnter={(e) => {
              if (!disabled && value.trim()) {
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && value.trim()) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
            aria-label="Send message"
          >
            {disabled ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: '14px', height: '14px' }}>
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}>
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
