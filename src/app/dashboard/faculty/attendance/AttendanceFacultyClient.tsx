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
  updateDoc
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { CourseOffering, AttendanceSession, Profile } from '@/types'

export function AttendanceFacultyClient() {
  const { user, profile } = useAuth()
  const [offerings, setOfferings] = useState<any[]>([])
  const [selectedOffering, setSelectedOffering] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
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

    async function fetchSessions() {
      try {
        const q = query(
          collection(db, 'attendance_sessions'),
          where('offering_id', '==', selectedOffering),
          orderBy('session_date', 'desc')
        )
        const snap = await getDocs(q)
        setSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching sessions:', err)
      }
    }

    fetchSessions()
  }, [selectedOffering])

  async function handleStartSession(type: 'manual' | 'qr' | 'face') {
    if (!selectedOffering) return
    setCreating(true)

    try {
      const offering = offerings.find(o => o.id === selectedOffering)
      const sessionData = {
        offering_id: selectedOffering,
        faculty_id: user?.uid,
        session_date: new Date().toISOString(),
        session_type: type,
        is_open: true,
        created_at: new Date().toISOString(),
        // For QR/Face we might need more fields
        qr_token: Math.random().toString(36).substring(7),
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      }

      const docRef = await addDoc(collection(db, 'attendance_sessions'), sessionData)
      setSessions(prev => [{ id: docRef.id, ...sessionData }, ...prev])
      toast.success('Session started!')
    } catch (err: any) {
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
                      onClick={() => handleStartSession('manual')}
                      disabled={creating}
                      style={{ '--role-accent': '#185FA5', flexDirection: 'column', padding: '20px', gap: '10px' } as React.CSSProperties}
                    >
                      <span>Manual</span>
                    </button>
                    <button 
                      className="btn btn-outlined" 
                      onClick={() => handleStartSession('qr')}
                      disabled={creating}
                      style={{ '--role-accent': '#185FA5', flexDirection: 'column', padding: '20px', gap: '10px' } as React.CSSProperties}
                    >
                      <span>QR Code</span>
                    </button>
                    <button 
                      className="btn btn-outlined" 
                      onClick={() => handleStartSession('face')}
                      disabled={creating}
                      style={{ '--role-accent': '#185FA5', flexDirection: 'column', padding: '20px', gap: '10px' } as React.CSSProperties}
                    >
                      <span>Face ID</span>
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
                            <th>Type</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.map(s => (
                            <tr key={s.id}>
                              <td>{new Date(s.session_date).toLocaleDateString()}</td>
                              <td><span className="badge badge-neutral">{s.session_type}</span></td>
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
      </div>
    </>
  )
}
