'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function SyllabusFacultyClient() {
  const { user } = useAuth()
  const [offerings, setOfferings] = useState<any[]>([])
  const [selectedOffering, setSelectedOffering] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchOfferings() {
      try {
        const q = query(
          collection(db, 'course_offerings'),
          where('faculty_id', '==', user.uid)
        )
        const snap = await getDocs(q)
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setOfferings(data)
        if (data.length > 0) setSelectedOffering(data[0])
      } catch (err) {
        toast.error('Failed to load courses')
      } finally {
        setLoading(false)
      }
    }

    fetchOfferings()
  }, [user])

  async function toggleUnit(unitIndex: number) {
    if (!selectedOffering) return
    
    const newSyllabus = [...(selectedOffering.syllabus || [])]
    newSyllabus[unitIndex].is_covered = !newSyllabus[unitIndex].is_covered
    
    // Calculate total completion
    const coveredCount = newSyllabus.filter(u => u.is_covered).length
    const completionPct = Math.round((coveredCount / newSyllabus.length) * 100)

    try {
      await updateDoc(doc(db, 'course_offerings', selectedOffering.id), {
        syllabus: newSyllabus,
        completion_percentage: completionPct
      })
      
      const updated = { ...selectedOffering, syllabus: newSyllabus, completion_percentage: completionPct }
      setSelectedOffering(updated)
      setOfferings(prev => prev.map(o => o.id === updated.id ? updated : o))
      toast.success('Syllabus updated')
    } catch (err) {
      toast.error('Failed to update syllabus')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading tracker...</div>

  return (
    <>
      <Topbar title="Syllabus Tracker" accentColor="#185FA5" />
      <div className="content-container">
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <div className="section-row" style={{ marginBottom: '20px' }}>
              <div>
                <h2 className="section-heading">Plan & Track</h2>
                <p className="secondary-text">Mark units as covered to update the course progress.</p>
              </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <label className="form-label">Select Course</label>
                <select 
                    className="form-input" 
                    value={selectedOffering?.id} 
                    onChange={e => setSelectedOffering(offerings.find(o => o.id === e.target.value))}
                >
                    {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} ({o.batch_id})</option>)}
                </select>
            </div>

            {selectedOffering ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(selectedOffering.syllabus || []).map((unit: any, idx: number) => (
                  <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: unit.is_covered ? '4px solid #27AE60' : '4px solid var(--border-color)' }}>
                    <input 
                        type="checkbox" 
                        checked={unit.is_covered} 
                        onChange={() => toggleUnit(idx)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>Unit {idx + 1}: {unit.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{unit.topics || 'Standard curriculum topics'}</div>
                    </div>
                  </div>
                ))}
                {(selectedOffering.syllabus || []).length === 0 && (
                    <div className="card secondary-text" style={{ textAlign: 'center', padding: '30px' }}>
                        No syllabus units defined for this course.
                    </div>
                )}
              </div>
            ) : (
                <div className="card secondary-text">No courses assigned to you.</div>
            )}
          </div>

          <div style={{ width: '320px' }}>
            <div className="card" style={{ textAlign: 'center', position: 'sticky', top: '24px' }}>
               <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>Course Completion</h3>
               <div style={{ 
                   width: '120px', 
                   height: '120px', 
                   borderRadius: '50%', 
                   border: '8px solid var(--surface-secondary)', 
                   borderTopColor: '#185FA5',
                   margin: '0 auto 16px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   fontSize: '24px',
                   fontWeight: 700,
                   position: 'relative'
               }}>
                   {selectedOffering?.completion_percentage || 0}%
               </div>
               <p className="secondary-text" style={{ fontSize: '12px' }}>
                   This progress is visible to the Head of Department (HOD) in the performance reports.
               </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
