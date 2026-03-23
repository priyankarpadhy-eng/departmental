'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [departments, setDepartments] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    dept_id: 'CE',
    batch_id: '',
    roll_no: '',
    registration_no: '',
    designation: '',
    graduation_year: '',
    current_company: '',
    current_job_title: ''
  })

  useEffect(() => {
    if (profile?.verification_status === 'verified') {
       router.replace('/dashboard/' + profile.role)
    }
    if (profile) {
      setForm(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        dept_id: profile.dept_id || '',
        batch_id: profile.batch_id || '',
        roll_no: profile.roll_no || '',
        registration_no: profile.registration_no || '',
        designation: profile.designation || '',
        graduation_year: profile.graduation_year?.toString() || '',
        current_company: profile.current_company || '',
        current_job_title: profile.current_job_title || ''
      }))
    }
  }, [profile])

  useEffect(() => {
    async function fetchData() {
      try {
        const [deptSnap, batchSnap] = await Promise.all([
          getDocs(collection(db, 'departments')),
          getDocs(collection(db, 'batches'))
        ])
        setDepartments(deptSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setBatches(batchSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
      } finally {
        setDataLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      const updateData: any = {
        full_name: form.full_name,
        phone: form.phone,
        dept_id: form.dept_id,
        verification_status: 'pending',
        updated_at: new Date().toISOString()
      }

      if (profile?.role === 'student') {
        updateData.batch_id = form.batch_id
        updateData.roll_no = form.roll_no
        updateData.registration_no = form.registration_no
      } else if (profile?.role === 'faculty') {
        updateData.designation = form.designation
      } else if (profile?.role === 'alumni') {
        updateData.graduation_year = Number(form.graduation_year)
        updateData.current_company = form.current_company
        updateData.current_job_title = form.current_job_title
      }

      await updateDoc(doc(db, 'profiles', user.uid), updateData)
      toast.success('Profile updated and verification request sent!')
      window.location.reload() // Refresh to update AuthContext
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || dataLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading profile setup...</div>
  if (!user || !profile) return <div>Auth required.</div>

  if (profile.verification_status === 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="card card-lg" style={{ maxWidth: '480px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h1 className="page-title">Verification Pending</h1>
          <p className="secondary-text" style={{ marginBottom: '24px' }}>
            Thanks, <strong>{profile.full_name}</strong>! Your profile is being reviewed by the department admins. We'll grant you access once verified.
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-outlined" style={{ width: '100%' }}>Check Status</button>
          <button onClick={() => { auth.signOut(); router.push('/login'); }} className="btn btn-ghost" style={{ width: '100%', marginTop: '10px' }}>Sign Out</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card card-lg" style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 className="page-title">Setup your profile</h1>
          <p className="secondary-text">Fill in your details to request access to the {profile.role} dashboard.</p>
        </div>

        {profile.verification_status === 'rejected' && (
          <div style={{ padding: '12px', background: 'rgba(231, 76, 60, 0.1)', border: '1px solid #E74C3C', borderRadius: '8px', color: '#E74C3C', fontSize: '13px', marginBottom: '20px' }}>
            <strong>Verification Rejected:</strong> {profile.rejection_reason || 'Please check your details and try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" required value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <select className="form-input" required value={form.dept_id} onChange={e => setForm(p => ({ ...p, dept_id: e.target.value }))}>
              <option value="">— Select Department —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {profile.role === 'student' && (
            <>
              <div className="form-group">
                <label className="form-label">Batch</label>
                <select className="form-input" required value={form.batch_id} onChange={e => setForm(p => ({ ...p, batch_id: e.target.value }))}>
                  <option value="">— Select Batch —</option>
                  {batches.filter(b => !form.dept_id || b.dept_id === form.dept_id).map(b => (
                    <option key={b.id} value={b.id}>{b.graduation_year} — Sec {b.section}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input className="form-input" required value={form.roll_no} onChange={e => setForm(p => ({ ...p, roll_no: e.target.value }))} placeholder="e.g. 2101105001" />
              </div>
              <div className="form-group">
                <label className="form-label">Registration Number</label>
                <input className="form-input" required value={form.registration_no} onChange={e => setForm(p => ({ ...p, registration_no: e.target.value }))} placeholder="e.g. 2101105001" />
              </div>
            </>
          )}

          {profile.role === 'faculty' && (
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input className="form-input" required value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} placeholder="e.g. Assistant Professor" />
            </div>
          )}

          {profile.role === 'alumni' && (
            <>
              <div className="form-group">
                <label className="form-label">Graduation Year</label>
                <input type="number" className="form-input" required value={form.graduation_year} onChange={e => setForm(p => ({ ...p, graduation_year: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Current Company</label>
                <input className="form-input" value={form.current_company} onChange={e => setForm(p => ({ ...p, current_company: e.target.value }))} placeholder="e.g. Google, TCS" />
              </div>
              <div className="form-group">
                <label className="form-label">Current Job Title</label>
                <input className="form-input" value={form.current_job_title} onChange={e => setForm(p => ({ ...p, current_job_title: e.target.value }))} placeholder="e.g. Software Engineer" />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 ..." />
          </div>

          <button type="submit" className="btn btn-filled btn-lg" disabled={loading} style={{ background: 'var(--text-primary)', borderColor: 'var(--text-primary)', marginTop: '8px' }}>
            {loading ? 'Submitting...' : 'Request Verification'}
          </button>
          
          <button type="button" onClick={() => auth.signOut()} className="btn btn-ghost" style={{ fontSize: '12px' }}>Sign Out</button>
        </form>
      </div>
    </div>
  )
}

import { auth } from '@/lib/firebase/config'
