'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const ACCENT = '#854F0B'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:         { label: 'Pending',         color: '#D97706', bg: '#FFFBEB' },
  alumni_accepted: { label: 'Awaiting Student', color: '#6366F1', bg: '#EEF2FF' },
  accepted:        { label: 'Mentorship Live', color: '#16A34A', bg: '#F0FDF4' },
  rejected:        { label: 'Declined',        color: '#DC2626', bg: '#FEF2F2' },
}

export function AlumniMentorshipClient() {
  const { user, profile } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'alumni_accepted' | 'accepted' | 'rejected'>('pending')

  useEffect(() => {
    if (!user) return
    async function fetchRequests() {
      try {
        // No orderBy to avoid index requirement — sort in memory
        if (!user) return
        const q = query(collection(db, 'mentorship_requests'), where('alumni_id', '==', user.uid))
        const snap = await getDocs(q)
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''))
        setRequests(data)
      } catch (err: any) {
        console.error(err)
        toast.error(err?.message || 'Failed to load mentor requests')
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [user])

  async function handleStatus(requestId: string, newStatus: string) {
    try {
      await updateDoc(doc(db, 'mentorship_requests', requestId), {
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r))
      const msg = newStatus === 'alumni_accepted' ? 'Approved! Awaiting student confirmation.' : 
                  newStatus === 'accepted' ? 'Mentorship Finalized ✓' : 'Declined'
      toast.success(msg)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Action failed')
    }
  }

  const filtered = requests.filter(r => r.status === activeTab)
  const counts = {
    pending:         requests.filter(r => r.status === 'pending').length,
    alumni_accepted: requests.filter(r => r.status === 'alumni_accepted').length,
    accepted:        requests.filter(r => r.status === 'accepted').length,
    rejected:        requests.filter(r => r.status === 'rejected').length,
  }

  return (
    <>
      <Topbar title="Mentorship Requests" accentColor={ACCENT} />
      <div className="content-container">

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
          {(Object.entries(STATUS_CONFIG) as [string, any][]).map(([key, cfg]) => (
            <button key={key} onClick={() => setActiveTab(key as any)}
              style={{
                background: activeTab === key ? cfg.bg : 'var(--card-bg)',
                border: activeTab === key ? `2px solid ${cfg.color}` : '2px solid transparent',
                borderRadius: '16px', padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
                boxShadow: activeTab === key ? `0 4px 16px ${cfg.color}22` : '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.2s', flex: 1
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: 900, color: cfg.color, lineHeight: 1 }}>{(counts as any)[key]}</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: cfg.color, marginTop: '4px', whiteSpace: 'nowrap' }}>{cfg.label}</div>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Requests list */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading mentorship requests…</div>
            ) : filtered.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  {activeTab === 'pending' ? '📭' : activeTab === 'accepted' ? '🤝' : '📋'}
                </div>
                <p style={{ fontWeight: 600, marginBottom: '6px' }}>No {STATUS_CONFIG[activeTab].label} Requests</p>
                <p className="secondary-text" style={{ fontSize: '13px' }}>
                  {activeTab === 'pending' ? 'All caught up! Check back later.' : `No requests have been ${activeTab} yet.`}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filtered.map(r => {
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
                  return (
                    <div key={r.id} className="card" style={{
                      padding: '24px', borderLeft: `4px solid ${cfg.color}`,
                      background: r.status === 'pending' ? undefined : cfg.bg,
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `rgba(133,79,11,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: ACCENT, fontSize: '18px' }}>
                            {r.student_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '15px' }}>{r.student_name || 'Unknown Student'}</div>
                            {r.student_email && <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{r.student_email}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, padding: '3px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{cfg.label}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </span>
                        </div>
                      </div>

                      <div style={{ background: 'var(--surface-secondary)', borderRadius: '10px', padding: '14px', marginBottom: '16px', borderLeft: '3px solid var(--border-color)' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>"{r.message}"</p>
                      </div>

                      {r.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="btn btn-filled" style={{ flex: 1, background: '#6366F1', borderColor: '#6366F1', fontSize: '13px' }} onClick={() => handleStatus(r.id, 'alumni_accepted')}>
                            ✓ Approve Request
                          </button>
                          <button className="btn btn-outlined" style={{ flex: 1, color: '#DC2626', borderColor: '#DC2626', fontSize: '13px' }} onClick={() => handleStatus(r.id, 'rejected')}>
                            ✗ Decline
                          </button>
                        </div>
                      )}
                      {r.status !== 'pending' && (
                        <div style={{ fontSize: '12px', fontWeight: 600, color: cfg.color, textAlign: 'center', paddingTop: '4px' }}>
                          {r.status === 'alumni_accepted' ? '⏳ Awaiting student confirmation' : 
                          r.status === 'accepted' ? '🤝 Mentorship Active' : '❌ You declined this request'}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar tip */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, #FDF3E7 0%, #fff 100%)', border: `1px solid rgba(133,79,11,0.15)` }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>💡</div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: ACCENT }}>Mentorship Tip</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                A 30-minute call can change a student's career. Upon accepting a request, share your LinkedIn or preferred contact method.
              </p>
            </div>
            {counts.accepted > 0 && (
              <div className="card" style={{ marginTop: '16px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#16A34A' }}>{counts.accepted}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>students mentored</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
