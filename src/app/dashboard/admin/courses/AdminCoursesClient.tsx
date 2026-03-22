'use client'

import React, { useState, useEffect } from 'react'
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

export function AdminCoursesClient() {
  const [courses, setCourses] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('')
  const [semesterMappings, setSemesterMappings] = useState<string[]>([]) // Array of course IDs
  
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [savingMapping, setSavingMapping] = useState(false)

  const [form, setForm] = useState({
    name: '',
    code: '',
    credits: 4,
    dept_id: 'CE',
    description: ''
  })

  useEffect(() => {
    async function fetchData() {
      // 1. Check cache for instant load
      const cached = sessionStorage.getItem('cache_admin_courses_data')
      if (cached) {
        const decoded = JSON.parse(cached)
        setCourses(decoded.courses || [])
        setDepartments(decoded.departments || [])
        setSemesters(decoded.semesters || [])
        setLoading(false)
      }

      try {
        const [courseSnap, deptSnap, semSnap] = await Promise.all([
          getDocs(collection(db, 'courses')),
          getDocs(collection(db, 'departments')),
          getDocs(query(collection(db, 'semesters'), orderBy('created_at', 'desc')))
        ])
        
        const freshCourses = courseSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const freshDepts = deptSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const freshSems = semSnap.docs.map(d => ({ id: d.id, ...d.data() }))

        setCourses(freshCourses)
        setDepartments(freshDepts)
        setSemesters(freshSems)

        // 2. Update cache
        sessionStorage.setItem('cache_admin_courses_data', JSON.stringify({
          courses: freshCourses,
          departments: freshDepts,
          semesters: freshSems,
          updatedAt: new Date().toISOString()
        }))
      } catch (err) {
        if (!cached) toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!selectedSemesterId) {
        setSemesterMappings([])
        return
    }

    async function fetchMappings() {
        try {
            const q = query(collection(db, 'semester_course_mappings'), where('semester_id', '==', selectedSemesterId))
            const snap = await getDocs(q)
            setSemesterMappings(snap.docs.map(d => d.data().course_id))
        } catch (e) {
            console.error(e)
        }
    }
    fetchMappings()
  }, [selectedSemesterId])

  async function handleToggleCourseMapping(courseId: string) {
    if (!selectedSemesterId) {
        toast.error('Please select a semester first')
        return
    }

    const isCurrentlyMapped = semesterMappings.includes(courseId)
    setSavingMapping(true)

    try {
        if (isCurrentlyMapped) {
            // Remove mapping
            const q = query(
                collection(db, 'semester_course_mappings'), 
                where('semester_id', '==', selectedSemesterId),
                where('course_id', '==', courseId)
            )
            const snap = await getDocs(q)
            const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'semester_course_mappings', d.id)))
            await Promise.all(deletePromises)
            setSemesterMappings(prev => prev.filter(id => id !== courseId))
            toast.success('Course removed from semester')
        } else {
            // Add mapping
            const mappingData = {
                semester_id: selectedSemesterId,
                course_id: courseId,
                created_at: new Date().toISOString()
            }
            await addDoc(collection(db, 'semester_course_mappings'), mappingData)
            setSemesterMappings(prev => [...prev, courseId])
            toast.success('Course added to semester')
        }

        await logAction({
            action: 'updated',
            module: 'courses',
            description: `${isCurrentlyMapped ? 'Removed' : 'Added'} course mapping for semester: ${semesters.find(s => s.id === selectedSemesterId)?.name}`,
            targetTable: 'semester_course_mappings'
        })
    } catch (e) {
        toast.error('Failed to update mapping')
    } finally {
        setSavingMapping(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const data = {
        ...form,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const docRef = await addDoc(collection(db, 'courses'), data)
      setCourses(prev => [...prev, { id: docRef.id, ...data }])
      
      await logAction({
        action: 'created',
        module: 'courses',
        description: `Created course: ${form.name} (${form.code})`,
        targetTable: 'courses',
        targetId: docRef.id,
        newValue: data
      })

      toast.success('Course created')
      setShowCreate(false)
      setForm({ name: '', code: '', credits: 4, dept_id: '', description: '' })
    } catch (err) {
      toast.error('Creation failed')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}><div className="loader" style={{ margin: 'auto' }}></div></div>

  return (
    <>
      <Topbar title="Courses Catalogue" accentColor="#E24B4A" />
      <div className="content-container">
        
        {/* Semester Selection & Mapping Logic */}
        <div className="card" style={{ marginBottom: '24px', background: '#F9FAFB', border: '1px dashed #D1D5DB' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Assign Courses to Semester</h3>
                    <p className="secondary-text" style={{ fontSize: '12px' }}>Pick a semester to manage its current study plan</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select 
                        className="form-input" 
                        style={{ width: '240px', background: 'white' }}
                        value={selectedSemesterId} 
                        onChange={e => setSelectedSemesterId(e.target.value)}
                    >
                        <option value="">— Select Semester —</option>
                        {semesters.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.academic_year})</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        <div className="section-row" style={{ marginBottom: '20px' }}>
            <div>
                <h2 className="section-heading">All Courses</h2>
                <p className="secondary-text">
                    {selectedSemesterId 
                        ? `Managing courses for ${semesters.find(s => s.id === selectedSemesterId)?.name}` 
                        : 'Define academic syllabus and credit structures'
                    }
                </p>
            </div>
            <button onClick={() => setShowCreate(true)} className="btn btn-filled" style={{ background: '#E24B4A', borderColor: '#E24B4A' }}>
                + Define New Course
            </button>
        </div>

        <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
            <thead>
                <tr>
                {selectedSemesterId && <th style={{ width: '40px' }}>Mapping</th>}
                <th>Course Name</th>
                <th>Code</th>
                <th>Credits</th>
                {!selectedSemesterId && <th>Actions</th>}
                </tr>
            </thead>
            <tbody>
                {courses.map(c => {
                const dept = departments.find(d => d.id === c.dept_id)
                const isMapped = semesterMappings.includes(c.id)
                return (
                    <tr key={c.id} style={selectedSemesterId && isMapped ? { background: '#F0FDF4' } : {}}>
                    {selectedSemesterId && (
                        <td>
                            <input 
                                type="checkbox" 
                                checked={isMapped} 
                                onChange={() => handleToggleCourseMapping(c.id)}
                                disabled={savingMapping}
                                style={{ transform: 'scale(1.2)', accentColor: '#22C55E' }}
                            />
                        </td>
                    )}
                    <td>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        <div className="secondary-text" style={{ fontSize: '11px' }}>{c.description?.slice(0, 60)}...</div>
                    </td>
                    <td><span className="badge badge-neutral">{c.code}</span></td>
                    <td><span className="badge badge-info">{c.credits} Credits</span></td>
                    {!selectedSemesterId && (
                        <td>
                            <button className="btn btn-sm btn-ghost">Edit</button>
                        </td>
                    )}
                    </tr>
                )
                })}
            </tbody>
            </table>
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>New Course</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Course Name</label>
                <input className="form-input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Data Structures & Algorithms" />
              </div>
              <div className="form-group">
                <label className="form-label">Course Code</label>
                <input className="form-input" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. CS201" />
              </div>
              <div className="form-group">
                <label className="form-label">Credits</label>
                <input type="number" className="form-input" required value={form.credits} onChange={e => setForm(p => ({ ...p, credits: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-filled" style={{ flex: 1, background: '#E24B4A', borderColor: '#E24B4A' }} disabled={creating}>
                  {creating ? 'Saving...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
