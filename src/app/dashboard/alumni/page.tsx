'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { doc, collection, query, where, orderBy, limit, getDocs, getDoc } from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'

export default function AlumniDashboard() {
  const { profile, user } = useAuth()
  const [alumniProfile, setAlumniProfile] = useState<any>(null)
  const [myJobs, setMyJobs] = useState<any[]>([])
  const [mentorshipReqs, setMentorshipReqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile || !user || profile.role !== 'alumni') return

    async function fetchData() {
      if (!user) return
      try {
        const [
          alumniSnap,
          jobsSnap,
          mentorshipSnap
        ] = await Promise.all([
          getDoc(doc(db, 'alumni_profiles', user.uid)),
          getDocs(query(collection(db, 'job_postings'), where('alumni_id', '==', user.uid), orderBy('created_at', 'desc'), limit(5))),
          getDocs(query(collection(db, 'mentorship_requests'), where('alumni_id', '==', user.uid), where('status', '==', 'pending'), limit(5)))
        ])

        setAlumniProfile(alumniSnap.exists() ? alumniSnap.data() : null)
        setMyJobs(jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        setMentorshipReqs(mentorshipSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching alumni dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [profile, user])

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading alumni overview...</div>
  }

  return (
    <>
      <Topbar title="Alumni overview" accentColor="#854F0B" />
      <div className="content-container">
        {/* Verification Alert */}
        {profile?.verification_status !== 'verified' && (
          <div style={{
            background: profile?.verification_status === 'rejected' ? 'var(--status-error-bg)' : 'rgba(234, 179, 8, 0.1)',
            border: `1px solid ${profile?.verification_status === 'rejected' ? 'var(--status-error)' : 'var(--accent-hod)'}`,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: profile?.verification_status === 'rejected' ? 'var(--status-error)' : 'var(--accent-hod)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              {profile?.verification_status === 'rejected' ? '❌' : '⏳'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: profile?.verification_status === 'rejected' ? 'var(--status-error)' : 'var(--text-primary)' }}>
                {profile?.verification_status === 'rejected' ? 'Account Verification Rejected' : 'Account Verification Required'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {profile?.verification_status === 'rejected' 
                  ? `Your request was rejected: ${profile.rejection_reason || 'Please update your details.'}`
                  : profile?.verification_status === 'pending'
                  ? 'Your profile is currently under review by the administration.'
                  : 'Please complete your profile and request verification to access all features.'
                }
              </p>
            </div>
            <Link href="/onboarding" className="btn btn-filled" style={{ background: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {profile?.verification_status === 'rejected' || !profile?.verification_status ? 'Update Profile' : 'View Details'}
            </Link>
          </div>
        )}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="avatar avatar-xl" style={{ background: 'var(--accent-alumni-bg)', color: '#854F0B', fontSize: '24px' }}>
              {(profile && profile.full_name || 'A').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div className="page-title">{profile && profile.full_name}</div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                {alumniProfile && alumniProfile.current_company && (
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    🏢 {alumniProfile.job_title} at {alumniProfile.current_company}
                  </span>
                )}
                {alumniProfile && alumniProfile.city && (
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📍 {alumniProfile.city}</span>
                )}
                {profile && profile.graduation_year && (
                  <span className="badge badge-warning">Class of {profile.graduation_year}</span>
                )}
                {alumniProfile && alumniProfile.is_mentor && (
                  <span className="badge badge-success">Available as mentor</span>
                )}
              </div>
            </div>
            <Link href="/dashboard/alumni/profile" className="btn btn-outlined" style={{ '--role-accent': '#854F0B' } as React.CSSProperties}>Edit profile</Link>
          </div>
        </div>

        {!alumniProfile && (
          <div style={{ background: 'var(--accent-alumni-bg)', border: '1px solid rgba(133,79,11,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#854F0B', marginBottom: '4px' }}>Complete your alumni profile</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Add your current company, job title, and city to appear in the alumni directory and help current students.
            </div>
            <Link href="/dashboard/alumni/profile" className="btn btn-sm btn-filled" style={{ background: '#854F0B', borderColor: '#854F0B' }}>Set up profile →</Link>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card">
            <div className="section-row">
              <h2 className="section-heading">Mentorship requests</h2>
              <Link href="/dashboard/alumni/mentorship" style={{ fontSize: '12px', color: '#854F0B', textDecoration: 'none' }}>View all →</Link>
            </div>
            {mentorshipReqs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mentorshipReqs.map((req: any) => (
                  <div key={req.id} style={{ padding: '12px', background: 'var(--surface-secondary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{req.student_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0' }}>{(req.message || '').slice(0, 80)}…</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button className="btn btn-sm btn-filled" style={{ background: '#0F6E56', borderColor: '#0F6E56', fontSize: '11px' }}>Accept</button>
                      <button className="btn btn-sm btn-ghost" style={{ fontSize: '11px' }}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><p className="secondary-text">No pending mentorship requests</p></div>
            )}
          </div>

          <div className="card">
            <div className="section-row">
              <h2 className="section-heading">My job postings</h2>
              <Link href="/dashboard/alumni/jobs" style={{ fontSize: '12px', color: '#854F0B', textDecoration: 'none' }}>Manage →</Link>
            </div>
            {myJobs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myJobs.map((job: any) => (
                  <div key={job.id} style={{ padding: '10px 12px', background: 'var(--surface-secondary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{job.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {job.company} · Expires {job.expires_at?.toDate ? job.expires_at.toDate().toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p className="secondary-text" style={{ marginBottom: '12px' }}>No job postings yet</p>
                <Link href="/dashboard/alumni/jobs" className="btn btn-sm btn-outlined" style={{ '--role-accent': '#854F0B' } as React.CSSProperties}>Post a job</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
