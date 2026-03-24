'use client'

import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function MarkAttendanceClient() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [status, setStatus] = useState('Initializing QR Scanner...')
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [tab, setTab] = useState<'qr' | 'otp'>('qr')
  const [otpValue, setOtpValue] = useState('')
  const [submittingOtp, setSubmittingOtp] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    // 1. Fetch Active Sessions for context (optional, but good for UI)
    if (!profile?.batch_id) return

    async function fetchSessions() {
      try {
        const offQ = query(collection(db, 'course_offerings'), where('batch_id', '==', profile?.batch_id))
        const offSnap = await getDocs(offQ)
        const offeringIds = offSnap.docs.map(d => d.id)

        if (offeringIds.length === 0) return

        const sessionsQ = query(
          collection(db, 'attendance_sessions'), 
          where('offering_id', 'in', offeringIds.slice(0, 10)),
          where('is_open', '==', true)
        )
        const sessionsSnap = await getDocs(sessionsQ)
        setActiveSessions(sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('Error fetching sessions:', err)
      }
    }
    fetchSessions()
  }, [profile])

  useEffect(() => {
    // Initialize Scanner on load
    const html5QrCode = new Html5Qrcode("qr-reader")
    scannerRef.current = html5QrCode
    
    startScanner()

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Error stopping scanner", err))
      }
    }
  }, [])

  const startScanner = async () => {
    if (!scannerRef.current) return
    
    setScanning(true)
    setStatus('Ready to scan QR code')
    
    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Success Callback
          await handleScanSuccess(decodedText)
        },
        (errorMessage) => {
          // Quietly handle errors
        }
      )
    } catch (err) {
      console.error('Scanner init error:', err)
      setStatus('Could not access camera. Please check permissions.')
    }
  }

  const handleScanSuccess = async (decodedText: string) => {
    try {
      const data = JSON.parse(decodedText)
      
      if (data.type !== 'attendance_session' || !data.sessionId) {
        toast.error('Invalid QR code')
        return
      }

      // Stop scanner immediately to prevent double scan
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop()
      }
      
      setScanning(false)
      setStatus('QR Scanned! Verifying session...')
      
      await markAttendance(data.sessionId)
      
    } catch (err) {
      console.error('QR parsing error:', err)
      toast.error('Could not read QR data')
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpValue.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setSubmittingOtp(true)
    try {
      // Find the session with this OTP among active sessions
      // Since 'in' query for offeringIds is limited, we might need to broaden or refine this.
      // But for now, we'll check activeSessions first
      let session = activeSessions.find(s => s.otp === otpValue)

      if (!session) {
        // If not found in activeSessions (maybe too many offerings), search directly
        const otpQ = query(collection(db, 'attendance_sessions'), where('otp', '==', otpValue), where('is_open', '==', true))
        const otpSnap = await getDocs(otpQ)
        if (!otpSnap.empty) {
          session = { id: otpSnap.docs[0].id, ...otpSnap.docs[0].data() }
        }
      }

      if (!session) {
        toast.error('Invalid or expired OTP')
        return
      }

      await markAttendance(session.id, 'otp_code')
    } catch (err) {
      toast.error('Verification failed')
    } finally {
      setSubmittingOtp(false)
    }
  }

  const markAttendance = async (sessionId: string, method: string = 'qr_scanner') => {
    if (!user || !profile) return

    try {
      // 1. Verify session is still open
      const sessionDoc = await getDoc(doc(db, 'attendance_sessions', sessionId))
      if (!sessionDoc.exists() || !sessionDoc.data()?.is_open) {
        toast.error('This session is now closed')
        if (tab === 'qr') startScanner()
        return
      }

      const sessionData = sessionDoc.data()

      // 2. Check if student already marked
      const recordRef = doc(db, 'attendance_records', `${sessionId}_${user.uid}`)
      const recordSnap = await getDoc(recordRef)
      
      if (recordSnap.exists()) {
        toast.success('Attendance already marked')
        router.push('/dashboard/student/attendance')
        return
      }

      // 3. Mark Attendance
      setStatus('Marking attendance...')
      
      const newRecordData = {
        session_id: sessionId,
        student_id: user.uid,
        student_name: profile.full_name || 'Student',
        roll_no: profile.roll_no || 'N/A',
        registration_no: profile.registration_no || 'N/A',
        course_name: sessionData.course_name,
        batch_id: sessionData.batch_id,
        batch_name: sessionData.batch_name,
        status: 'present',
        method: method,
        marked_at: new Date().toISOString()
      }

      await setDoc(recordRef, newRecordData)

      // 4. Update Summary
      const summaryId = `${user.uid}_${sessionData.offering_id}`
      const summaryRef = doc(db, 'attendance_summary', summaryId)
      const summarySnap = await getDoc(summaryRef)
      
      if (summarySnap.exists()) {
          const sData = summarySnap.data()
          await updateDoc(summaryRef, {
              present_count: increment(1),
              total_sessions: increment(1),
              percentage: ((sData.present_count + 1) / (sData.total_sessions + 1)) * 100
          })
      } else {
          await setDoc(summaryRef, {
              student_id: user.uid,
              offering_id: sessionData.offering_id,
              present_count: 1,
              total_sessions: 1,
              percentage: 100,
              course_name: sessionData.course_name || 'Course'
          })
      }

      toast.success('Attendance marked successfully!')
      router.push('/dashboard/student/attendance')

    } catch (err) {
      console.error('Attendance error:', err)
      toast.error('Failed to mark attendance')
      if (tab === 'qr') startScanner()
    }
  }

  return (
    <>
      <Topbar title="Mark Attendance" accentColor="#0F6E56" />
      <div className="content-container">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setTab('qr')} 
                style={{ flex: 1, padding: '16px', border: 'none', background: tab === 'qr' ? 'rgba(15, 110, 86, 0.1)' : 'transparent', color: tab === 'qr' ? '#0F6E56' : 'var(--text-tertiary)', fontWeight: 600, borderBottom: tab === 'qr' ? '2px solid #0F6E56' : 'none', cursor: 'pointer' }}
              >
                Scan QR Code
              </button>
              <button 
                onClick={() => setTab('otp')} 
                style={{ flex: 1, padding: '16px', border: 'none', background: tab === 'otp' ? 'rgba(15, 110, 86, 0.1)' : 'transparent', color: tab === 'otp' ? '#0F6E56' : 'var(--text-tertiary)', fontWeight: 600, borderBottom: tab === 'otp' ? '2px solid #0F6E56' : 'none', cursor: 'pointer' }}
              >
                Enter OTP Code
              </button>
            </div>

            <div style={{ padding: '40px', textAlign: 'center' }}>
              {tab === 'qr' ? (
                <>
                  <h2 className="section-heading" style={{ marginBottom: '8px' }}>QR Code Scanner</h2>
                  <p className="secondary-text" style={{ marginBottom: '30px' }}>Position the QR code inside the frame to mark your attendance.</p>
                  
                  <div 
                    id="qr-reader" 
                    style={{ 
                      width: '100%', 
                      maxWidth: '400px', 
                      margin: '0 auto', 
                      borderRadius: '16px', 
                      overflow: 'hidden',
                      background: '#000'
                    }} 
                  />
                  <div style={{ marginTop: '30px', padding: '16px', borderRadius: '12px', background: 'var(--surface-secondary)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                          Scanner Status
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 500 }}>{status}</div>
                  </div>
                </>
              ) : (
                <form onSubmit={handleOTPSubmit} style={{ maxWidth: '320px', margin: '0 auto' }}>
                  <h2 className="section-heading" style={{ marginBottom: '8px' }}>Enter Session OTP</h2>
                  <p className="secondary-text" style={{ marginBottom: '30px' }}>Ask your faculty for the 6-digit session code.</p>
                  
                  <input 
                    type="text" 
                    maxLength={6} 
                    placeholder="000000"
                    value={otpValue}
                    onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    style={{ 
                      width: '100%', 
                      fontSize: '48px', 
                      textAlign: 'center', 
                      letterSpacing: '12px', 
                      fontWeight: 800, 
                      padding: '20px', 
                      borderRadius: '16px', 
                      border: '2px solid var(--border-color)',
                      background: 'var(--surface-secondary)',
                      color: '#0F6E56',
                      outline: 'none'
                    }}
                  />
                  <button 
                    type="submit" 
                    disabled={otpValue.length !== 6 || submittingOtp}
                    className="btn btn-filled" 
                    style={{ width: '100%', marginTop: '30px', background: '#0F6E56', borderColor: '#0F6E56', padding: '16px' }}
                  >
                    {submittingOtp ? 'Verifying...' : 'Mark Attendance'}
                  </button>
                </form>
              )}

              <button 
                  className="btn btn-ghost" 
                  style={{ marginTop: '30px' }}
                  onClick={() => router.push('/dashboard/student/attendance')}
              >
                  Cancel and Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
