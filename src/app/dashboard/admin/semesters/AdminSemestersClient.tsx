'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  where
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { logAction } from '@/lib/logAction'

export function AdminSemestersClient() {
  const [semesters, setSemesters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const [form, setForm] = useState({
    name: '',
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear()+1}`,
    start_date: '',
    end_date: '',
    is_active: false
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDocs(collection(db, 'semesters'))
        setSemesters(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        toast.error('Failed to load semesters')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const newStatus = !currentStatus
      await updateDoc(doc(db, 'semesters', id), { is_active: newStatus })
      
      setSemesters(prev => prev.map(s => {
        if (s.id === id) return { ...s, is_active: newStatus }
        return s
      }))

      await logAction({
        action: 'updated',
        module: 'semesters',
        description: `Set semester ${semesters.find(s => s.id === id)?.name} to ${newStatus ? 'active' : 'inactive'}`,
        targetTable: 'semesters',
        targetId: id
      })

      toast.success(`Semester ${newStatus ? 'activated' : 'deactivated'}`)
    } catch (err) {
      toast.error('Status update failed')
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
      const docRef = await addDoc(collection(db, 'semesters'), data)
      setSemesters(prev => [...prev, { id: docRef.id, ...data }])
      
      await logAction({
        action: 'created',
        module: 'semesters',
        description: `Created semester: ${form.name} (${form.academic_year})`,
        targetTable: 'semesters',
        targetId: docRef.id,
        newValue: data
      })

      toast.success('Semester created')
      setShowCreate(false)
      setForm({
        name: '',
        academic_year: `${new Date().getFullYear()}-${new Date().getFullYear()+1}`,
        start_date: '',
        end_date: '',
        is_active: false
      })
    } catch (err) {
      toast.error('Creation failed')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <>
      <div className="section-row" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="section-heading">Academic Semesters</h2>
          <p className="secondary-text">Manage terms and academic calendar rollouts</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-filled" style={{ background: '#E24B4A', borderColor: '#E24B4A' }}>
          Add Semester
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Semester Name</th>
              <th>Academic Year</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {semesters.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                </td>
                <td className="secondary-text">{s.academic_year}</td>
                <td className="secondary-text">
                  {new Date(s.start_date).toLocaleDateString()} — {new Date(s.end_date).toLocaleDateString()}
                </td>
                <td>
                  <span className={`badge ${s.is_active ? 'badge-success' : 'badge-neutral'}`}>
                    {s.is_active ? 'Currently Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleToggleActive(s.id, s.is_active)} className="btn btn-sm btn-outlined" style={{ '--role-accent': s.is_active ? '#E24B4A' : '#1A7A46' } as React.CSSProperties}>
                    {s.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>New Semester</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Semester Name</label>
                <input className="form-input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Fall 2026 / Semester 5" />
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <input className="form-input" required value={form.academic_year} onChange={e => setForm(p => ({ ...p, academic_year: e.target.value }))} placeholder="e.g. 2026-2027" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                 <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" required value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" required value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-filled" style={{ flex: 1, background: '#E24B4A', borderColor: '#E24B4A' }} disabled={creating}>
                  {creating ? 'Saving...' : 'Create Semester'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
