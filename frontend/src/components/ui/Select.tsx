import React from 'react'

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`claude-focus-ring ${props.className || ''}`}
    style={{
      background: 'var(--color-bg-canvas)',
      border: '1px solid var(--color-border-subtle)',
      borderRadius: '8px',
      padding: '10px 14px',
      color: 'var(--color-text-primary)',
      fontSize: '0.9rem',
      transition: 'var(--transition-smooth)',
      ...props.style
    }}
  />
)
