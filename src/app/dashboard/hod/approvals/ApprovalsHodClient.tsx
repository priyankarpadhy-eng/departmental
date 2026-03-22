'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  getDocs, 
  updateDoc, 
  doc, 
  orderBy, 
  limit 
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function ApprovalsHodClient() {
  const { profile, user } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const q = query(collection(db, 'requests'), orderBy('created_at', 'desc'), limit(100))
        const snap = await getDocs(q)
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('Error fetching requests:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleAction(requestId: string, status: 'approved' | 'rejected') {
    setActing(requestId)
    try {
      await updateDoc(doc(db, 'requests', requestId), {
        status,
        updated_at: new Date().toISOString(),
        reviewed_by_id: user?.uid,
        reviewed_by_name: profile?.full_name
      })
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r))
      toast.success(`Request ${status}`)
    } catch (err) {
      toast.error('Action failed')
    } finally {
      setActing(null)
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading approvals...</div>

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <>
      <Topbar title="Request Approvals" accentColor="#534AB7" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="section-heading">Approvals Queue</h2>
            <p className="secondary-text">{pendingCount} pending requests require your attention</p>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Request Type</th>
                  <th>Reason</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.student_name}</div>
                      <div className="secondary-text" style={{ fontSize: '11px' }}>ID: {r.student_id?.substring(0,6)}</div>
                    </td>
                    <td><span className="badge badge-neutral">{r.type}</span></td>
                    <td style={{ maxWidth: '300px' }}>
                      <div className="secondary-text" style={{ fontSize: '12px' }}>{r.reason}</div>
                    </td>
                    <td className="secondary-text" style={{ whiteSpace: 'nowrap' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`badge ${
                        r.status === 'approved' ? 'badge-success' : 
                        r.status === 'rejected' ? 'badge-error' : 
                        'badge-warning'
                      }`}>
                        {r.status?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {r.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleAction(r.id, 'approved')} 
                            disabled={!!acting}
                            className="btn btn-sm" 
                            style={{ background: '#1A7A46', color: 'white', borderColor: '#1A7A46' }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleAction(r.id, 'rejected')} 
                            disabled={!!acting}
                            className="btn btn-sm btn-outlined" 
                            style={{ '--role-accent': '#C0392B' } as React.CSSProperties}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="secondary-text" style={{ fontSize: '11px' }}>Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }} className="secondary-text">
                      No requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
