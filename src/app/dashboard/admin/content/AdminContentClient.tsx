'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  getDocs, 
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  query
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import toast from 'react-hot-toast'

export function AdminContentClient() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newAnn, setNewAnn] = useState({ title: '', content: '', priority: 'normal' })
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const q = query(collection(db, 'announcements'), orderBy('created_at', 'desc'))
        const snap = await getDocs(q)
        setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        toast.error('Failed to load content')
      } finally {
        setLoading(false)
      }
    }
    fetchAnnouncements()
  }, [])

  async function handleAddAnn() {
    if (!newAnn.title || !newAnn.content) return
    try {
      const docRef = await addDoc(collection(db, 'announcements'), {
        ...newAnn,
        created_at: new Date().toISOString()
      })
      setAnnouncements(prev => [{ id: docRef.id, ...newAnn, created_at: new Date().toISOString() }, ...prev])
      setNewAnn({ title: '', content: '', priority: 'normal' })
      setShowAdd(false)
      toast.success('Announcement published')
    } catch (err) {
      toast.error('Failed to publish')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure?')) return
    try {
      await deleteDoc(doc(db, 'announcements', id))
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      toast.success('Deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading content manager...</div>

  return (
    <>
      <Topbar title="Content Management" accentColor="#E24B4A" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="section-heading">Landing Page Announcements</h2>
            <p className="secondary-text">Manage the circulars and news displayed on the portal home.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn btn-filled" style={{ background: '#E24B4A', borderColor: '#E24B4A' }}>
            + New Announcement
          </button>
        </div>

        <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
          {announcements.map(a => (
            <div key={a.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className={`badge ${a.priority === 'high' ? 'badge-error' : 'badge-neutral'}`}>
                    {(a.priority || 'normal').toUpperCase()}
                </span>
                <span className="secondary-text" style={{ fontSize: '11px' }}>{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{a.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{a.content}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-ghost" style={{ color: '#E74C3C' }} onClick={() => handleDelete(a.id)}>Delete</button>
                <button className="btn btn-sm btn-ghost">Edit</button>
              </div>
            </div>
          ))}
          {announcements.length === 0 && <p className="secondary-text">No announcements yet.</p>}
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
           <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <h2 className="section-heading" style={{ marginBottom: '20px' }}>Publish Announcement</h2>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={newAnn.title} onChange={e => setNewAnn(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea className="form-input" rows={4} value={newAnn.content} onChange={e => setNewAnn(p => ({ ...p, content: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={newAnn.priority} onChange={e => setNewAnn(p => ({ ...p, priority: e.target.value }))}>
                    <option value="normal">Normal</option>
                    <option value="high">High / Urgent</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-filled" style={{ flex: 1, background: '#E24B4A', borderColor: '#E24B4A' }} onClick={handleAddAnn}>Publish</button>
              </div>
           </div>
        </div>
      )}
    </>
  )
}
