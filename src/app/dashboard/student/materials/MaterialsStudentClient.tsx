'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'

export function MaterialsStudentClient() {
  const { profile } = useAuth()
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.batch_id) {
      setLoading(profile ? false : true)
      return
    }

    async function fetchMaterials() {
      try {
        // 1. Try High-Speed MongoDB
        const res = await fetch(`/api/student/classroom?batchId=${profile!.batch_id}&type=materials`);
        if (res.ok) {
          const data = await res.json();
          setMaterials(data.items || []);
          setLoading(false);
          return;
        }

        // 2. Fallback: Firestore
        const q = query(
          collection(db, 'study_materials'),
          where('batch_id', '==', profile?.batch_id)
        )
        const snap = await getDocs(q)
        setMaterials(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching materials:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [profile])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading materials...</div>

  return (
    <>
      <Topbar title="Study Materials" accentColor="#0F6E56" />
      <div className="content-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {materials.map(m => (
            <div key={m.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{m.title}</h3>
                <span className="badge badge-info">{m.course_name}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                Posted by {m.faculty_name || 'Faculty'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{m.description}</p>
              <a href={m.file_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-filled" style={{ textAlign: 'center', background: '#0F6E56', borderColor: '#0F6E56' }}>
                Download / View
              </a>
            </div>
          ))}
          {materials.length === 0 && (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
              <p className="secondary-text">No study materials shared for your batch yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
