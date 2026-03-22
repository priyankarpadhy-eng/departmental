'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy, 
  deleteDoc, 
  doc 
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function RequestsStudentClient() {
  const { user, profile } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newReq, setNewReq] = useState({
    type: 'Bonafide Certificate',
    reason: '',
    urgency: 'Normal'
  })

  useEffect(() => {
    if (!user) return
    async function fetchRequests() {
      try {
        const q = query(
          collection(db, 'requests'),
          where('student_id', '==', user?.uid),
          orderBy('created_at', 'desc')
        )
        const snap = await getDocs(q)
        setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching requests:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const data = {
        student_id: user?.uid,
        student_name: profile?.full_name,
        type: newReq.type,
        reason: newReq.reason,
        urgency: newReq.urgency,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const docRef = await addDoc(collection(db, 'requests'), data)
      setRequests(prev => [{ id: docRef.id, ...data }, ...prev])
      toast.success('Request submitted!')
      setShowCreate(false)
      setNewReq({ type: 'Bonafide Certificate', reason: '', urgency: 'Normal' })
    } catch (err) {
      toast.error('Submission failed')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <>
      <Topbar title="Certificates & Requests" accentColor="#0F6E56" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="section-heading">Active Requests</h2>
            <p className="secondary-text">Track your applications and grievances</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-filled" style={{ background: '#0F6E56', borderColor: '#0F6E56' }}>
            New Request
          </button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference No</th>
                <th>Request Type</th>
                <th>Status</th>
                <th>Submitted On</th>
                <th>Last Update</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td className="secondary-text">{r.id.substring(0, 8).toUpperCase()}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{r.type}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.reason}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      r.status === 'approved' ? 'badge-success' : 
                      r.status === 'rejected' ? 'badge-error' : 
                      'badge-warning'
                    }`}>
                      {(r.status || 'pending').toUpperCase()}
                    </span>
                  </td>
                  <td className="secondary-text">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="secondary-text">{new Date(r.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }} className="secondary-text">
                    You haven't submitted any requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>Submit New Request</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Request Type</label>
                <select className="form-input" value={newReq.type} onChange={e => setNewReq(p => ({ ...p, type: e.target.value }))}>
                  <option>Bonafide Certificate</option>
                  <option>NOC (No Objection Certificate)</option>
                  <option>Transcript / Grade Card</option>
                  <option>Leave of Absence</option>
                  <option>General Grievance</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Urgency</label>
                <select className="form-input" value={newReq.urgency} onChange={e => setNewReq(p => ({ ...p, urgency: e.target.value }))}>
                  <option>Normal</option>
                  <option>Urgent (Required within 24h)</option>
                  <option>Emergency</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reason / Description</label>
                <textarea className="form-input" rows={4} required placeholder="Briefly explain why you need this document" value={newReq.reason} onChange={e => setNewReq(p => ({ ...p, reason: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-filled" style={{ flex: 1, background: '#0F6E56', borderColor: '#0F6E56' }} disabled={creating}>
                  {creating ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
