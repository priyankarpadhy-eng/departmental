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
  setDoc
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { logAction } from '@/lib/logAction'

export function AdminDepartmentsClient() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState<any[]>([])
  const [hodCandidates, setHodCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDept, setEditingDept] = useState<any>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: 'Civil Engineering',
    code: 'CE',
    description: '',
    hod_id: '',
    established_year: new Date().getFullYear()
  })

  useEffect(() => {
    async function fetchData() {
      // 1. Check cache for instant load
      const cached = sessionStorage.getItem('cache_admin_departments_data')
      if (cached) {
        const decoded = JSON.parse(cached)
        setDepartments(decoded.departments || [])
        setHodCandidates(decoded.hodCandidates || [])
        setLoading(false)
      }

      try {
        const [deptSnap, facultySnap] = await Promise.all([
          getDocs(collection(db, 'departments')),
          getDocs(query(collection(db, 'profiles'), where('role', 'in', ['faculty', 'hod', 'admin'])))
        ])
        
        const freshDepts = deptSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const freshHods = facultySnap.docs.map(d => ({ id: d.id, ...d.data() }))

        setDepartments(freshDepts)
        setHodCandidates(freshHods)

        // 2. Update cache
        sessionStorage.setItem('cache_admin_departments_data', JSON.stringify({
          departments: freshDepts,
          hodCandidates: freshHods,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const data = {
        ...form,
        updated_at: new Date().toISOString()
      }

      if (editingDept) {
        await updateDoc(doc(db, 'departments', editingDept.id), data)
        setDepartments(prev => prev.map(d => d.id === editingDept.id ? { ...d, ...data } : d))
        
        // Update HOD role if changed
        if (form.hod_id) {
          await updateDoc(doc(db, 'profiles', form.hod_id), { role: 'hod' })
        }

        toast.success('Department updated')
      } else {
        const deptId = form.code.toUpperCase()
        const deptRef = doc(db, 'departments', deptId)
        const finalData = {
          ...data,
          created_at: new Date().toISOString()
        }
        await setDoc(deptRef, finalData)
        setDepartments(prev => [...prev, { id: deptId, ...finalData }])
        
        // Update HOD role
        if (form.hod_id) {
          await updateDoc(doc(db, 'profiles', form.hod_id), { role: 'hod' })
        }

        toast.success('Department created')
      }
      
      setShowCreate(false)
      setEditingDept(null)
      setForm({ name: 'Civil Engineering', code: 'CE', description: '', hod_id: '', established_year: new Date().getFullYear() })
    } catch (err) {
      toast.error('Operation failed')
    } finally {
      setCreating(false)
    }
  }

  function handleEdit(dept: any) {
    setEditingDept(dept)
    setForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      hod_id: dept.hod_id || '',
      established_year: dept.established_year || new Date().getFullYear()
    })
    setShowCreate(true)
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <>
      <div className="section-row" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="section-heading">Departments</h2>
          <p className="secondary-text">Manage academic wings and department leaders</p>
        </div>
        <button onClick={() => { setEditingDept(null); setForm({ name: 'Civil Engineering', code: 'CE', description: '', hod_id: '', established_year: new Date().getFullYear() }); setShowCreate(true); }} className="btn btn-filled" style={{ background: '#E24B4A', borderColor: '#E24B4A' }}>
          Add Department
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Dept Name</th>
              <th>Code</th>
              <th>HOD</th>
              <th>Est. Year</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(d => {
              const hod = hodCandidates.find(h => h.id === d.hod_id)
              return (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{d.name}</div>
                    <div className="secondary-text" style={{ fontSize: '11px' }}>{d.description?.slice(0, 50)}...</div>
                  </td>
                  <td><span className="badge badge-neutral">{d.code}</span></td>
                  <td>
                    {hod ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar avatar-sm" style={{ width: '24px', height: '24px', fontSize: '10px' }}>{hod.full_name?.charAt(0)}</div>
                        <div style={{ fontSize: '13px' }}>{hod.full_name}</div>
                      </div>
                    ) : 'Not Assigned'}
                  </td>
                  <td className="secondary-text">{d.established_year}</td>
                  <td>
                    <button onClick={() => handleEdit(d)} className="btn btn-sm btn-ghost">Edit</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => { setShowCreate(false); setEditingDept(null); }}>
          <div className="card modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>{editingDept ? 'Edit Department' : 'New Department'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input className="form-input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Computer Science & Engineering" />
              </div>
              <div className="form-group">
                <label className="form-label">Code</label>
                <input className="form-input" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. CSE" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Select HOD</label>
                <select className="form-input" value={form.hod_id} onChange={e => setForm(p => ({ ...p, hod_id: e.target.value }))}>
                  <option value="">— Select Faculty —</option>
                  {hodCandidates.map(h => (
                    <option key={h.id} value={h.id}>{h.full_name} ({h.email})</option>
                  ))}
                </select>
                <p className="secondary-text" style={{ fontSize: '10px' }}>Selected user will be automatically promoted to HOD role.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Established Year</label>
                <input type="number" className="form-input" value={form.established_year} onChange={e => setForm(p => ({ ...p, established_year: Number(e.target.value) }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowCreate(false); setEditingDept(null); }}>Cancel</button>
                <button type="submit" className="btn btn-filled" style={{ flex: 1, background: '#E24B4A', borderColor: '#E24B4A' }} disabled={creating}>
                  {creating ? 'Saving...' : editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
