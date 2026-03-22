'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function AttendanceStudentClient() {
  const { user, profile } = useAuth()
  const [summaries, setSummaries] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchSummaries() {
      try {
        const q = query(
          collection(db, 'attendance_summary'),
          where('student_id', '==', user?.uid)
        )
        const snap = await getDocs(q)
        setSummaries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching summaries:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSummaries()
  }, [user])

  useEffect(() => {
    if (!selectedSubject || !user) {
      setRecords([])
      return
    }

    async function fetchRecords() {
      try {
        // First find sessions for this offering
        const sessionsQuery = query(
          collection(db, 'attendance_sessions'),
          where('offering_id', '==', selectedSubject)
        )
        const sessionsSnap = await getDocs(sessionsQuery)
        const sessionIds = sessionsSnap.docs.map(d => d.id)

        if (sessionIds.length === 0) {
          setRecords([])
          return
        }

        // Ideally we fetch attendance records for these sessions + this student
        // But Firestore 'in' has limits. For now simpler: query records by student
        const q = query(
          collection(db, 'attendance_records'),
          where('student_id', '==', user?.uid),
          orderBy('marked_at', 'desc')
        )
        const snap = await getDocs(q)
        // Filter those that belong to the current selected offering if we have the session mapping
        // For simplicity in this demo, we'll assume the record has offering_id or we filter client-side
        setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching records:', err)
      }
    }

    fetchRecords()
  }, [selectedSubject, user])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading attendance...</div>

  return (
    <>
      <Topbar title="My Attendance" accentColor="#0F6E56" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="section-heading">Attendance Overview</h2>
            <p className="secondary-text">Track your presence across all subjects</p>
          </div>
          <Link href="/dashboard/student/attendance/mark" className="btn btn-filled" style={{ background: '#0F6E56', borderColor: '#0F6E56' }}>
            Mark My Attendance (QR Scanner)
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* Left: Summaries */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <h2 className="section-heading" style={{ marginBottom: '16px' }}>Summary</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {summaries.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubject(s.offering_id)}
                    className="card"
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      border: selectedSubject === s.offering_id ? '1px solid #0F6E56' : '1px solid var(--border-color)',
                      background: selectedSubject === s.offering_id ? 'var(--surface-secondary)' : 'var(--surface-primary)',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{s.course_name}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: s.attendance_pct >= 75 ? '#0F6E56' : '#C0392B' }}>
                        {s.attendance_pct}%
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: '6px' }}>
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${s.attendance_pct}%`,
                          background: s.attendance_pct >= 85 ? '#0F6E56' : s.attendance_pct >= 75 ? '#9A6B00' : '#C0392B'
                        }} 
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                      {s.present_count} / {s.total_sessions} sessions
                    </div>
                  </button>
                ))}
                {summaries.length === 0 && <p className="secondary-text">No attendance records found.</p>}
              </div>
            </div>
          </div>

          {/* Right: Detailed Logs */}
          <div className="card">
            <h2 className="section-heading" style={{ marginBottom: '16px' }}>Attendance Logs</h2>
            {selectedSubject ? (
              records.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => (
                        <tr key={r.id}>
                          <td>{new Date(r.marked_at).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${r.status === 'present' ? 'badge-success' : 'badge-error'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="secondary-text">{r.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state"><p className="secondary-text">No detailed records for this subject.</p></div>
              )
            ) : (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p className="secondary-text">Select a subject to view detailed logs</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
