'use client'

import { useState } from 'react'
import type { AuditLog, AdminPresence, AdminSession, Profile } from '@/types'

const MODULES = ['all', 'users', 'attendance', 'results', 'courses', 'auth', 'content']

const ACTION_BADGE: Record<string, string> = {
  created: 'badge-success',
  updated: 'badge-info',
  deleted: 'badge-error',
  login: 'badge-neutral',
  logout: 'badge-neutral',
  exported: 'badge-warning',
  viewed: 'badge-neutral',
}

interface Props {
  onlineAdmins: any[]
  auditLogs: any[]
  loginSessions: any[]
  allAdmins: Partial<Profile>[]
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function duration(start: string, end: string | null) {
  if (!end) return 'Ongoing'
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export function AuditDashboardClient({ onlineAdmins, auditLogs, loginSessions, allAdmins }: Props) {
  const [activeTab, setActiveTab] = useState<'presence' | 'audit' | 'sessions'>('presence')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const onlineIds = new Set(onlineAdmins.map((a: any) => a.admin_id))
  const presenceMap = new Map(onlineAdmins.map((a: any) => [a.admin_id, a]))

  const filteredLogs = auditLogs.filter(log => {
    const matchModule = moduleFilter === 'all' || log.module === moduleFilter
    const matchSearch = !searchQuery ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchModule && matchSearch
  })

  return (
    <div>
      <div className="page-title" style={{ marginBottom: '4px' }}>Audit & activity</div>
      <p className="secondary-text" style={{ marginBottom: '24px' }}>
        Track admin actions, monitor presence, and review login sessions
      </p>

      {/* Tabs */}
      <div className="tab-list" style={{ '--role-accent': '#E24B4A' } as React.CSSProperties}>
        {[
          { key: 'presence', label: `Admin presence (${onlineAdmins.length} online)` },
          { key: 'audit', label: `Audit log (${auditLogs.length})` },
          { key: 'sessions', label: `Login sessions (${loginSessions.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PRESENCE TAB ── */}
      {activeTab === 'presence' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          {allAdmins.map((admin) => {
            const isOnline = onlineIds.has(admin.id)
            const presence = presenceMap.get(admin.id)
            return (
              <div
                key={admin.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                }}
              >
                <div
                  className="avatar avatar-lg"
                  style={{
                    background: isOnline ? 'var(--accent-admin-bg)' : 'var(--surface-secondary)',
                    color: isOnline ? '#E24B4A' : 'var(--text-tertiary)',
                    position: 'relative',
                  }}
                >
                  {(admin.full_name || 'A').charAt(0).toUpperCase()}
                  <span
                    className={`online-dot ${isOnline ? 'online' : 'offline'}`}
                    style={{
                      position: 'absolute',
                      bottom: '1px',
                      right: '1px',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{admin.full_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isOnline ? presence?.current_page : `Last seen ${timeAgo(admin.last_login ?? null)}`}
                  </div>
                </div>
              </div>
            )
          })}
          {allAdmins.length === 0 && (
            <div className="empty-state"><p className="secondary-text">No admin accounts found</p></div>
          )}
        </div>
      )}

      {/* ── AUDIT LOG TAB ── */}
      {activeTab === 'audit' && (
        <div>
          {/* Module filter + search */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div className="search-input" style={{ flex: 1, minWidth: '200px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="var(--text-tertiary)" strokeWidth="1.5"/>
                <path d="M21 21l-4.35-4.35" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                placeholder="Search actions or admins…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {MODULES.map(m => (
                <button
                  key={m}
                  className={`btn btn-sm ${moduleFilter === m ? 'btn-filled' : 'btn-ghost'}`}
                  onClick={() => setModuleFilter(m)}
                  style={moduleFilter === m ? { background: '#E24B4A', borderColor: '#E24B4A', color: 'white' } : {}}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Description</th>
                  <th>IP</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar avatar-sm" style={{ background: 'var(--surface-secondary)' }}>
                          {(log.admin?.full_name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '12px' }}>{log.admin?.full_name || log.full_name || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${ACTION_BADGE[log.action] || 'badge-neutral'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                        {log.module}
                      </span>
                    </td>
                    <td style={{ maxWidth: '320px' }}>
                      <span style={{ fontSize: '12px' }}>{log.description}</span>
                    </td>
                    <td className="secondary-text">{log.ip_address || '—'}</td>
                    <td className="secondary-text">{timeAgo(log.createdAt || log.created_at)}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr><td colSpan={6}><div className="empty-state">No logs match your filters</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LOGIN SESSIONS TAB ── */}
      {activeTab === 'sessions' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Device</th>
                <th>IP address</th>
                <th>Login time</th>
                <th>Logout time</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loginSessions.map((s: any) => (
                <tr key={s.id}>
                  <td style={{ fontSize: '12px', fontWeight: 500 }}>{s.admin?.full_name || '—'}</td>
                  <td className="secondary-text" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.device || '—'}</td>
                  <td className="secondary-text">{s.ip_address || '—'}</td>
                  <td className="secondary-text">{new Date(s.login_at).toLocaleString()}</td>
                  <td className="secondary-text">{s.logout_at ? new Date(s.logout_at).toLocaleString() : '—'}</td>
                  <td className="secondary-text">{duration(s.login_at, s.logout_at)}</td>
                  <td>
                    <span className={`badge ${s.is_online ? 'badge-success' : 'badge-neutral'}`}>
                      {s.is_online ? 'Online' : 'Ended'}
                    </span>
                  </td>
                </tr>
              ))}
              {loginSessions.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state">No sessions recorded yet</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
