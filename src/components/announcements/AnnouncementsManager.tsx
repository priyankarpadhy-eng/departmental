'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  orderBy, 
  deleteDoc, 
  doc,
  updateDoc,
  limit
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { UserRole } from '@/types'

interface Props {
  role: UserRole
  accentColor: string
}

export function AnnouncementsManager({ role, accentColor }: Props) {
  const { user, profile } = useAuth()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newAnn, setNewAnn] = useState({
    title: '',
    body: '',
    target_role: 'all' as UserRole | 'all',
    target_batch_id: '',
    is_pinned: false
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const q = query(collection(db, 'announcements'), orderBy('created_at', 'desc'), limit(50))
        const snap = await getDocs(q)
        setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })))

        const batchSnap = await getDocs(collection(db, 'batches'))
        setBatches(batchSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('Error fetching announcements:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const data = {
        author_id: user?.uid,
        author_name: profile?.full_name || 'Admin',
        title: newAnn.title,
        body: newAnn.body,
        target_role: newAnn.target_role === 'all' ? null : newAnn.target_role,
        target_batch_id: newAnn.target_batch_id || null,
        is_pinned: newAnn.is_pinned,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const docRef = await addDoc(collection(db, 'announcements'), data)
      setAnnouncements(prev => [{ id: docRef.id, ...data }, ...prev])
      toast.success('Announcement posted!')
      setShowCreate(false)
      setNewAnn({ title: '', body: '', target_role: 'all', target_batch_id: '', is_pinned: false })
    } catch (err) {
      toast.error('Failed to post announcement')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    try {
      await deleteDoc(doc(db, 'announcements', id))
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      toast.success('Deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  async function togglePin(a: any) {
    try {
      await updateDoc(doc(db, 'announcements', a.id), { is_pinned: !a.is_pinned })
      setAnnouncements(prev => prev.map(item => item.id === a.id ? { ...item, is_pinned: !a.is_pinned } : item))
    } catch (err) {
      toast.error('Update failed')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <>
      <Topbar title="Announcements" accentColor={accentColor} />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="section-heading">Manage Announcements</h2>
            <p className="secondary-text">Broadcast messages to the department</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-filled" style={{ background: accentColor, borderColor: accentColor }}>
            Post New
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {announcements.map(a => (
            <div key={a.id} className="card" style={{ borderLeft: a.is_pinned ? `4px solid ${accentColor}` : '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {a.is_pinned && <span className="badge badge-info">Pinned</span>}
                    <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{a.title}</h3>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    Posted by {a.author_name} · {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => togglePin(a)} className="btn btn-sm btn-ghost" title={a.is_pinned ? 'Unpin' : 'Pin'}>
                    📌
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="btn btn-sm btn-ghost" style={{ color: 'var(--status-error)' }}>
                    🗑
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{a.body}</p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                {a.target_role && <span className="badge badge-neutral">Role: {a.target_role}</span>}
                {a.target_batch_id && <span className="badge badge-neutral">Batch: {batches.find(b => b.id === a.target_batch_id)?.graduation_year || 'Batch'}</span>}
                {!a.target_role && !a.target_batch_id && <span className="badge badge-neutral">Everyone</span>}
              </div>
            </div>
          ))}
          {announcements.length === 0 && <div className="empty-state">No announcements yet.</div>}
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>Create Announcement</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" required value={newAnn.title} onChange={e => setNewAnn(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Message Content</label>
                <textarea className="form-input" rows={6} required value={newAnn.body} onChange={e => setNewAnn(p => ({ ...p, body: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Target Role</label>
                  <select className="form-input" value={newAnn.target_role} onChange={e => setNewAnn(p => ({ ...p, target_role: e.target.value as any }))}>
                    <option value="all">Everyone</option>
                    <option value="student">Students Only</option>
                    <option value="faculty">Faculty Only</option>
                    <option value="hod">HOD Only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target Batch (Optional)</label>
                  <select className="form-input" value={newAnn.target_batch_id} onChange={e => setNewAnn(p => ({ ...p, target_batch_id: e.target.value }))}>
                    <option value="">All Batches</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.graduation_year} — Section {b.section}</option>)}
                  </select>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={newAnn.is_pinned} onChange={e => setNewAnn(p => ({ ...p, is_pinned: e.target.checked }))} />
                Pin this announcement
              </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-filled" style={{ flex: 1, background: accentColor, borderColor: accentColor }} disabled={creating}>
                  {creating ? 'Posting...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
