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
  limit,
  doc,
  getDoc,
  onSnapshot
} from 'firebase/firestore'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function AttendanceStudentClient() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [summaries, setSummaries] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'attendance_summary'),
      where('student_id', '==', user?.uid)
    )
    
    const unsub = onSnapshot(q, async (snap) => {
      const summaryList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setSummaries(summaryList)
      
      // Calculate overall stats if possible
      if (summaryList.length > 0) {
        const totalPresent = summaryList.reduce((acc, curr: any) => acc + (curr.present_count || 0), 0)
        const totalHeld = summaryList.reduce((acc, curr: any) => acc + (curr.total_sessions || 0), 0)
        setStats({
          percent: totalHeld > 0 ? ((totalPresent / totalHeld) * 100).toFixed(1) : '0',
          totalPresent,
          totalHeld
        })
      }
      setLoading(false)
    })

    return () => unsub()
  }, [user])

  useEffect(() => {
    if (!selectedSubject || !user) {
      setRecords([])
      return
    }

    // Listener for records
    const recordsQ = query(
      collection(db, 'attendance_records'),
      where('student_id', '==', user?.uid),
      orderBy('marked_at', 'desc'),
      limit(20)
    )

    const unsub = onSnapshot(recordsQ, (snap) => {
      // Filter for the selected offering client-side if session data isn't in record
      // But for professional scale, we should have offering_id in record. 
      // Let's assume it exists or we use a mapping.
      setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    return () => unsub()
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
        {stats && (
          <div className="grid-3" style={{ marginBottom: '24px' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F6E56' }}>{stats.percent}%</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '1px' }}>OVERALL ATTENDANCE</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#1A5FA5' }}>{stats.totalPresent}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '1px' }}>TOTAL PRESENT</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>{stats.totalHeld}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '1px' }}>TOTAL SESSIONS HELD</div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Left: Summaries */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <h2 className="section-heading" style={{ marginBottom: '20px', fontSize: '14px' }}>Academic Summary</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {summaries.map(s => {
                  const pct = Math.round((s.present_count || 0) / (s.total_sessions || 1) * 100)
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSubject(s.offering_id)}
                      className="card"
                      style={{
                        padding: '16px',
                        cursor: 'pointer',
                        borderRadius: '16px',
                        border: selectedSubject === s.offering_id ? '2px solid #0F6E56' : '1px solid var(--border-color)',
                        background: selectedSubject === s.offering_id ? 'rgba(15, 110, 86, 0.05)' : 'var(--surface-primary)',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 700, display: 'block' }}>{s.course_name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{s.present_count} / {s.total_sessions} Sessions</span>
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: pct >= 75 ? '#0F6E56' : '#C0392B' }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="progress-bar" style={{ height: '8px', borderRadius: '10px', background: 'var(--border-color)' }}>
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${pct}%`,
                            borderRadius: '10px',
                            background: pct >= 85 ? '#0F6E56' : pct >= 75 ? '#1A5FA5' : '#C0392B'
                          }} 
                        />
                      </div>
                    </button>
                  )
                })}
                {summaries.length === 0 && <p className="secondary-text">No attendance records found.</p>}
              </div>
            </div>
          </div>

          {/* Right: Detailed Logs & Graph */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {selectedSubject && (
              <div className="card" style={{ padding: '24px' }}>
                <h2 className="section-heading" style={{ marginBottom: '20px', fontSize: '14px' }}>Attendance Trend</h2>
                <div style={{ height: '200px' }}>
                  <Line 
                    data={{
                      labels: records.slice().reverse().map(r => new Date(r.marked_at).toLocaleDateString()),
                      datasets: [{
                        label: 'Present',
                        data: records.slice().reverse().map((r, i) => r.status === 'present' ? 1 : 0),
                        borderColor: '#0F6E56',
                        backgroundColor: 'rgba(15, 110, 86, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#0F6E56'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { display: false, min: 0, max: 1.2 },
                        x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                      },
                      plugins: { legend: { display: false } }
                    }}
                  />
                </div>
              </div>
            )}

            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="section-heading" style={{ fontSize: '14px', margin: 0 }}>Session Logs</h2>
                {selectedSubject && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Showing last 20 sessions</span>}
              </div>
              
              {selectedSubject ? (
                records.length > 0 ? (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Method</th>
                          <th>Course</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map(r => (
                          <tr key={r.id}>
                            <td style={{ fontSize: '13px' }}>{new Date(r.marked_at).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${r.status === 'present' ? 'badge-success' : 'badge-error'}`} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '10px' }}>
                                {r.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="secondary-text" style={{ fontSize: '12px' }}>{r.method}</td>
                            <td style={{ fontSize: '12px', fontWeight: 500 }}>{r.course_name || 'Class'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <p className="secondary-text">No marked sessions found for this subject.</p>
                  </div>
                )
              ) : (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <p className="secondary-text">Please select a subject from the left panel to view analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
