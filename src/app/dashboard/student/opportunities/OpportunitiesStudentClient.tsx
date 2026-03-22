'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  getDocs, 
  orderBy,
  limit
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'

export function OpportunitiesStudentClient() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchJobs() {
      try {
        const q = query(
          collection(db, 'job_postings'),
          orderBy('created_at', 'desc'),
          limit(20)
        )
        const snap = await getDocs(q)
        setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching jobs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Fetching latest opportunities...</div>

  return (
    <>
      <Topbar title="Opportunities" accentColor="#0F6E56" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="section-heading">Placement & Internship Postings</h2>
            <p className="secondary-text">Exclusive opportunities shared by our alumni network and department.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {jobs.map(j => (
            <div key={j.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--surface-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                        💼
                    </div>
                    <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{j.title}</h3>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{j.company} · {j.location || 'Remote'}</div>
                    </div>
                </div>
                <span className={`badge ${j.type === 'Internship' ? 'badge-info' : 'badge-success'}`}>{j.type}</span>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {j.description}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-secondary)', borderRadius: '12px', margin: '0 -4px 16px' }}>
                   <div>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Salary/Stipend</div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{j.salary || 'Competitive'}</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Apply By</div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{j.deadline ? new Date(j.deadline).toLocaleDateString() : 'ASAP'}</div>
                   </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <a href={j.apply_url} target="_blank" rel="noreferrer" className="btn btn-filled" style={{ flex: 1, textAlign: 'center', background: '#0F6E56', borderColor: '#0F6E56' }}>
                  Apply Now
                </a>
                <button className="btn btn-ghost" style={{ padding: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
             <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', background: 'var(--surface-secondary)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>No New Opportunities</h3>
                <p className="secondary-text">Check back soon for new job and internship postings.</p>
             </div>
          )}
        </div>
      </div>
    </>
  )
}
