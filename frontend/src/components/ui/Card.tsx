import React from 'react'

export const Card = ({ children, style = {} }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <div style={{
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
    transition: 'var(--transition-smooth)',
    ...style
  }}>
    {children}
  </div>
)
