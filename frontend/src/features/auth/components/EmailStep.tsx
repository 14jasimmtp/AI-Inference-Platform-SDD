import React from 'react'
import { Input } from '../../../components/ui/Input'

interface EmailStepProps {
  email: string;
  setEmail: (val: string) => void;
}

export const EmailStep: React.FC<EmailStepProps> = ({ email, setEmail }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label className="claude-sans-control" style={{ color: 'var(--color-text-primary)' }}>Email address</label>
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="warm-form-control"
      />
    </div>
  )
}
