'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function MentorshipStudentClient() {
  const { user, profile } = useAuth()
  const [alumni, setAlumni] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showRequest, setShowRequest] = useState<any>(null)
  const [requestText, setRequestText] = useState('')

  useEffect(() => {
    async function fetchAlumni() {
      try {
        const q = query(collection(db, 'profiles'), where('role', '==', 'alumni'))
        const snap = await getDocs(q)
        setAlumni(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        toast.error('Failed to load alumni directory')
      } finally {
        setLoading(false)
      }
    }
    fetchAlumni()
  }, [])

  const filteredAlumni = alumni.filter(a => 
    a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.designation?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSendRequest() {
    if (!user || !showRequest) return
    try {
      await addDoc(collection(db, 'mentorship_requests'), {
        student_id: user.uid,
        student_name: profile?.full_name,
        alumni_id: showRequest.id,
        alumni_name: showRequest.full_name,
        message: requestText,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      toast.success('Mentorship request sent!')
      setShowRequest(null)
      setRequestText('')
    } catch (err) {
      toast.error('Failed to send request')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading directory...</div>

  return (
    <>
      <Topbar title="Alumni Mentorship" accentColor="#5D3FD3" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="section-heading">Mentor Directory</h2>
            <p className="secondary-text">Connect with graduated seniors for career guidance.</p>
          </div>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search by name or company..." 
              className="form-input" 
              style={{ width: '300px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredAlumni.map(a => (
            <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#eee', overflow: 'hidden' }}>
                    <img src={a.photo_url || `https://ui-avatars.com/api/?name=${a.full_name}`} alt={a.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.full_name}</div>
                  <div className="secondary-text" style={{ fontSize: '12px' }}>{a.designation || 'Software Engineer'}</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--surface-secondary)', padding: '10px', borderRadius: '8px' }}>
                {a.company || 'Tech Solutions Inc.'} · Batch of {a.graduation_year}
              </div>
              <button 
                onClick={() => setShowRequest(a)}
                className="btn btn-outlined" 
                style={{ width: '100%', marginTop: 'auto', '--role-accent': '#5D3FD3' } as React.CSSProperties}
              >
                Request Mentorship
              </button>
            </div>
          ))}
          {filteredAlumni.length === 0 && <p className="secondary-text">No mentors found matching your search.</p>}
        </div>
      </div>

      {showRequest && (
        <div className="modal-overlay" onClick={() => setShowRequest(null)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <h2 className="section-heading" style={{ marginBottom: '16px' }}>Request Mentorship</h2>
            <p className="secondary-text" style={{ marginBottom: '20px' }}>
              Send a message to <strong>{showRequest.full_name}</strong>. Explain what you'd like to discuss (e.g., career, projects, or internships).
            </p>
            <textarea 
              className="form-input" 
              rows={4} 
              placeholder="Your message..."
              value={requestText}
              onChange={e => setRequestText(e.target.value)}
            ></textarea>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowRequest(null)}>Cancel</button>
              <button 
                className="btn btn-filled" 
                style={{ flex: 1, background: '#5D3FD3', borderColor: '#5D3FD3' }}
                onClick={handleSendRequest}
                disabled={!requestText.trim()}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
