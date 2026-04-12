'use client'

import { ThemeToggle } from '@/components/layout/ThemeToggle'
import Link from 'next/link'

interface TopbarProps {
  title: string
  accentColor: string
  children?: React.ReactNode
}

export function Topbar({ title, accentColor, children }: TopbarProps) {
  return (
    <header className="topbar">
      <div style={{ width: '28px' }} />

      <h1
        style={{
          fontSize: '16px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          flex: 1,
        }}
      >
        {title}
      </h1>

      {children && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {children}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link 
          href="/" 
          style={{ 
            textDecoration: 'none', 
            fontSize: '13px', 
            fontWeight: 600, 
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            transition: 'all 0.2s',
            border: '1px solid var(--border-color)',
            background: 'var(--surface-secondary)'
          }}
          onMouseOver={e => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--text-tertiary)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.color = 'var(--text-tertiary)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Back to Site
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
