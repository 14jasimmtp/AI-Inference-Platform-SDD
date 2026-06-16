import React from 'react'
import { Input } from '../../../components/ui/Input'

interface PasswordSignupStepProps {
  fullName: string;
  setFullName: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
}

export const PasswordSignupStep: React.FC<PasswordSignupStepProps> = ({ fullName, setFullName, password, setPassword }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="claude-sans-control" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.08)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.15)', boxSizing: 'border-box' }}>
        Email not registered. Proceed to set up a new account.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label className="claude-sans-control" style={{ color: 'var(--color-text-primary)' }}>Full Name</label>
        <Input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Muhamed Jasim"
          className="warm-form-control"
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label className="claude-sans-control" style={{ color: 'var(--color-text-primary)' }}>Choose Password</label>
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 8 characters"
          className="warm-form-control"
        />
      </div>
    </div>
  )
}
