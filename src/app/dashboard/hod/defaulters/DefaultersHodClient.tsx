'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  getDocs, 
  where 
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function DefaultersHodClient() {
  const [defaulters, setDefaulters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState(75)

  useEffect(() => {
    async function fetchData() {
      try {
        const q = query(collection(db, 'attendance_summary'), where('percentage', '<', threshold))
        const snap = await getDocs(q)
        
        // Enhance with student details (this is a bit inefficient, but works for department scale)
        const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
        
        // Fetch student names if not in summary
        const studentIds = Array.from(new Set(docs.map(d => (d as any).student_id)))
        const studentMap: Record<string, any> = {}
        
        if (studentIds.length > 0) {
           // Firestore 'in' limit 30. For now just fetch all students and map (simpler for this case)
           const studentSnap = await getDocs(query(collection(db, 'profiles'), where('role', '==', 'student')))
           studentSnap.docs.forEach(d => {
             studentMap[d.id] = d.data()
           })
        }

        const enhanced = docs.map(d => ({
          ...d,
          student_name: studentMap[(d as any).student_id]?.full_name || 'Unknown',
          roll_no: studentMap[(d as any).student_id]?.roll_no || '—',
          registration_no: studentMap[(d as any).student_id]?.registration_no || null
        }))

        setDefaulters(enhanced)
      } catch (err) {
        console.error('Error fetching defaulters:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [threshold])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading defaulters...</div>

  return (
    <>
      <Topbar title="Defaulters Analysis" accentColor="#534AB7" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="section-heading">Attendance Defaulters</h2>
            <p className="secondary-text">Students with less than {threshold}% attendance</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="form-label">Threshold:</span>
            <select className="form-input" style={{ width: '80px' }} value={threshold} onChange={e => setThreshold(Number(e.target.value))}>
              <option value={85}>85%</option>
              <option value={75}>75%</option>
              <option value={60}>60%</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Subject</th>
                  <th>Present</th>
                  <th>Total</th>
                  <th>Percentage</th>
                  <th>Classes Needed</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.map(d => {
                  const needed = Math.max(0, Math.ceil((threshold * d.total_sessions - 100 * d.attended_sessions) / (100 - threshold)))
                  return (
                    <tr key={d.id}>
                      <td>{d.student_name}</td>
                      <td className="secondary-text">
                        <div>{d.roll_no}</div>
                        {d.registration_no && (
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{d.registration_no}</div>
                        )}
                      </td>
                      <td>{d.course_name}</td>
                      <td className="secondary-text">{d.attended_sessions}</td>
                      <td className="secondary-text">{d.total_sessions}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <span className="badge badge-error">{d.percentage.toFixed(1)}%</span>
                           <div className="progress-bar" style={{ width: '60px', height: '4px' }}>
                             <div className="progress-fill" style={{ width: `${d.percentage}%`, background: 'var(--status-error)' }}></div>
                           </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-warning">+{needed} classes</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
