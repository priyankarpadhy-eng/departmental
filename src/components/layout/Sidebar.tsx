'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase/config'
import { signOut } from 'firebase/auth'
import type { UserRole } from '@/types'
import toast from 'react-hot-toast'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface SidebarProps {
  role: UserRole
  fullName: string
  email: string
  initials: string
  navItems: NavItem[]
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: '#E24B4A',
  hod: '#534AB7',
  faculty: '#185FA5',
  student: '#0F6E56',
  alumni: '#854F0B',
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  hod: 'Head of Department',
  faculty: 'Faculty member',
  student: 'Student',
  alumni: 'Alumni',
}

export function Sidebar({ role, fullName, email, initials, navItems }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const accentColor = ROLE_COLORS[role]

  async function handleSignOut() {
    try {
      await signOut(auth)
      toast.success('Signed out successfully')
      router.push('/login')
    } catch (error: any) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}
        style={{ '--role-accent': accentColor } as React.CSSProperties}
      >
        {/* Role accent strip */}
        <div className="sidebar-accent" style={{ background: accentColor }} />

        {/* Logo */}
        <div
          style={{
            padding: '16px 16px 12px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                background: '#1A1A18',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3L2 9l10 6 10-6-10-6zM2 17l10 6 10-6M2 13l10 6 10-6"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Dept Portal
              </div>
              <div style={{ fontSize: '11px', color: accentColor, fontWeight: 500 }}>
                {ROLE_LABELS[role]}
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{ '--role-accent': accentColor } as React.CSSProperties}
              >
                <span style={{ color: isActive ? accentColor : 'var(--text-tertiary)', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            className="avatar avatar-md"
            style={{
              background: `color-mix(in srgb, ${accentColor} 12%, var(--surface-secondary))`,
              color: accentColor,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fullName || 'User'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="btn btn-ghost"
            style={{ padding: '6px', flexShrink: 0 }}
            title="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'fixed',
          top: '16px',
          left: collapsed ? '16px' : '228px',
          zIndex: 50,
          background: 'var(--surface-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'left 150ms ease',
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          style={{ transform: collapsed ? 'none' : 'rotate(180deg)', transition: 'transform 150ms ease' }}
        >
          <path d="M15 18l-6-6 6-6" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </>
  )
}
