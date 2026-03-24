'use client'

import React, { useState, useEffect } from 'react'
import { db, storage } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy, 
  deleteDoc, 
  doc 
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { Cloud } from 'lucide-react'

export function MaterialsFacultyClient() {
  const { user } = useAuth()
  const [offerings, setOfferings] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [newMat, setNewMat] = useState({
    offering_id: '',
    title: '',
    unit: 1,
    type: 'notes',
    description: '',
    file: null as File | null
  })

  useEffect(() => {
    if (!user) return
    async function fetchData() {
      try {
        const offQ = query(collection(db, 'course_offerings'), where('faculty_id', '==', user?.uid))
        const offSnap = await getDocs(offQ)
        const offList = offSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setOfferings(offList)

        const matQ = query(collection(db, 'study_materials'), where('faculty_id', '==', user?.uid), orderBy('created_at', 'desc'))
        const matSnap = await getDocs(matQ)
        setMaterials(matSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!newMat.file) {
      toast.error('Please select a file')
      return
    }
    setUploading(true)
    try {
      const storageRef = ref(storage, `materials/${Date.now()}_${newMat.file.name}`)
      await uploadBytes(storageRef, newMat.file)
      const url = await getDownloadURL(storageRef)

      const selectedOff = offerings.find(o => o.id === newMat.offering_id)

      const matData = {
        faculty_id: user?.uid,
        offering_id: newMat.offering_id,
        course_name: selectedOff?.course_name || '',
        title: newMat.title,
        unit: Number(newMat.unit),
        type: newMat.type,
        description: newMat.description,
        file_url: url,
        created_at: new Date().toISOString()
      }

      const docRef = await addDoc(collection(db, 'study_materials'), matData)
      setMaterials(prev => [{ id: docRef.id, ...matData }, ...prev])
      toast.success('Material uploaded!')
      setShowUpload(false)
      setNewMat({ offering_id: '', title: '', unit: 1, type: 'notes', description: '', file: null })
    } catch (err) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this material?')) return
    try {
      await deleteDoc(doc(db, 'study_materials', id))
      setMaterials(prev => prev.filter(m => m.id !== id))
      toast.success('Deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <>
      <Topbar title="Study Materials" accentColor="#185FA5" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="section-heading">My Uploads</h2>
            <p className="secondary-text">{materials.length} resources shared</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="btn btn-filled" style={{ background: '#185FA5', borderColor: '#185FA5' }}>
            Upload Material
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {materials.map(m => (
            <div key={m.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="badge badge-neutral">{(m.type || 'file').toUpperCase()}</span>
                <span className="badge badge-info">Unit {m.unit}</span>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{m.title}</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '10px' }}>{m.course_name}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{m.description}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={m.file_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outlined" style={{ flex: 1, '--role-accent': '#185FA5' } as React.CSSProperties}>
                  Open
                </a>
                <button onClick={() => handleDelete(m.id)} className="btn btn-sm btn-ghost" style={{ color: 'var(--status-error)' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {materials.length === 0 && <div className="empty-state">No materials uploaded yet.</div>}
        </div>
      </div>

      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>Upload Study Material</h2>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Course</label>
                <select className="form-input" required value={newMat.offering_id} onChange={e => setNewMat(p => ({ ...p, offering_id: e.target.value }))}>
                  <option value="">Select a course</option>
                  {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} ({o.batch_name})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" required value={newMat.title} onChange={e => setNewMat(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input type="number" className="form-input" required value={newMat.unit} onChange={e => setNewMat(p => ({ ...p, unit: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={newMat.type} onChange={e => setNewMat(p => ({ ...p, type: e.target.value }))}>
                    <option value="notes">Notes (PDF/Doc)</option>
                    <option value="slides">Slides (PPT)</option>
                    <option value="video">Video Link</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={newMat.description} onChange={e => setNewMat(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">File</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="file" className="form-input" style={{ flex: 1 }} onChange={e => setNewMat(p => ({ ...p, file: e.target.files?.[0] || null }))} />
                  <button 
                    type="button" 
                    className="btn btn-outlined" 
                    style={{ '--role-accent': '#185FA5' } as React.CSSProperties}
                    onClick={() => toast('Cloud Picker selected! (Requires Drive/Mega/Supabase Link)')}
                  >
                    <Cloud className="w-4 h-4 mr-1" />
                    Cloud
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowUpload(false)}>Cancel</button>
                <button type="submit" className="btn btn-filled" style={{ flex: 1, background: '#185FA5', borderColor: '#185FA5' }} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
