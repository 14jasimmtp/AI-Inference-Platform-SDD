import React from 'react'
import { InputField } from './InputField'
import { ModelPicker } from './ModelPicker'

interface ChatWelcomeScreenProps {
  greetingLabel: string;
  greetingTime: string;
  displayName: string;
  sendMessage: (msg: string) => void;
  stopInference: () => void;
  isStreaming: boolean;
  inputValue: string;
  setInputValue: (val: string) => void;
  model: string;
  availableModels: any[];
  setModel: (model: string) => void;
}

export const ChatWelcomeScreen: React.FC<ChatWelcomeScreenProps> = ({
  greetingLabel,
  greetingTime,
  displayName,
  sendMessage,
  stopInference,
  isStreaming,
  inputValue,
  setInputValue,
  model,
  availableModels,
  setModel
}) => {
  return (
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
          <span style={{ color: 'var(--color-accent-amber)' }}>{greetingLabel}</span>
          {greetingTime}, {displayName}
        </h2>

        {/* Centered Input Box Container */}
        <div style={{ width: '100%' }}>
          <InputField
            onSend={sendMessage}
            onStop={stopInference}
            disabled={isStreaming}
            isStreaming={isStreaming}
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
            { label: 'Write', icon: 'W', prompt: 'Write a comprehensive guide on...' },
            { label: 'Learn', icon: 'L', prompt: 'Explain the concept of...' },
            { label: 'Code', icon: 'C', prompt: 'Help me write code to...' },
            { label: 'Life stuff', icon: 'Life', prompt: 'Plan a relaxing weekend itinerary for...' }
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
  )
}
