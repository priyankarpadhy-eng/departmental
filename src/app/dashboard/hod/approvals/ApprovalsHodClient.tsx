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
import dynamic from 'next/dynamic'

const DownloadPDFButton = dynamic(
  () => import('@/components/pdf/DownloadPDFButton'),
  { ssr: false }
)

export function ApprovalsHodClient() {
  const { profile, user } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching all requests for HOD...')
        const q = query(collection(db, 'requests'), orderBy('created_at', 'desc'), limit(100))
        const snap = await getDocs(q)
        console.log(`Fetched ${snap.docs.length} requests`)
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err: any) {
        console.error('Error fetching requests for HOD:', err)
        toast.error('Failed to load queue: ' + err.message)
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
                  <th>Reference</th>
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
                      <div className="secondary-text" style={{ fontSize: '11px' }}>Regd No: {r.student_registration_no || 'N/A'}</div>
                    </td>
                    <td><span className="badge badge-neutral">{r.type}</span></td>
                    <td><div style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>{r.reference_no || '-'}</div></td>
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
                    <td style={{ minWidth: '220px' }}>
                      {r.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                          <DownloadPDFButton 
                            request={r} 
                            label="View" 
                            style={{ fontSize: '11px', background: 'rgba(83, 74, 183, 0.1)', color: '#534AB7', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none' }} 
                          />
                        </div>
                      ) : r.status === 'approved' ? (
                        <DownloadPDFButton request={r} />
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
