'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function AlumniDirectoryClient() {
  const { profile } = useAuth()
  const [alumni, setAlumni] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBatch, setFilterBatch] = useState('All')

  useEffect(() => {
    async function fetchAlumni() {
      try {
        const q = query(
            collection(db, 'profiles'), 
            where('role', '==', 'alumni'),
            orderBy('graduation_year', 'desc')
        )
        const snap = await getDocs(q)
        setAlumni(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error(err)
        toast.error('Failed to load directory')
      } finally {
        setLoading(false)
      }
    }
    fetchAlumni()
  }, [])

  const batches = ['All', ...Array.from(new Set(alumni.map(a => a.graduation_year))).sort().reverse()]

  const filteredAlumni = alumni.filter(a => {
    const matchesSearch = 
        a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.current_company?.toLowerCase().includes(search.toLowerCase()) ||
        a.current_job_title?.toLowerCase().includes(search.toLowerCase())
    
    const matchesBatch = filterBatch === 'All' || String(a.graduation_year) === String(filterBatch)
    
    return matchesSearch && matchesBatch
  })

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading alumni network...</div>

  return (
    <>
      <Topbar title="Alumni Directory" accentColor="#854F0B" />
      <div className="content-container">
        <div style={{ marginBottom: '32px' }}>
            <h2 className="section-heading">The Network</h2>
            <p className="secondary-text">Connect with fellow graduates across different sectors and batches.</p>
        </div>

        <div className="card" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
                <label className="form-label">Search</label>
                <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search by name, company, or job role..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div style={{ width: '150px' }}>
                <label className="form-label">Graduation Year</label>
                <select 
                    className="form-input" 
                    value={filterBatch}
                    onChange={e => setFilterBatch(e.target.value)}
                >
                    {batches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredAlumni.map(a => (
            <div key={a.id} className="card" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'var(--surface-secondary)', overflow: 'hidden', flexShrink: 0 }}>
                <img src={a.photo_url || `https://ui-avatars.com/api/?name=${a.full_name}&background=854F0B&color=fff`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{a.full_name}</h3>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)' }}>'{String(a.graduation_year).slice(-2)}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#854F0B', fontWeight: 500, margin: '2px 0 8px' }}>
                    {a.current_job_title || 'Alumni Member'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    <span>📍</span> {a.city || 'Global'} · {a.current_company || 'Independent'}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {a.linkedin_url && (
                        <a href={a.linkedin_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" style={{ padding: '4px 8px' }}>
                            LinkedIn
                        </a>
                    )}
                    {a.is_mentor && (
                        <span className="badge badge-success" style={{ fontSize: '9px', padding: '2px 8px' }}>MENTOR</span>
                    )}
                </div>
              </div>
            </div>
          ))}
          {filteredAlumni.length === 0 && (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', background: 'var(--surface-secondary)' }}>
                <p className="secondary-text">No alumni found matching your search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
