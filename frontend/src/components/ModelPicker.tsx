import React, { useState, useRef, useEffect } from 'react'

interface Props {
  model: string
  availableModels: string[]
  onSelect: (model: string) => void
  disabled?: boolean
}

export const ModelPicker: React.FC<Props> = ({ model, availableModels, onSelect, disabled }) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Shorten model name for display
  const displayName = model.length > 28 ? model.slice(0, 26) + '…' : model

  const models = availableModels.length > 0 ? availableModels : [model]

  return (
    <div className="model-picker" ref={containerRef}>
      {/* Trigger pill */}
      <button
        id="model-picker-btn"
        className={`model-pill ${open ? 'open' : ''}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        title={model}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="model-pill-icon">◉</span>
        <span className="model-pill-label">{displayName}</span>
        <svg
          className={`model-pill-chevron ${open ? 'up' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          width="13" height="13"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div className="model-popover" role="listbox">
          <p className="model-popover-label">Available Models</p>
          {models.map((m) => (
            <button
              key={m}
              role="option"
              aria-selected={m === model}
              className={`model-option ${m === model ? 'selected' : ''}`}
              onClick={() => {
                onSelect(m)
                setOpen(false)
              }}
            >
              <span className="model-option-name">{m}</span>
              {m === model && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
          {models.length === 0 && (
            <p className="model-option-empty">No models available.<br/>Start Ollama and pull a model.</p>
          )}
        </div>
      )}
    </div>
  )
}
