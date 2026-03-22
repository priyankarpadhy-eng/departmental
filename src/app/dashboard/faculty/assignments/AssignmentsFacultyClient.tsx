'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { db, storage } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { Assignment, Submission } from '@/types'

export function AssignmentsFacultyClient() {
  const { user, profile } = useAuth()
  const [offerings, setOfferings] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Create form state
  const [newAssignment, setNewAssignment] = useState({
    offering_id: '',
    title: '',
    description: '',
    due_date: '',
    max_marks: 10,
    file: null as File | null
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!profile || !user) return

    async function fetchData() {
      try {
        const offQ = query(collection(db, 'course_offerings'), where('faculty_id', '==', user?.uid))
        const offSnap = await getDocs(offQ)
        const offList = offSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setOfferings(offList)

        const assQ = query(collection(db, 'assignments'), where('faculty_id', '==', user?.uid), orderBy('created_at', 'desc'))
        const assSnap = await getDocs(assQ)
        setAssignments(assSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setCreating(true)

    try {
      let fileUrl = null
      if (newAssignment.file) {
        const storageRef = ref(storage, `assignments/${Date.now()}_${newAssignment.file.name}`)
        await uploadBytes(storageRef, newAssignment.file)
        fileUrl = await getDownloadURL(storageRef)
      }

      const selectedOff = offerings.find(o => o.id === newAssignment.offering_id)

      const assignmentData = {
        faculty_id: user.uid,
        offering_id: newAssignment.offering_id,
        course_name: selectedOff?.course_name || '',
        batch_id: selectedOff?.batch_id || '',
        title: newAssignment.title,
        description: newAssignment.description,
        due_date: new Date(newAssignment.due_date).toISOString(),
        max_marks: Number(newAssignment.max_marks),
        file_url: fileUrl,
        created_at: new Date().toISOString()
      }

      const docRef = await addDoc(collection(db, 'assignments'), assignmentData)
      setAssignments(prev => [{ id: docRef.id, ...assignmentData }, ...prev])
      toast.success('Assignment created!')
      setShowCreate(false)
      setNewAssignment({ offering_id: '', title: '', description: '', due_date: '', max_marks: 10, file: null })
    } catch (err: any) {
      toast.error('Failed to create assignment')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <>
      <Topbar title="Manage Assignments" accentColor="#185FA5" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="section-heading">All Assignments</h2>
            <p className="secondary-text">{assignments.length} assignments created</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-filled" style={{ background: '#185FA5', borderColor: '#185FA5' }}>
            Create Assignment
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {assignments.map(a => (
            <div key={a.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{a.title}</h3>
                <span className="badge badge-info">{a.course_name}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                Due: {new Date(a.due_date).toLocaleDateString()} · Marks: {a.max_marks}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href={`/dashboard/faculty/assignments/evaluation?id=${a.id}`} className="btn btn-sm btn-outlined" style={{ flex: 1, '--role-accent': '#185FA5' } as React.CSSProperties}>
                  View Submissions
                </Link>
              </div>
            </div>
          ))}
          {assignments.length === 0 && <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}><p className="secondary-text">No assignments created yet.</p></div>}
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%' }}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>New Assignment</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Course / Offering</label>
                <select className="form-input" required value={newAssignment.offering_id} onChange={e => setNewAssignment(p => ({ ...p, offering_id: e.target.value }))}>
                  <option value="">Select a course</option>
                  {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} ({o.batch_name})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" required value={newAssignment.title} onChange={e => setNewAssignment(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={newAssignment.description} onChange={e => setNewAssignment(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="datetime-local" className="form-input" required value={newAssignment.due_date} onChange={e => setNewAssignment(p => ({ ...p, due_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Marks</label>
                  <input type="number" className="form-input" required value={newAssignment.max_marks} onChange={e => setNewAssignment(p => ({ ...p, max_marks: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Supporting File (Optional)</label>
                <input type="file" className="form-input" onChange={e => setNewAssignment(p => ({ ...p, file: e.target.files?.[0] || null }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-filled" style={{ flex: 1, background: '#185FA5', borderColor: '#185FA5' }} disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
