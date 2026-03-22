'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  where,
  orderBy
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { logAction } from '@/lib/logAction'

export function AdminOfferingsClient() {
  const [offerings, setOfferings] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [faculties, setFaculties] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [facultyFilter, setFacultyFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')

  const [form, setForm] = useState({
    course_id: '',
    faculty_id: '',
    batch_id: '',
    semester_id: '',
    room: ''
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [offSnap, courseSnap, facultySnap, batchSnap, semSnap] = await Promise.all([
          getDocs(query(collection(db, 'course_offerings'), orderBy('created_at', 'desc'))),
          getDocs(query(collection(db, 'courses'), orderBy('name'))),
          getDocs(query(collection(db, 'profiles'), where('role', '==', 'faculty'))),
          getDocs(query(collection(db, 'batches'), orderBy('graduation_year', 'desc'))),
          getDocs(query(collection(db, 'semesters'), orderBy('created_at', 'desc')))
        ])
        
        setOfferings(offSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setCourses(courseSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setFaculties(facultySnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
        setBatches(batchSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setSemesters(semSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
        toast.error('Failed to load offering data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredOfferings = useMemo(() => {
    return offerings.filter(o => {
      const matchesSearch = !searchTerm || 
        o.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.faculty_name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesBatch = !batchFilter || o.batch_id === batchFilter
      const matchesFaculty = !facultyFilter || o.faculty_id === facultyFilter
      const matchesSemester = !semesterFilter || o.semester_id === semesterFilter
      
      return matchesSearch && matchesBatch && matchesFaculty && matchesSemester
    })
  }, [offerings, searchTerm, batchFilter, facultyFilter, semesterFilter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const course = courses.find(c => c.id === form.course_id)
      const faculty = faculties.find(f => f.id === form.faculty_id)
      const batch = batches.find(b => b.id === form.batch_id)
      const sem = semesters.find(s => s.id === form.semester_id)

      const data = {
        ...form,
        course_name: course?.name,
        course_code: course?.code,
        faculty_name: faculty?.full_name,
        batch_name: batch?.name || `${batch?.graduation_year} Sec ${batch?.section}`,
        semester_name: sem?.name,
        created_at: new Date().toISOString()
      }
      
      const docRef = await addDoc(collection(db, 'course_offerings'), data)
      setOfferings(prev => [{ id: docRef.id, ...data }, ...prev])
      
      await logAction({
        action: 'created',
        module: 'offerings',
        description: `Assigned ${faculty?.full_name} to teach ${course?.name} for batch ${data.batch_name}`,
        targetTable: 'course_offerings',
        targetId: docRef.id,
        newValue: data
      })

      toast.success('Assignment confirmed')
      setShowCreate(false)
      setForm({ course_id: '', faculty_id: '', batch_id: '', semester_id: '', room: '' })
    } catch (err) {
      toast.error('Assignment failed')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this course assignment?')) return
    try {
      await deleteDoc(doc(db, 'course_offerings', id))
      setOfferings(prev => prev.filter(o => o.id !== id))
      toast.success('Assignment removed')
      
      await logAction({
        action: 'deleted',
        module: 'offerings',
        description: `Removed course assignment ID: ${id}`,
        targetTable: 'course_offerings',
        targetId: id
      })
    } catch (e) {
      toast.error('Failed to delete assignment')
    }
  }

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}><div className="loader" style={{ margin: 'auto' }}></div></div>

  return (
    <>
      <Topbar title="Faculty Assignments" accentColor="#E24B4A" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="section-heading">Teacher & Batch Assignments</h2>
            <p className="secondary-text">Map faculties to courses, batches, and semesters</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-filled" style={{ background: '#E24B4A', borderColor: '#E24B4A' }}>
            + Create New Assignment
          </button>
        </div>

        {/* Filter Bar */}
        <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '12px' }}>
                <div className="search-input">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="var(--text-tertiary)" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <input 
                        placeholder="Search course or teacher..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select className="form-input" value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
                    <option value="">All Batches</option>
                    {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name || `${b.graduation_year} — ${b.section}`}</option>
                    ))}
                </select>
                <select className="form-input" value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)}>
                    <option value="">All Faculties</option>
                    {faculties.map(f => (
                        <option key={f.id} value={f.id}>{f.full_name}</option>
                    ))}
                </select>
                <select className="form-input" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)}>
                    <option value="">All Semesters</option>
                    {semesters.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Teacher / Faculty</th>
                <th>Batch & Section</th>
                <th>Semester</th>
                <th>Room</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOfferings.map(o => (
                <tr key={o.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.course_name}</div>
                    <div className="secondary-text" style={{ fontSize: '11px' }}>{o.course_code}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar avatar-sm">{(o.faculty_name || 'F').charAt(0)}</div>
                        <div style={{ fontWeight: 500 }}>{o.faculty_name}</div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{o.batch_name}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{o.semester_name}</div>
                  </td>
                  <td className="secondary-text">
                    {o.room || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Not assigned</span>}
                  </td>
                  <td>
                    <button 
                        className="btn btn-sm btn-ghost" 
                        title="Remove Assignment"
                        style={{ color: '#E74C3C' }}
                        onClick={() => handleDelete(o.id)}
                    >
                        Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOfferings.length === 0 && (
                <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '60px' }}>
                        <div className="secondary-text">No active assignments found matching filters.</div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="section-heading">New Faculty Assignment</h2>
                <button onClick={() => setShowCreate(false)} className="btn btn-ghost" style={{ padding: '4px' }}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Subject / Course</label>
                <select className="form-input" required value={form.course_id} onChange={e => setForm(p => ({ ...p, course_id: e.target.value }))}>
                  <option value="">— Select Course —</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Teacher / Faculty Member</label>
                <select className="form-input" required value={form.faculty_id} onChange={e => setForm(p => ({ ...p, faculty_id: e.target.value }))}>
                  <option value="">— Select Faculty —</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                    <label className="form-label">Target Batch & Section</label>
                    <select className="form-input" required value={form.batch_id} onChange={e => setForm(p => ({ ...p, batch_id: e.target.value }))}>
                    <option value="">— Select —</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name || `${b.graduation_year} Sec ${b.section}`}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select className="form-input" required value={form.semester_id} onChange={e => setForm(p => ({ ...p, semester_id: e.target.value }))}>
                    <option value="">— Select —</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.academic_year})</option>)}
                    </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Venue / Room Number (Optional)</label>
                <input className="form-input" value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} placeholder="e.g. Hall 1, Room 203" />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-outlined" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-filled" style={{ flex: 1, background: '#E24B4A', borderColor: '#E24B4A' }} disabled={creating}>
                  {creating ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
