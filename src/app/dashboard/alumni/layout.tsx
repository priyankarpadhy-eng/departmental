'use client'

import React from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/context/AuthContext'

const alumniNavItems = [
  {
    href: '/dashboard/alumni',
    label: 'Overview',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>,
  },
  {
    href: '/dashboard/alumni/profile',
    label: 'My profile',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/></svg>,
  },
  {
    href: '/dashboard/alumni/directory',
    label: 'Alumni directory',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/alumni/mentorship',
    label: 'Mentorship',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  },
  {
    href: '/dashboard/alumni/jobs',
    label: 'Job postings',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/alumni/records',
    label: 'Academic records',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
]

export default function AlumniLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()

  if (!profile || profile.role !== 'alumni') {
    return null
  }

  const initials = String(profile.full_name || profile.email || 'A')
    .split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="main-layout" style={{ '--role-accent': '#854F0B' } as React.CSSProperties}>
      <Sidebar role="alumni" fullName={profile.full_name || ''} email={profile.email || ''} initials={initials} navItems={alumniNavItems} />
      <main className="main-content">{children}</main>
    </div>
  )
}
