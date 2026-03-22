'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'

export function AlumniRecordsClient() {
  const { user } = useAuth()
  const [results, setResults] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function fetchRecords() {
      try {
        const [resSnap, reqSnap] = await Promise.all([
          getDocs(query(collection(db, 'results'), where('student_id', '==', user.uid))),
          getDocs(query(collection(db, 'requests'), where('student_id', '==', user.uid)))
        ])
        setResults(resSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setRequests(reqSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecords()
  }, [user])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Retrieving archive...</div>

  return (
    <>
      <Topbar title="Academic Records" accentColor="#854F0B" />
      <div className="content-container">
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            
            {/* Grades Section */}
            <div>
                <h2 className="section-heading" style={{ marginBottom: '16px' }}>Grade History</h2>
                <div className="card" style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontSize: '13px' }}>{r.course_name}</td>
                                    <td><span className="badge badge-neutral">{r.grade}</span></td>
                                </tr>
                            ))}
                            {results.length === 0 && (
                                <tr><td colSpan={2} style={{ textAlign: 'center', padding: '20px' }} className="secondary-text">No academic results found in archive.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Documents Section */}
            <div>
                <h2 className="section-heading" style={{ marginBottom: '16px' }}>Issued Documents</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {requests.filter(r => r.status === 'approved').map(r => (
                        <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.type}</div>
                                <div className="secondary-text" style={{ fontSize: '11px' }}>Issued on {new Date(r.updated_at).toLocaleDateString()}</div>
                            </div>
                            <button className="btn btn-sm btn-outlined">Download</button>
                        </div>
                    ))}
                    {requests.filter(r => r.status === 'approved').length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
                            <p className="secondary-text">No certificates found.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </>
  )
}
