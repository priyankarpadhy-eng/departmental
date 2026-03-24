'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  orderBy,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
  onSnapshot
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { CourseOffering, AttendanceSession, Profile } from '@/types'
import { AttendanceReportTable } from '@/components/attendance/AttendanceReportTable'
import { AttendanceDetailedReportTable } from '@/components/attendance/AttendanceDetailedReportTable'

export function AttendanceFacultyClient() {
  const { user, profile } = useAuth()
  const [offerings, setOfferings] = useState<any[]>([])
  const [selectedOffering, setSelectedOffering] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'manage' | 'reports'>('manage')
  const [reportSubTab, setReportSubTab] = useState<'sessions' | 'detailed'>('sessions')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!user) return

    async function fetchOfferings() {
      try {
        const q = query(
          collection(db, 'course_offerings'),
          where('faculty_id', '==', user?.uid)
        )
        const snap = await getDocs(q)
        setOfferings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching offerings:', err)
        toast.error('Failed to load courses')
      } finally {
        setLoading(false)
      }
    }

    fetchOfferings()
  }, [user])

  useEffect(() => {
    if (!selectedOffering) {
      setSessions([])
      return
    }

    const q = query(
      collection(db, 'attendance_sessions'),
      where('offering_id', '==', selectedOffering),
      orderBy('session_date', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }, (err) => {
      console.error('Real-time sessions error:', err)
    })

    return () => unsubscribe()
  }, [selectedOffering])

  async function handleStartSession(type: 'manual' | 'qr' | 'face' | 'otp') {
    if (!selectedOffering) return
    setCreating(true)

    try {
      const offering = offerings.find(o => o.id === selectedOffering)
      const otp = type === 'otp' ? Math.floor(100000 + Math.random() * 900000).toString() : null
      
      const sessionData = {
        offering_id: selectedOffering,
        course_name: offering?.course_name,
        course_code: offering?.course_code,
        batch_id: offering?.batch_id,
        batch_name: offering?.batch_name,
        semester_id: offering?.semester_id,
        semester_name: offering?.semester_name,
        faculty_id: user?.uid,
        faculty_name: profile?.full_name,
        session_date: new Date().toISOString(),
        session_type: type,
        is_open: true,
        created_at: new Date().toISOString(),
        qr_token: Math.random().toString(36).substring(7),
        otp: otp,
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      }

      const docRef = await addDoc(collection(db, 'attendance_sessions'), sessionData)
      setSessions(prev => [{ id: docRef.id, ...sessionData }, ...prev])
      toast.success(type === 'otp' ? `OTP Session started! Code: ${otp}` : 'Session started!')
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to start session')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <>
      <Topbar title="Attendance Management" accentColor="#185FA5" />
      <div className="content-container">
        <div style={{ display: 'flex', gap: '2px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-secondary)', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
          <button 
            onClick={() => setActiveTab('manage')}
            style={{ padding: '12px 24px', border: 'none', background: activeTab === 'manage' ? 'white' : 'transparent', color: activeTab === 'manage' ? '#185FA5' : 'var(--text-tertiary)', fontWeight: 600, borderBottom: activeTab === 'manage' ? '2px solid #185FA5' : 'none', cursor: 'pointer' }}
          >
            Manage Sessions
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            style={{ padding: '12px 24px', border: 'none', background: activeTab === 'reports' ? 'white' : 'transparent', color: activeTab === 'reports' ? '#185FA5' : 'var(--text-tertiary)', fontWeight: 600, borderBottom: activeTab === 'reports' ? '2px solid #185FA5' : 'none', cursor: 'pointer' }}
          >
            Excel Reports
          </button>
        </div>

        {activeTab === 'manage' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* Left: Course Selection */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h2 className="section-heading" style={{ marginBottom: '16px' }}>Select Course</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {offerings.map(o => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOffering(o.id)}
                  className={`btn btn-outlined`}
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    padding: '12px',
                    borderColor: selectedOffering === o.id ? '#185FA5' : 'var(--border-color)',
                    background: selectedOffering === o.id ? 'var(--surface-secondary)' : 'transparent',
                    '--role-accent': '#185FA5'
                  } as React.CSSProperties}
                >
                  <div style={{ fontSize: '13px', fontWeight: 500, color: selectedOffering === o.id ? '#185FA5' : 'var(--text-primary)' }}>
                    {o.course_name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    Batch: {o.batch_name} · {o.course_code}
                  </div>
                </button>
              ))}
              {offerings.length === 0 && <p className="secondary-text">No courses assigned to you.</p>}
            </div>
          </div>

          {/* Right: Sessions & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {selectedOffering ? (
              <>
                <div className="card">
                  <div className="section-row" style={{ marginBottom: '16px' }}>
                    <h2 className="section-heading">Take Attendance</h2>
                    <span className="badge badge-info">Active Offering</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                    <button 
                      className="btn btn-outlined" 
                      onClick={() => handleStartSession('otp')}
                      disabled={creating}
                      style={{ '--role-accent': '#185FA5', flexDirection: 'column', padding: '16px', gap: '8px' } as React.CSSProperties}
                    >
                      <span style={{ fontSize: '20px' }}>🔢</span>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>OTP Code</span>
                    </button>
                    <button 
                      className="btn btn-outlined" 
                      onClick={() => handleStartSession('manual')}
                      disabled={creating}
                      style={{ '--role-accent': '#185FA5', flexDirection: 'column', padding: '16px', gap: '8px' } as React.CSSProperties}
                    >
                      <span style={{ fontSize: '20px' }}>✍️</span>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Manual</span>
                    </button>
                    <button 
                      className="btn btn-outlined" 
                      onClick={() => handleStartSession('qr')}
                      disabled={creating}
                      style={{ '--role-accent': '#185FA5', flexDirection: 'column', padding: '16px', gap: '8px' } as React.CSSProperties}
                    >
                      <span style={{ fontSize: '20px' }}>📱</span>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>QR Code</span>
                    </button>
                    <button 
                      className="btn btn-outlined" 
                      onClick={() => handleStartSession('face')}
                      disabled={creating}
                      style={{ '--role-accent': '#185FA5', flexDirection: 'column', padding: '16px', gap: '8px' } as React.CSSProperties}
                    >
                      <span style={{ fontSize: '20px' }}>👤</span>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Face ID</span>
                    </button>
                  </div>
                </div>

                <div className="card">
                  <h2 className="section-heading" style={{ marginBottom: '16px' }}>Recent Sessions</h2>
                  {sessions.length > 0 ? (
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Batch</th>
                            <th>Semester</th>
                            <th>Course</th>
                            <th>Type</th>
                            <th>OTP</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.map(s => (
                            <tr key={s.id}>
                              <td className="secondary-text">{new Date(s.session_date).toLocaleDateString()}</td>
                              <td style={{ fontWeight: 600 }}>{s.batch_name}</td>
                              <td className="secondary-text">{s.semester_name || 'N/A'}</td>
                              <td>{s.course_name}</td>
                              <td><span className="badge badge-neutral">{s.session_type}</span></td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#185FA5' }}>{s.otp || '—'}</td>
                              <td>
                                <span className={`badge ${s.is_open ? 'badge-success' : 'badge-neutral'}`}>
                                  {s.is_open ? 'Open' : 'Closed'}
                                </span>
                              </td>
                              <td>
                                <Link href={`/dashboard/faculty/attendance/session?id=${s.id}`} className="btn btn-sm btn-ghost" style={{ color: '#185FA5' }}>
                                  View / Mark
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state"><p className="secondary-text">No sessions created yet for this course.</p></div>
                  )}
                </div>
              </>
            ) : (
              <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                <p className="secondary-text">Select a course from the left to manage attendance</p>
              </div>
            )}
          </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                <button 
                  onClick={() => setReportSubTab('sessions')}
                  className={`btn btn-sm ${reportSubTab === 'sessions' ? 'btn-filled' : 'btn-outlined'}`}
                  style={{ borderRadius: '20px' }}
                >
                  Session Summary
                </button>
                <button 
                  onClick={() => setReportSubTab('detailed')}
                  className={`btn btn-sm ${reportSubTab === 'detailed' ? 'btn-filled' : 'btn-outlined'}`}
                  style={{ borderRadius: '20px' }}
                >
                  Student Detailed Log (Name/Roll/Status)
                </button>
             </div>

             {reportSubTab === 'sessions' ? (
                <>
                  <h2 className="section-heading">Detailed Attendance History</h2>
                  <AttendanceReportTable role="faculty" facultyId={user?.uid} />
                </>
             ) : (
                <>
                  <h2 className="section-heading">Bulk Student Report (Present vs Absent)</h2>
                  <AttendanceDetailedReportTable role="faculty" facultyId={user?.uid} />
                </>
             )}
          </div>
        )}
      </div>
    </>
  )
}
