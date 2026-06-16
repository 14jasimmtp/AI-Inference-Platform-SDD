import React from 'react'

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="claude-serif-title" style={{ fontSize: '1.75rem', color: 'var(--color-text-primary)', marginBottom: '24px' }}>
    {children}
  </h2>
)
