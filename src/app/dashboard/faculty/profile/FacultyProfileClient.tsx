'use client'

import React, { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase/config'
import { doc, updateDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'

export function FacultyProfileClient() {
  const { profile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    designation: profile?.designation || '',
    expertise: profile?.expertise || '',
    phone: profile?.phone || ''
  })

  async function handleUpdate() {
    if (!profile?.id) return
    try {
      await updateDoc(doc(db, 'profiles', profile.id), {
        ...form,
        updated_at: new Date().toISOString()
      })
      toast.success('Profile updated')
      setEditing(false)
    } catch (err) {
      toast.error('Update failed')
    }
  }

  return (
    <>
      <Topbar title="My Profile" accentColor="#185FA5" />
      <div className="content-container">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card" style={{ marginBottom: '24px', padding: '32px' }}>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#eee', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <img src={profile?.photo_url || `https://ui-avatars.com/api/?name=${profile?.full_name}&background=185FA5&color=fff`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{profile?.full_name}</h2>
                <div style={{ color: '#185FA5', fontWeight: 600, marginBottom: '8px' }}>{profile?.designation || 'Faculty Member'}</div>
                <p className="secondary-text" style={{ fontSize: '13px' }}>{profile?.email} · Profile Verified</p>
              </div>
              <button 
                onClick={() => setEditing(!editing)} 
                className={`btn ${editing ? 'btn-ghost' : 'btn-outlined'}`}
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
                <label className="form-label">Designation</label>
                {editing ? (
                  <input className="form-input" value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} />
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{profile?.designation || 'N/A'}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Expertise / Research Area</label>
                {editing ? (
                  <input className="form-input" value={form.expertise} onChange={e => setForm(p => ({ ...p, expertise: e.target.value }))} />
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{profile?.expertise || 'Not specified'}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                {editing ? (
                  <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{profile?.phone || 'Not provided'}</div>
                )}
              </div>
            </div>

            {editing && (
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-filled" style={{ background: '#185FA5', borderColor: '#185FA5' }} onClick={handleUpdate}>
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
             <div className="card">
                <h3 className="section-heading" style={{ fontSize: '14px', marginBottom: '16px' }}>Leave Applications</h3>
                <p className="secondary-text" style={{ fontSize: '12px', marginBottom: '16px' }}>Apply for duty leave or casual leave through the portal.</p>
                <button className="btn btn-sm btn-outlined" style={{ width: '100%', '--role-accent': '#185FA5' } as any}>New Application</button>
             </div>
             <div className="card">
                <h3 className="section-heading" style={{ fontSize: '14px', marginBottom: '16px' }}>Account Security</h3>
                <p className="secondary-text" style={{ fontSize: '12px', marginBottom: '16px' }}>Last updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Long ago'}</p>
                <button className="btn btn-sm btn-ghost" style={{ width: '100%' }}>Change Password</button>
             </div>
          </div>
        </div>
      </div>
    </>
  )
}
