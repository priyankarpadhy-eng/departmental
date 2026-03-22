'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  orderBy
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function AlumniMentorshipClient() {
  const { user, profile } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function fetchRequests() {
      try {
        const q = query(
          collection(db, 'mentorship_requests'),
          where('alumni_id', '==', user.uid),
          orderBy('created_at', 'desc')
        )
        const snap = await getDocs(q)
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        toast.error('Failed to load mentor requests')
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
        updated_at: new Date().toISOString()
      })
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r))
      toast.success(`Request ${newStatus}`)
    } catch (err) {
      toast.error('Action failed')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading your mentorship requests...</div>

  return (
    <>
      <Topbar title="Mentorship Requests" accentColor="#854F0B" />
      <div className="content-container">
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          <div style={{ flex: 1, minWidth: '350px' }}>
            <div className="section-row" style={{ marginBottom: '24px' }}>
              <div>
                <h2 className="section-heading">Student Reach-outs</h2>
                <p className="secondary-text">Respond to students looking for career guidance.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {requests.map(r => (
                <div key={r.id} className="card" style={{ borderLeft: r.status === 'pending' ? '4px solid #F39C12' : r.status === 'accepted' ? '4px solid #27AE60' : '4px solid #E74C3C' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar avatar-sm">{r.student_name?.charAt(0)}</div>
                      <div style={{ fontWeight: 600 }}>{r.student_name}</div>
                    </div>
                    <span className="secondary-text" style={{ fontSize: '11px' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--surface-secondary)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    "{r.message}"
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {r.status === 'pending' ? (
                      <>
                        <button className="btn btn-sm btn-filled" style={{ background: '#27AE60', borderColor: '#27AE60', flex: 1 }} onClick={() => handleStatus(r.id, 'accepted')}>Accept</button>
                        <button className="btn btn-sm btn-outlined" style={{ color: '#E74C3C', borderColor: '#E74C3C', flex: 1 }} onClick={() => handleStatus(r.id, 'rejected')}>Decline</button>
                      </>
                    ) : (
                      <div style={{ width: '100%', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                        You {r.status} this request
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                  <p className="secondary-text">No mentorship requests at the moment.</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ width: '300px' }}>
             <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>💡</div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Mentorship Tip</h3>
                <p className="secondary-text" style={{ fontSize: '12px' }}>
                  A 30-minute call can change a student's life. Share your LinkedIn or email upon accepting a request.
                </p>
             </div>
          </div>

        </div>
      </div>
    </>
  )
}
