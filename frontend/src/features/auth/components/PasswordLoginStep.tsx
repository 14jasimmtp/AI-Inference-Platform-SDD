import React from 'react'
import { Input } from '../../../components/ui/Input'

interface PasswordLoginStepProps {
  password: string;
  setPassword: (val: string) => void;
  handleForgotPassword: () => void;
}

export const PasswordLoginStep: React.FC<PasswordLoginStepProps> = ({ password, setPassword, handleForgotPassword }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="claude-sans-control" style={{ color: 'var(--color-text-primary)', background: 'var(--color-bg-canvas)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', boxSizing: 'border-box' }}>
        Welcome! Please enter your password to sign in or create an account.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="claude-sans-control" style={{ color: 'var(--color-text-primary)' }}>Password</label>
          <button type="button" className="claude-sans-control" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0 }}>
            Forgot password?
          </button>
        </div>
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"
          className="warm-form-control"
        />
      </div>
    </div>
  )
}
