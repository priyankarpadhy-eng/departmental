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
  orderBy,
  where
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { logAction } from '@/lib/logAction'

export function AdminBatchesClient() {
  const [batches, setBatches] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  // Student management state
  const [showManage, setShowManage] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([])
  const [savingStudents, setSavingStudents] = useState(false)

  const [form, setForm] = useState({
    name: '',
    graduation_year: new Date().getFullYear() + 3,
    section: 'A',
    dept_id: 'CE', // Fixed Department ID
    current_semester_id: '',
    createDual: true // Default to true as per user request
  })

  useEffect(() => {
    async function fetchData() {
      // 1. Check Cache first for instant load
      const cached = sessionStorage.getItem('cache_admin_batches_data')
      if (cached) {
        const decoded = JSON.parse(cached)
        setBatches(decoded.batches || [])
        setDepartments(decoded.departments || [])
        setSemesters(decoded.semesters || [])
        setLoading(false)
      }

      try {
        const [batchSnap, deptSnap, semSnap] = await Promise.all([
          getDocs(collection(db, 'batches')),
          getDocs(query(collection(db, 'departments'), orderBy('name'))),
          getDocs(query(collection(db, 'semesters'), orderBy('created_at', 'desc')))
        ])
        
        const rawBatches = batchSnap.docs.map(d => ({ id: d.id, ...d.data() } as any))
        const sortedBatches = rawBatches.sort((a, b) => {
          if (b.graduation_year !== a.graduation_year) return b.graduation_year - a.graduation_year
          return (a.section || '').localeCompare(b.section || '')
        })

        const freshBatches = sortedBatches
        const freshDepts = deptSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const freshSems = semSnap.docs.map(d => ({ id: d.id, ...d.data() }))

        setBatches(freshBatches)
        setDepartments(freshDepts)
        setSemesters(freshSems)

        // 2. Update Cache
        sessionStorage.setItem('cache_admin_batches_data', JSON.stringify({
          batches: freshBatches,
          departments: freshDepts,
          semesters: freshSems,
          updatedAt: new Date().toISOString()
        }))
      } catch (err) {
        console.error('Batch fetch error:', err)
        if (!cached) toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleManageStudents(batch: any) {
    setSelectedBatch(batch)
    setShowManage(true)
    setLoadingStudents(true)
    try {
      const q = query(
        collection(db, 'profiles'), 
        where('role', '==', 'student'),
        where('dept_id', '==', 'CE')
      )
      const snap = await getDocs(q)
      const allStuds = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
      setStudents(allStuds)
      setTargetStudentIds(allStuds.filter(s => s.batch_id === batch.id).map(s => s.id))
    } catch (e) {
      toast.error('Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  async function handleSaveStudents() {
    if (!selectedBatch) return
    setSavingStudents(true)
    try {
      const { writeBatch: firestoreBatch } = await import('firebase/firestore')
      const batchOp = firestoreBatch(db)
      
      students.forEach(s => {
        const isCurrentlyIn = s.batch_id === selectedBatch.id
        const shouldBeIn = targetStudentIds.includes(s.id)
        
        if (shouldBeIn && !isCurrentlyIn) {
          batchOp.update(doc(db, 'profiles', s.id), { batch_id: selectedBatch.id })
        } else if (!shouldBeIn && isCurrentlyIn) {
          batchOp.update(doc(db, 'profiles', s.id), { batch_id: null })
        }
      })
      
      await batchOp.commit()
      toast.success('Batch enrollment updated')
      setShowManage(false)
      
      await logAction({
        action: 'updated',
        module: 'batches',
        description: `Updated student enrollment for batch: ${selectedBatch.name}`,
        targetTable: 'batches',
        targetId: selectedBatch.id
      })
    } catch (e) {
      toast.error('Failed to save changes')
    } finally {
      setSavingStudents(false)
    }
  }

  async function handleUpdateSemester(batchId: string, semesterId: string) {
    try {
        await updateDoc(doc(db, 'batches', batchId), {
            current_semester_id: semesterId,
            updated_at: new Date().toISOString()
        })
        setBatches(prev => prev.map(b => b.id === batchId ? { ...b, current_semester_id: semesterId } : b))
        
        const semName = semesters.find(s => s.id === semesterId)?.name || 'None'
        toast.success(`Semester updated to ${semName}`)

        await logAction({
            action: 'updated',
            module: 'batches',
            description: `Assigned semester ${semName} to batch: ${batches.find(b => b.id === batchId)?.name}`,
            targetTable: 'batches',
            targetId: batchId
        })
    } catch (e) {
        toast.error('Failed to update semester')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const baseData = {
        graduation_year: form.graduation_year,
        dept_id: 'CE',
        dept_name: 'Civil Engineering',
        current_semester_id: form.current_semester_id,
        created_at: new Date().toISOString()
      }

      if (form.createDual) {
        // Create Section A
        const dataA = { ...baseData, name: `${form.name} A`, section: 'A' }
        const docARef = await addDoc(collection(db, 'batches'), dataA)
        
        // Create Section B
        const dataB = { ...baseData, name: `${form.name} B`, section: 'B' }
        const docBRef = await addDoc(collection(db, 'batches'), dataB)
        
        setBatches(prev => [{ id: docARef.id, ...dataA }, { id: docBRef.id, ...dataB }, ...prev])
        toast.success('Sections A & B created')
      } else {
        const data = { ...baseData, name: form.name, section: form.section }
        const docRef = await addDoc(collection(db, 'batches'), data)
        setBatches(prev => [{ id: docRef.id, ...data }, ...prev])
        toast.success('Batch created')
      }
      
      setShowCreate(false)
      setForm({ name: '', graduation_year: new Date().getFullYear() + 3, section: 'A', dept_id: '', current_semester_id: '', createDual: true })
    } catch (err) {
      toast.error('Creation failed')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}><div className="loader" style={{ margin: 'auto' }}></div></div>

  return (
    <>
      <Topbar title="Batch Management" accentColor="#E24B4A" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="section-heading">Student Batches</h2>
            <p className="secondary-text">Assign semesters and manage students</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-filled" style={{ background: '#E24B4A', borderColor: '#E24B4A' }}>
            + Create Batch
          </button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Grad. Year</th>
                <th>Section</th>
                <th>Current Semester</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.name || `${b.graduation_year} — ${b.section}`}</td>
                  <td>{b.graduation_year}</td>
                  <td><span className="badge badge-neutral">{b.section}</span></td>
                  <td>
                    <select 
                        className="form-input" 
                        style={{ padding: '4px 8px', fontSize: '11px', height: 'auto', width: 'auto', minWidth: '140px' }}
                        value={b.current_semester_id || ''}
                        onChange={(e) => handleUpdateSemester(b.id, e.target.value)}
                    >
                        <option value="">— Unassigned —</option>
                        {semesters.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                       <button onClick={() => handleManageStudents(b)} className="btn btn-sm btn-outlined" style={{ '--role-accent': '#E24B4A' } as React.CSSProperties}>
                         Students
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No batches found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showManage && (
        <div className="modal-overlay" onClick={() => setShowManage(false)}>
           <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="section-heading">Manage Students: {selectedBatch?.name}</h2>
                <button className="btn btn-ghost" onClick={() => setShowManage(false)}>✕</button>
              </div>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                 {loadingStudents ? (
                   <div style={{ padding: '40px', textAlign: 'center' }}>Loading students...</div>
                 ) : (
                   <table className="data-table">
                     <thead>
                       <tr>
                         <th style={{ width: '40px' }}>Select</th>
                         <th>Name / Roll No</th>
                         <th>Current Batch</th>
                       </tr>
                     </thead>
                     <tbody>
                       {students.map(s => (
                         <tr key={s.id}>
                           <td>
                             <input 
                               type="checkbox" 
                               checked={targetStudentIds.includes(s.id)}
                               onChange={(e) => {
                                 if (e.target.checked) setTargetStudentIds(p => [...p, s.id])
                                 else setTargetStudentIds(p => p.filter(id => id !== s.id))
                               }}
                             />
                           </td>
                           <td>
                             <div style={{ fontSize: '13px', fontWeight: 500 }}>{s.full_name}</div>
                             <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{s.roll_no}</div>
                           </td>
                           <td className="secondary-text">
                             {s.batch_id === selectedBatch.id ? (
                               <span style={{ color: '#27AE60', fontWeight: 600 }}>In this batch</span>
                             ) : batches.find(b => b.id === s.batch_id)?.name || 'No batch'}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowManage(false)}>Cancel</button>
                <button 
                  className="btn btn-filled" 
                  style={{ flex: 1, background: '#E24B4A', borderColor: '#E24B4A' }}
                  onClick={handleSaveStudents}
                  disabled={savingStudents}
                >
                  {savingStudents ? 'Saving Changes...' : 'Save Enrollment'}
                </button>
              </div>
           </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>Add New Batch</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Batch Group Header</label>
                <input className="form-input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. 2021-25 Civil Engineering" />
              </div>

              <div style={{ 
                padding: '12px', 
                background: 'var(--surface-secondary)', 
                borderRadius: '8px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <input 
                  type="checkbox" 
                  id="dual-sec"
                  checked={form.createDual} 
                  onChange={e => setForm(p => ({ ...p, createDual: e.target.checked }))} 
                  style={{ transform: 'scale(1.2)' }}
                />
                <label htmlFor="dual-sec" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Create both Section A and Section B
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                    <label className="form-label">Graduation Year</label>
                    <input type="number" className="form-input" required value={form.graduation_year} onChange={e => setForm(p => ({ ...p, graduation_year: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                    <label className="form-label">{form.createDual ? 'Sections' : 'Section'}</label>
                    {form.createDual ? (
                       <div style={{ fontSize: '13px', padding: '10px 0', color: 'var(--text-tertiary)' }}>Auto-creating A & B</div>
                    ) : (
                       <input className="form-input" required value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} placeholder="e.g. A" />
                    )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Initial Semester (Optional)</label>
                <select className="form-input" value={form.current_semester_id} onChange={e => setForm(p => ({ ...p, current_semester_id: e.target.value }))}>
                  <option value="">— None —</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-filled" style={{ flex: 1, background: '#E24B4A', borderColor: '#E24B4A' }} disabled={creating}>
                  {creating ? 'Saving...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
