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
  orderBy
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function AlumniJobsClient() {
  const { user, profile } = useAuth()
  const [myJobs, setMyJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    type: 'Full-time',
    location: '',
    description: '',
    salary: '',
    deadline: '',
    apply_url: ''
  })

  useEffect(() => {
    if (!user) return
    async function fetchMyJobs() {
      try {
        const q = query(
          collection(db, 'job_postings'),
          where('posted_by_id', '==', user.uid),
          orderBy('created_at', 'desc')
        )
        const snap = await getDocs(q)
        setMyJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        toast.error('Failed to load your posts')
      } finally {
        setLoading(false)
      }
    }
    fetchMyJobs()
  }, [user])

  async function handlePostJob() {
    if (!user || !newJob.title || !newJob.company) return
    try {
      const data = {
        ...newJob,
        posted_by_id: user.uid,
        posted_by_name: profile?.full_name,
        created_at: new Date().toISOString()
      }
      const docRef = await addDoc(collection(db, 'job_postings'), data)
      setMyJobs(prev => [{ id: docRef.id, ...data }, ...prev])
      setShowAdd(false)
      setNewJob({ title: '', company: '', type: 'Full-time', location: '', description: '', salary: '', deadline: '', apply_url: '' })
      toast.success('Job opportunity shared with students!')
    } catch (err) {
      toast.error('Failed to post')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure?')) return
    try {
      await deleteDoc(doc(db, 'job_postings', id))
      setMyJobs(prev => prev.filter(j => j.id !== id))
      toast.success('Post removed')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading your posts...</div>

  return (
    <>
      <Topbar title="Share Opportunities" accentColor="#854F0B" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="section-heading">My Job Postings</h2>
            <p className="secondary-text">Help your juniors by sharing jobs or internships from your network.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn btn-filled" style={{ background: '#854F0B', borderColor: '#854F0B' }}>
            + Post Opportunity
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Job Title</th>
                        <th>Company</th>
                        <th>Type</th>
                        <th>Created</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {myJobs.map(j => (
                        <tr key={j.id}>
                            <td style={{ fontWeight: 500 }}>{j.title}</td>
                            <td className="secondary-text">{j.company}</td>
                            <td><span className="badge badge-neutral">{j.type}</span></td>
                            <td className="secondary-text">{new Date(j.created_at).toLocaleDateString()}</td>
                            <td><span className="badge badge-success">Active</span></td>
                            <td>
                                <button className="btn btn-sm btn-ghost" style={{ color: '#E74C3C' }} onClick={() => handleDelete(j.id)}>Remove</button>
                            </td>
                        </tr>
                    ))}
                    {myJobs.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }} className="secondary-text">You haven't shared any jobs yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
           <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <h2 className="section-heading" style={{ marginBottom: '20px' }}>Post Opportunity</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                    <label className="form-label">Position Title</label>
                    <input className="form-input" placeholder="e.g. Software Engineer Intern" value={newJob.title} onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input className="form-input" placeholder="e.g. Google" value={newJob.company} onChange={e => setNewJob(p => ({ ...p, company: e.target.value }))} />
                </div>
                <div className="form-group">
                    <label className="form-label">Job Type</label>
                    <select className="form-input" value={newJob.type} onChange={e => setNewJob(p => ({ ...p, type: e.target.value }))}>
                        <option>Full-time</option>
                        <option>Internship</option>
                        <option>Contract</option>
                        <option>Freelance</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" placeholder="e.g. Remote / Bangalore" value={newJob.location} onChange={e => setNewJob(p => ({ ...p, location: e.target.value }))} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Description & Requirements</label>
                <textarea className="form-input" rows={4} placeholder="Key skills and job summary..." value={newJob.description} onChange={e => setNewJob(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Application URL / Email</label>
                <input className="form-input" placeholder="https://..." value={newJob.apply_url} onChange={e => setNewJob(p => ({ ...p, apply_url: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-filled" style={{ flex: 1, background: '#854F0B', borderColor: '#854F0B' }} onClick={handlePostJob}>Share with Students</button>
              </div>
           </div>
        </div>
      )}
    </>
  )
}
