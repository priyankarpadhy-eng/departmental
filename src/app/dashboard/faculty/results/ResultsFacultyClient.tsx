'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  doc, 
  getDoc,
  updateDoc
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function ResultsFacultyClient() {
  const { user } = useAuth()
  const [offerings, setOfferings] = useState<any[]>([])
  const [selectedOffering, setSelectedOffering] = useState<string | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    async function fetchOfferings() {
      try {
        const q = query(collection(db, 'course_offerings'), where('faculty_id', '==', user?.uid))
        const snap = await getDocs(q)
        setOfferings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        toast.error('Failed to load courses')
      } finally {
        setLoading(false)
      }
    }
    fetchOfferings()
  }, [user])

  useEffect(() => {
    if (!selectedOffering) {
      setStudents([])
      setResults({})
      return
    }

    async function fetchData() {
      setLoading(true)
      try {
        const off = offerings.find(o => o.id === selectedOffering)
        
        // Fetch students in the batch
        const studentsQ = query(collection(db, 'profiles'), where('batch_id', '==', off.batch_id), where('role', '==', 'student'))
        const studentsSnap = await getDocs(studentsQ)
        const studentList = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setStudents(studentList)

        // Fetch existing results for this offering
        const resultsQ = query(collection(db, 'results'), where('offering_id', '==', selectedOffering))
        const resultsSnap = await getDocs(resultsQ)
        const resultMap: Record<string, any> = {}
        resultsSnap.docs.forEach(d => {
          resultMap[d.data().student_id] = { id: d.id, ...d.data() }
        })
        setResults(resultMap)
      } catch (err) {
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedOffering, offerings])

  const calculateGrade = (total: number) => {
    if (total >= 90) return 'O'
    if (total >= 80) return 'A+'
    if (total >= 70) return 'A'
    if (total >= 60) return 'B+'
    if (total >= 55) return 'B'
    if (total >= 50) return 'C'
    if (total >= 40) return 'P'
    return 'F'
  }

  async function handleUpdateMarks(studentId: string, internals: number, externals: number) {
    const total = Number(internals) + Number(externals)
    const grade = calculateGrade(total)
    
    setResults(prev => ({
      ...prev,
      [studentId]: { 
        ...prev[studentId], 
        internal_marks: internals, 
        external_marks: externals, 
        total, 
        grade 
      }
    }))
  }

  async function handleSave() {
    if (!selectedOffering) return
    setSaving(true)
    try {
      const off = offerings.find(o => o.id === selectedOffering)
      
      const promises = students.map(async (s) => {
        const res = results[s.id] || { internal_marks: 0, external_marks: 0, total: 0, grade: 'F' }
        const docRef = doc(db, 'results', `${selectedOffering}_${s.id}`)
        return setDoc(docRef, {
          offering_id: selectedOffering,
          student_id: s.id,
          student_name: s.full_name,
          course_id: off.course_id,
          course_name: off.course_name,
          course_code: off.course_code,
          internal_marks: Number(res.internal_marks),
          external_marks: Number(res.external_marks),
          total: Number(res.total),
          grade: res.grade,
          is_locked: false,
          updated_at: new Date().toISOString()
        }, { merge: true })
      })

      await Promise.all(promises)
      toast.success('Results saved successfully')
    } catch (err) {
      toast.error('Failed to save results')
    } finally {
      setSaving(false)
    }
  }

  if (loading && offerings.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <>
      <Topbar title="Result Entry" accentColor="#185FA5" />
      <div className="content-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 300px) 1fr', gap: '20px' }}>
          {/* Courses */}
          <div className="card">
            <h2 className="section-heading" style={{ marginBottom: '16px' }}>My Courses</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {offerings.map(o => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOffering(o.id)}
                  className="btn btn-outlined"
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    padding: '12px',
                    borderColor: selectedOffering === o.id ? '#185FA5' : 'var(--border-color)',
                    background: selectedOffering === o.id ? 'var(--surface-secondary)' : 'transparent',
                    '--role-accent': '#185FA5'
                  } as React.CSSProperties}
                >
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{o.course_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{o.batch_name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Entry Grid */}
          <div className="card">
            <div className="section-row" style={{ marginBottom: '20px' }}>
              <h2 className="section-heading">Marks Entry Grid</h2>
              {selectedOffering && (
                <button onClick={handleSave} disabled={saving} className="btn btn-filled" style={{ background: '#185FA5', borderColor: '#185FA5' }}>
                  {saving ? 'Saving...' : 'Save All Results'}
                </button>
              )}
            </div>

            {selectedOffering ? (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Internals (25)</th>
                      <th>Externals (75)</th>
                      <th>Total (100)</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => {
                      const res = results[s.id] || { internal_marks: 0, external_marks: 0, total: 0, grade: 'F' }
                      return (
                        <tr key={s.id}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{s.full_name}</div>
                            <div className="secondary-text" style={{ fontSize: '11px' }}>{s.roll_no}</div>
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-input" 
                              style={{ width: '80px' }} 
                              max={25} 
                              value={res.internal_marks} 
                              onChange={e => handleUpdateMarks(s.id, Number(e.target.value), res.external_marks)} 
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-input" 
                              style={{ width: '80px' }} 
                              max={75} 
                              value={res.external_marks} 
                              onChange={e => handleUpdateMarks(s.id, res.internal_marks, Number(e.target.value))} 
                            />
                          </td>
                          <td style={{ fontWeight: 600 }}>{res.total}</td>
                          <td>
                            <span className={`badge ${res.grade === 'F' ? 'badge-error' : 'badge-success'}`}>
                              {res.grade}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">Select a course to start entering marks.</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
