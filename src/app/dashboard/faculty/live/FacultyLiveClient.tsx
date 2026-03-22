'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  deleteDoc,
  doc,
  onSnapshot
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function FacultyLiveClient() {
  const { user, profile } = useAuth()
  const [offerings, setOfferings] = useState<any[]>([])
  const [selectedOffering, setSelectedOffering] = useState<string | null>(null)
  const [activeSession, setActiveSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    
    // Fetch my offerings
    const q = query(collection(db, 'course_offerings'), where('faculty_id', '==', user.uid))
    getDocs(q).then(snap => {
      setOfferings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    // Listen for my active live session
    const liveQ = query(collection(db, 'live_sessions'), where('faculty_id', '==', user.uid))
    const unsubscribe = onSnapshot(liveQ, (snap) => {
      if (!snap.empty) {
        setActiveSession({ id: snap.docs[0].id, ...snap.docs[0].data() })
      } else {
        setActiveSession(null)
      }
    })

    return () => unsubscribe()
  }, [user])

  async function startSession() {
    if (!selectedOffering || !user) return
    const off = offerings.find(o => o.id === selectedOffering)
    
    try {
      const roomName = `dept-portal-${off.id}-${Date.now().toString().slice(-4)}`
      await addDoc(collection(db, 'live_sessions'), {
        faculty_id: user.uid,
        faculty_name: profile?.full_name,
        offering_id: selectedOffering,
        course_name: off.course_name,
        batch_id: off.batch_id,
        room_name: roomName,
        started_at: new Date().toISOString(),
      })
      
      toast.success('Live session started!')
      window.open(`https://meet.jit.si/${roomName}`, '_blank')
    } catch (err) {
      toast.error('Failed to start session')
    }
  }

  async function endSession() {
    if (!activeSession) return
    try {
      await deleteDoc(doc(db, 'live_sessions', activeSession.id))
      toast.success('Session ended')
    } catch (err) {
      toast.error('Failed to end session')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <>
      <Topbar title="Live Virtual Classroom" accentColor="#185FA5" />
      <div className="content-container">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎥</div>
            <h2 className="section-heading" style={{ fontSize: '24px', marginBottom: '8px' }}>Start a Live Lecture</h2>
            <p className="secondary-text" style={{ marginBottom: '24px' }}>
              Broadcast your screen, video, and audio to your students using the integrated Jitsi platform.
            </p>

            {activeSession ? (
              <div style={{ background: 'rgba(23, 162, 184, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid #17a2b8', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '10px', height: '10px', background: '#e74c3c', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                  <span style={{ fontWeight: 600, color: '#17a2b8' }}>LIVE NOW: {activeSession.course_name}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                   Room: {activeSession.room_name}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                   <button 
                     onClick={() => window.open(`https://meet.jit.si/${activeSession.room_name}`, '_blank')} 
                     className="btn btn-filled" 
                     style={{ flex: 1, background: '#17a2b8', borderColor: '#17a2b8' }}
                   >
                     Rejoin Room
                   </button>
                   <button 
                     onClick={endSession} 
                     className="btn btn-outlined" 
                     style={{ flex: 1, color: '#e74c3c', borderColor: '#e74c3c' }}
                   >
                     End Session
                   </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <select 
                  className="form-input" 
                  value={selectedOffering || ''} 
                  onChange={e => setSelectedOffering(e.target.value)}
                >
                  <option value="">— Select Subject to Teach —</option>
                  {offerings.map(o => (
                    <option key={o.id} value={o.id}>{o.course_name} ({o.batch_name})</option>
                  ))}
                </select>

                <button 
                  onClick={startSession} 
                  className="btn btn-filled" 
                  style={{ background: '#185FA5', borderColor: '#185FA5', height: '52px' }}
                  disabled={!selectedOffering}
                >
                  Go Live Now
                </button>
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Why use Live Classes?</h3>
            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Real-time interaction with high-fidelity audio/video.</li>
              <li>Screen sharing for slide presentations and code demos.</li>
              <li>Integrated chat and hand-raising features.</li>
              <li>No external login required for students.</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}
