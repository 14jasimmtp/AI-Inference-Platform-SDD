import React from 'react'

export const PrimaryButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`claude-focus-ring ${props.className || ''}`}
    style={{
      background: 'var(--color-accent-amber)',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      fontWeight: 600,
      fontSize: '0.9rem',
      cursor: 'pointer',
      transition: 'var(--transition-smooth)',
      display: 'flex', alignItems: 'center', gap: '8px',
      ...props.style
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = '#B45309'
      e.currentTarget.style.transform = 'translateY(-1px)'
      if (props.onMouseEnter) props.onMouseEnter(e)
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'var(--color-accent-amber)'
      e.currentTarget.style.transform = 'translateY(0)'
      if (props.onMouseLeave) props.onMouseLeave(e)
    }}
  >
    {children}
  </button>
)
