'use client'

import React, { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase/config'
import { doc, updateDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'

export function AlumniProfileClient() {
  const { profile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    current_company: profile?.current_company || '',
    current_job_title: profile?.current_job_title || '',
    graduation_year: profile?.graduation_year || '',
    linkedin_url: profile?.linkedin_url || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    is_mentor: profile?.is_mentor || false
  })

  async function handleUpdate() {
    if (!profile?.id) return
    try {
      await updateDoc(doc(db, 'profiles', profile.id), {
        ...form,
        updated_at: new Date().toISOString()
      })
      toast.success('Profile updated successfully')
      setEditing(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update profile')
    }
  }

  return (
    <>
      <Topbar title="My Alumni Profile" accentColor="#854F0B" />
      <div className="content-container">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card" style={{ marginBottom: '24px', padding: '32px' }}>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#eee', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <img src={profile?.photo_url || `https://ui-avatars.com/api/?name=${profile?.full_name}&background=854F0B&color=fff`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{profile?.full_name}</h2>
                <div style={{ color: '#854F0B', fontWeight: 600, marginBottom: '8px' }}>Batch of {profile?.graduation_year}</div>
                <p className="secondary-text" style={{ fontSize: '13px' }}>{profile?.email} · Alumni Member</p>
              </div>
              <button 
                onClick={() => setEditing(!editing)} 
                className={`btn ${editing ? 'btn-ghost' : 'btn-outlined'}`}
                style={{ '--role-accent': '#854F0B' } as any}
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                {editing ? (
                  <input className="form-input" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{profile?.full_name}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Graduation Year</label>
                {editing ? (
                  <input className="form-input" type="number" value={form.graduation_year} onChange={e => setForm(p => ({ ...p, graduation_year: parseInt(e.target.value) }))} />
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{profile?.graduation_year || 'N/A'}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Current Company</label>
                {editing ? (
                  <input className="form-input" value={form.current_company} onChange={e => setForm(p => ({ ...p, current_company: e.target.value }))} />
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{profile?.current_company || 'Not specified'}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Job Title / Designation</label>
                {editing ? (
                  <input className="form-input" value={form.current_job_title} onChange={e => setForm(p => ({ ...p, current_job_title: e.target.value }))} />
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{profile?.current_job_title || 'Not specified'}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                {editing ? (
                  <input className="form-input" value={form.linkedin_url} onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))} />
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#0077B5' }}>{profile?.linkedin_url || 'None'}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">City / Location</label>
                {editing ? (
                  <input className="form-input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{profile?.city || 'Not provided'}</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--surface-secondary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>Become a Mentor</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Allow students to reach out to you for career guidance.</div>
                </div>
                <input 
                    type="checkbox" 
                    checked={form.is_mentor} 
                    onChange={e => {
                        setForm(p => ({ ...p, is_mentor: e.target.checked }))
                        if (!editing) {
                            // Instant update if not in edit mode
                            updateDoc(doc(db, 'profiles', profile!.id), { is_mentor: e.target.checked })
                            toast.success(`Mentorship ${e.target.checked ? 'enabled' : 'disabled'}`)
                        }
                    }}
                    style={{ width: '24px', height: '24px', cursor: 'pointer' }}
                />
            </div>

            {editing && (
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-filled" style={{ background: '#854F0B', borderColor: '#854F0B' }} onClick={handleUpdate}>
                  Save Profile Changes
                </button>
              </div>
            )}
          </div>

          <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
             <div className="card">
                <h3 className="section-heading" style={{ fontSize: '14px', marginBottom: '16px' }}>Shared Opportunities</h3>
                <p className="secondary-text" style={{ fontSize: '12px', marginBottom: '16px' }}>You have shared 0 job postings with the students.</p>
                <button className="btn btn-sm btn-outlined" style={{ width: '100%', '--role-accent': '#854F0B' } as any}>Post New Job</button>
             </div>
             <div className="card">
                <h3 className="section-heading" style={{ fontSize: '14px', marginBottom: '16px' }}>Verified Record</h3>
                <p className="secondary-text" style={{ fontSize: '12px', marginBottom: '16px' }}>Your graduation status has been verified by the department head.</p>
                <button className="btn btn-sm btn-ghost" style={{ width: '100%' }}>View Degree Record</button>
             </div>
          </div>
        </div>
      </div>
    </>
  )
}
