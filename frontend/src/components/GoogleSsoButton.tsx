import React from 'react'

interface GoogleSsoButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const GoogleSsoButton: React.FC<GoogleSsoButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        background: '#ffffff',
        border: '1px solid #dadce0',
        color: '#3c4043',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        transition: 'background-color 0.2s, box-shadow 0.2s',
        outline: 'none',
        boxSizing: 'border-box'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#f8f9fa'
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.12)'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#ffffff'
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)'
        }
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.75-.63-1.34-1.44-1.85-2.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <span>Continue with Google</span>
    </button>
  )
}
