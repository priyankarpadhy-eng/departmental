'use client'

import { ThemeToggle } from '@/components/layout/ThemeToggle'

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

      <ThemeToggle />
    </header>
  )
}
