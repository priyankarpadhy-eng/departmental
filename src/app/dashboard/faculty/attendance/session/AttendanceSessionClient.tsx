'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  increment
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { Profile, AttendanceRecord, AttendanceSession } from '@/types'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  sessionId: string
}

export function AttendanceSessionClient({ sessionId }: Props) {
  const { user } = useAuth()
  const [session, setSession] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [records, setRecords] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!sessionId) return

    async function fetchData() {
      try {
        // 1. Fetch Session
        const sessionDoc = await getDoc(doc(db, 'attendance_sessions', sessionId))
        if (!sessionDoc.exists()) {
          toast.error('Session not found')
          return
        }
        const sessionData = { id: sessionDoc.id, ...(sessionDoc.data() as any) }
        setSession(sessionData)

        // 2. Fetch Students in the Batch
        const offeringDoc = await getDoc(doc(db, 'course_offerings', sessionData.offering_id))
        const offeringData = offeringDoc.data()
        
        if (offeringData?.batch_id) {
          const studentsQ = query(
            collection(db, 'profiles'),
            where('batch_id', '==', offeringData.batch_id),
            where('role', '==', 'student')
          )
          const studentsSnap = await getDocs(studentsQ)
          setStudents(studentsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
        }

        // 3. Fetch Existing Records
        const recordsQ = query(
          collection(db, 'attendance_records'),
          where('session_id', '==', sessionId)
        )
        const recordsSnap = await getDocs(recordsQ)
        const recordMap: Record<string, any> = {}
        recordsSnap.docs.forEach(d => {
          recordMap[d.data().student_id] = { id: d.id, ...(d.data() as any) }
        })
        setRecords(recordMap)

      } catch (err) {
        console.error('Error fetching session details:', err)
        toast.error('Failed to load session data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sessionId])

  async function toggleAttendance(studentId: string) {
    if (!session) return
    const current = records[studentId]
    const newStatus = current?.status === 'present' ? 'absent' : 'present'
    
    setSaving(true)
    try {
      const recordRef = doc(db, 'attendance_records', `${sessionId}_${studentId}`)
      const recordData = {
        session_id: sessionId,
        student_id: studentId,
        student_name: students.find(s => s.id === studentId)?.full_name || 'Student',
        status: newStatus,
        method: 'manual',
        marked_at: new Date().toISOString()
      }

      await setDoc(recordRef, recordData)
      
      // Update local state
      setRecords((prev: Record<string, any>) => ({
        ...prev,
        [studentId]: { id: recordRef.id, ...recordData }
      }))

      // Update Summary
      const summaryId = `${studentId}_${session.offering_id}`
      const summaryRef = doc(db, 'attendance_summary', summaryId)
      const summarySnap = await getDoc(summaryRef)

      if (summarySnap.exists()) {
        const sData = summarySnap.data()
        const isPresentChange = newStatus === 'present' ? 1 : -1
        const totalChange = current ? 0 : 1 // Only increment total if it's the first time marking this student

        const newPresent = sData.present_count + isPresentChange
        const newTotal = sData.total_sessions + totalChange

        await updateDoc(summaryRef, {
          present_count: increment(isPresentChange),
          total_sessions: increment(totalChange),
          percentage: (newPresent / newTotal) * 100
        })
      } else if (newStatus === 'present') {
        // Create summary if it doesn't exist and we are marking present
        await setDoc(summaryRef, {
          student_id: studentId,
          offering_id: session.offering_id,
          present_count: 1,
          total_sessions: 1,
          percentage: 100,
          course_name: session.course_name || 'Course'
        })
      }

      toast.success(`Marked as ${newStatus}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update record')
    } finally {
      setSaving(false)
    }
  }

  async function handleCloseSession() {
    if (!session) return
    try {
      await updateDoc(doc(db, 'attendance_sessions', sessionId), { is_open: false })
      setSession((prev: any) => ({ ...prev, is_open: false }))
      toast.success('Session closed')
    } catch (err) {
      toast.error('Failed to close session')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading session...</div>
  if (!session) return <div style={{ padding: '40px', textAlign: 'center' }}>Session not found.</div>

  const presentCount = Object.values(records).filter(r => r.status === 'present').length

  return (
    <>
      <Topbar title="Mark Attendance" accentColor="#185FA5" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="section-heading">Session: {new Date(session.session_date).toLocaleDateString()}</h2>
            <p className="secondary-text">Type: {session.session_type} · {presentCount} Present / {students.length} Total</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {session.is_open && (
              <button 
                onClick={() => {
                  const modalId = session.session_type === 'otp' ? 'otp-modal' : 'qr-modal';
                  const modal = document.getElementById(modalId);
                  if (modal) modal.style.display = 'flex';
                }} 
                className="btn btn-filled" 
                style={{ background: '#185FA5', borderColor: '#185FA5' }}
              >
                {session.session_type === 'otp' ? 'Show OTP Code' : 'Show QR Code'}
              </button>
            )}
            {session.is_open && (
              <button onClick={handleCloseSession} className="btn btn-outlined" style={{ '--role-accent': '#C0392B' } as React.CSSProperties}>
                Close Session
              </button>
            )}
            <Link href="/dashboard/faculty/attendance" className="btn btn-ghost">Back</Link>
          </div>
        </div>

        {/* OTP Display Highlight */}
        {session.session_type === 'otp' && session.otp && (
          <div className="card" style={{ marginBottom: '24px', textAlign: 'center', background: 'linear-gradient(135deg, #1A5FA5 0%, #114177 100%)', color: 'white', border: 'none', boxShadow: '0 8px 32px rgba(24,95,165,0.3)' }}>
            <h3 style={{ fontSize: '13px', opacity: 0.8, fontWeight: 700, letterSpacing: '2px', marginBottom: '12px' }}>SESSION OTP CODE</h3>
            <div style={{ fontSize: '72px', fontWeight: 900, letterSpacing: '12px', textShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{session.otp}</div>
            <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '12px' }}>
              {session.is_open ? 'Students can enter this code to mark attendance.' : 'This session is now closed.'}
            </p>
          </div>
        )}

        {/* OTP Modal */}
        <div 
          id="otp-modal" 
          style={{ 
            display: 'none', 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            background: 'rgba(0,0,0,0.9)', 
            zIndex: 9999, 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            backdropFilter: 'blur(10px)'
          }}
          onClick={(e) => {
             if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
          }}
        >
          <div style={{ textAlign: 'center', color: 'white' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '40px', fontWeight: 400, opacity: 0.8 }}>Enter this code for Attendance</h2>
            <div style={{ fontSize: '120px', fontWeight: 900, letterSpacing: '20px', marginBottom: '40px' }}>
              {session.otp}
            </div>
            <p style={{ fontSize: '18px', opacity: 0.7 }}>{session.course_name}</p>
            <button 
              className="btn btn-filled" 
              style={{ marginTop: '60px', padding: '16px 40px' }}
              onClick={() => {
                const modal = document.getElementById('otp-modal');
                if (modal) modal.style.display = 'none';
              }}
            >
              Close Code
            </button>
          </div>
        </div>
        <div 
          id="qr-modal" 
          style={{ 
            display: 'none', 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            background: 'rgba(0,0,0,0.85)', 
            zIndex: 2000, 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            backdropFilter: 'blur(8px)'
          }}
          onClick={(e) => {
             if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
          }}
        >
          <div className="card" style={{ padding: '30px', textAlign: 'center', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '10px' }}>Scan for Attendance</h2>
            <p className="secondary-text" style={{ marginBottom: '30px' }}>Students: Use the &apos;Mark Attendance&apos; scanner on your dashboard.</p>
            
            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', display: 'inline-block', marginBottom: '30px' }}>
              <QRCodeSVG 
                value={JSON.stringify({
                  sessionId: sessionId,
                  type: 'attendance_session',
                  created: new Date().toISOString()
                })}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            <div style={{ fontSize: '18px', fontWeight: 600, color: '#185FA5' }}>
              {session.course_name}
            </div>
            
            <button 
              className="btn btn-filled" 
              style={{ marginTop: '20px', width: '100%' }}
              onClick={() => {
                const qrModal = document.getElementById('qr-modal');
                if (qrModal) qrModal.style.display = 'none';
              }}
            >
              Close
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => {
                const record = records[s.id]
                const isPresent = record?.status === 'present'
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar avatar-sm">{s.full_name?.charAt(0) || 'S'}</div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>{s.full_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="secondary-text">
                      <div>{s.roll_no || '—'}</div>
                      {s.registration_no && (
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{s.registration_no}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${isPresent ? 'badge-success' : record?.status === 'absent' ? 'badge-error' : 'badge-neutral'}`}>
                        {record?.status || 'Not marked'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => toggleAttendance(s.id)}
                        disabled={saving || !session.is_open}
                        className={`btn btn-sm ${isPresent ? 'btn-outlined' : 'btn-filled'}`}
                        style={isPresent ? { '--role-accent': '#C0392B' } as React.CSSProperties : { background: '#1A7A46', borderColor: '#1A7A46' }}
                      >
                        {isPresent ? 'Mark Absent' : 'Mark Present'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
