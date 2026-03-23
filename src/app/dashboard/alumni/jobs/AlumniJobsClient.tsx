'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const ACCENT = '#854F0B'

const JOB_TYPES = ['Full-time', 'Internship', 'Contract', 'Freelance', 'Part-time']

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  'Full-time':  { color: '#2563EB', bg: '#EFF6FF' },
  'Internship': { color: '#7C3AED', bg: '#F5F3FF' },
  'Contract':   { color: '#D97706', bg: '#FFFBEB' },
  'Freelance':  { color: '#059669', bg: '#ECFDF5' },
  'Part-time':  { color: '#DC2626', bg: '#FEF2F2' },
}

export function AlumniJobsClient() {
  const { user, profile } = useAuth()
  const [myJobs, setMyJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newJob, setNewJob] = useState({
    title: '', company: '', type: 'Full-time',
    location: '', description: '', salary: '',
    deadline: '', apply_url: '',
  })

  useEffect(() => {
    if (!user) return
    async function fetchMyJobs() {
      try {
        // Use alumni_id (matches Firestore rule) — no orderBy to avoid index
        const q = query(collection(db, 'job_postings'), where('alumni_id', '==', user.uid))
        const snap = await getDocs(q)
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''))
        setMyJobs(data)
      } catch (err: any) {
        console.error(err)
        toast.error(err?.message || 'Failed to load your posts')
      } finally {
        setLoading(false)
      }
    }
    fetchMyJobs()
  }, [user])

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setNewJob(p => ({ ...p, [key]: e.target.value }))

  async function handlePostJob() {
    if (!user || !newJob.title || !newJob.company) return toast.error('Title and Company are required')
    setSubmitting(true)
    try {
      const data = {
        ...newJob,
        alumni_id: user.uid,           // must match Firestore rule: resource.data.alumni_id
        posted_by_name: profile?.full_name || '',
        status: 'active',
        created_at: new Date().toISOString(),
      }
      const docRef = await addDoc(collection(db, 'job_postings'), data)
      setMyJobs(prev => [{ id: docRef.id, ...data }, ...prev])
      setShowAdd(false)
      setNewJob({ title: '', company: '', type: 'Full-time', location: '', description: '', salary: '', deadline: '', apply_url: '' })
      toast.success('Job opportunity shared with students! 🎉')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this job posting? Students will no longer see it.')) return
    try {
      await deleteDoc(doc(db, 'job_postings', id))
      setMyJobs(prev => prev.filter(j => j.id !== id))
      toast.success('Post removed')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete')
    }
  }

  return (
    <>
      <Topbar title="Share Opportunities" accentColor={ACCENT} />
      <div className="content-container">

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>My Job Postings</h2>
            <p className="secondary-text" style={{ fontSize: '13px' }}>Share jobs or internships from your network and help your juniors grow.</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="btn btn-filled"
            style={{ background: ACCENT, borderColor: ACCENT, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '18px' }}>+</span> Post Opportunity
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Posted', value: myJobs.length, icon: '📋' },
            { label: 'Active Now',   value: myJobs.filter(j => j.status !== 'closed').length, icon: '✅' },
            { label: 'Students Helped', value: myJobs.length * 3, icon: '🎓' }, // illustrative
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: ACCENT }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Jobs grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading your postings…</div>
        ) : myJobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🏢</div>
            <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No Postings Yet</h3>
            <p className="secondary-text" style={{ marginBottom: '24px', fontSize: '14px' }}>Share your first job opportunity from your professional network.</p>
            <button onClick={() => setShowAdd(true)} className="btn btn-filled" style={{ background: ACCENT, borderColor: ACCENT }}>Post Your First Job</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {myJobs.map(j => {
              const tc = TYPE_COLORS[j.type] || TYPE_COLORS['Full-time']
              return (
                <div key={j.id} className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: tc.color }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '4px' }}>{j.title}</h3>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{j.company}</div>
                    </div>
                    <span style={{ background: tc.bg, color: tc.color, padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>{j.type}</span>
                  </div>

                  {j.location && (
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📍 {j.location}
                    </div>
                  )}
                  {j.description && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {j.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {j.salary && <span style={{ background: 'var(--surface-secondary)', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600 }}>💰 {j.salary}</span>}
                    {j.deadline && <span style={{ background: 'var(--surface-secondary)', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600 }}>⏰ Apply by {new Date(j.deadline).toLocaleDateString('en-IN')}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                    <div style={{ flex: 1, fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      Posted {j.created_at ? new Date(j.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                    <button className="btn btn-sm btn-ghost" style={{ color: '#DC2626', padding: '6px 14px', fontSize: '12px' }} onClick={() => handleDelete(j.id)}>
                      🗑 Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Post Job Modal ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Post a New Opportunity</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)} style={{ padding: '6px 12px' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Position Title *', key: 'title', placeholder: 'e.g. Civil Site Engineer' },
                { label: 'Company Name *',   key: 'company', placeholder: 'e.g. Larsen & Toubro' },
                { label: 'Location',         key: 'location', placeholder: 'e.g. Remote / Bhubaneswar' },
                { label: 'Salary / Stipend', key: 'salary', placeholder: 'e.g. ₹6 LPA / ₹15,000/mo' },
                { label: 'Apply Deadline',   key: 'deadline', placeholder: '', type: 'date' },
                { label: 'Application URL',  key: 'apply_url', placeholder: 'https://...' },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input type={f.type || 'text'} className="form-input" placeholder={f.placeholder}
                    value={(newJob as any)[f.key]} onChange={set(f.key)} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Job Type</label>
                <select className="form-input" value={newJob.type} onChange={set('type')}>
                  {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Description & Requirements</label>
              <textarea className="form-input" rows={4} placeholder="Key skills, responsibilities, and requirements…"
                value={newJob.description} onChange={set('description')} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)} disabled={submitting}>Cancel</button>
              <button className="btn btn-filled" style={{ flex: 1, background: ACCENT, borderColor: ACCENT }} onClick={handlePostJob} disabled={submitting}>
                {submitting ? 'Posting…' : '🚀 Share with Students'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
