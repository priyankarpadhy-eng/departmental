'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'

export function LiveStudentClient() {
  const { profile } = useAuth()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.batch_id) {
      setLoading(false)
      return
    }

    async function fetchSessions() {
      try {
        const q = query(
          collection(db, 'live_sessions'),
          where('batch_id', '==', profile?.batch_id),
          where('status', '==', 'active')
        )
        const snap = await getDocs(q)
        setSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching live sessions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [profile])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Checking for active classes...</div>

  return (
    <>
      <Topbar title="Join Live Class" accentColor="#0F6E56" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="section-heading">Ongoing Sessions</h2>
            <p className="secondary-text">Click join to enter the live classroom session.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {sessions.map(s => (
            <div key={s.id} className="card" style={{ borderLeft: '4px solid #0F6E56' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="badge badge-success" style={{ animation: 'pulse 2s infinite' }}>● LIVE NOW</span>
                <span className="secondary-text" style={{ fontSize: '11px' }}>Started {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{s.topic}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{s.course_name} · {s.faculty_name}</p>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <a 
                  href={s.meeting_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-filled" 
                  style={{ flex: 1, textAlign: 'center', background: '#0F6E56', borderColor: '#0F6E56' }}
                >
                  Join Meeting
                </a>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', background: 'var(--surface-secondary)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>No Active Live Classes</h3>
              <p className="secondary-text">There are currently no active live sessions for your batch.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  )
}
