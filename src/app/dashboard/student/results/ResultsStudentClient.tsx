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

export function ResultsStudentClient() {
  const { user } = useAuth()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !user.uid) return

    async function fetchResults() {
      try {
        const q = query(
          collection(db, 'results'),
          where('student_id', '==', user?.uid)
        )
        const snap = await getDocs(q)
        setResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching results:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [user])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading results...</div>

  // Calculate CGPA (simulated)
  const totalGradePoints = results.reduce((acc, curr) => {
    const points: Record<string, number> = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0 }
    return acc + (points[curr.grade] || 0)
  }, 0)
  const cgpa = results.length > 0 ? (totalGradePoints / results.length).toFixed(2) : '0.00'

  return (
    <>
      <Topbar title="Results & Academic Performance" accentColor="#0F6E56" />
      <div className="content-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-label">Cumulative CGPA</div>
            <div className="stat-value" style={{ color: '#0F6E56' }}>{cgpa}</div>
            <div className="secondary-text">Based on {results.length} subjects</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Credits Earned</div>
            <div className="stat-value">64</div>
            <div className="secondary-text">Out of 160 required</div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-heading" style={{ marginBottom: '16px' }}>Semester Results</h2>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Internal</th>
                  <th>External</th>
                  <th>Total</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{r.course_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{r.course_code}</div>
                    </td>
                    <td className="secondary-text">{r.internal_marks}</td>
                    <td className="secondary-text">{r.external_marks}</td>
                    <td style={{ fontWeight: 600 }}>{r.total}</td>
                    <td>
                      <span className={`badge ${r.grade === 'F' ? 'badge-error' : 'badge-success'}`}>
                        {r.grade}
                      </span>
                    </td>
                    <td>
                      {r.is_locked ? <span className="badge badge-info">Published</span> : <span className="badge badge-neutral">Provisional</span>}
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }} className="secondary-text">
                      No results published yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
