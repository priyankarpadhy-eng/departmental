'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface Props {
  assignmentId: string
}

export function AssignmentEvaluationClient({ assignmentId }: Props) {
  const [assignment, setAssignment] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [gradingId, setGradingId] = useState<string | null>(null)
  const [gradeData, setGradeData] = useState({ marks: '', feedback: '' })

  useEffect(() => {
    if (!assignmentId) return
    async function fetchData() {
      try {
        const assDoc = await getDoc(doc(db, 'assignments', assignmentId))
        if (assDoc.exists()) setAssignment({ id: assDoc.id, ...assDoc.data() })

        const subQ = query(collection(db, 'submissions'), where('assignment_id', '==', assignmentId))
        const subSnap = await getDocs(subQ)
        
        // Fetch student names for each submission
        const subList = await Promise.all(subSnap.docs.map(async (d) => {
          const sub = { id: d.id, ...d.data() as any }
          const studentDoc = await getDoc(doc(db, 'profiles', sub.student_id))
          return { ...sub, student: studentDoc.data() }
        }))
        
        setSubmissions(subList)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [assignmentId])

  async function handleGradeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!gradingId) return
    try {
      await updateDoc(doc(db, 'submissions', gradingId), {
        marks: Number(gradeData.marks),
        feedback: gradeData.feedback,
        status: 'graded'
      })
      setSubmissions(prev => prev.map(s => s.id === gradingId ? { ...s, marks: Number(gradeData.marks), feedback: gradeData.feedback, status: 'graded' } : s))
      toast.success('Grade saved')
      setGradingId(null)
    } catch (err) {
      toast.error('Failed to save grade')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading submissions...</div>
  if (!assignment) return <div style={{ padding: '40px', textAlign: 'center' }}>Assignment not found.</div>

  return (
    <>
      <Topbar title={`Evaluation: ${assignment.title}`} accentColor="#185FA5" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="section-heading">Submissions</h2>
            <p className="secondary-text">{submissions.length} students have submitted.</p>
          </div>
          <Link href="/dashboard/faculty/assignments" className="btn btn-ghost">Back</Link>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Submitted At</th>
                <th>Status</th>
                <th>Marks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.student?.full_name || 'Unknown'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{s.student?.roll_no}</div>
                  </td>
                  <td className="secondary-text">{new Date(s.submitted_at).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${s.status === 'graded' ? 'badge-success' : 'badge-warning'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {s.marks !== null ? `${s.marks} / ${assignment.max_marks}` : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {s.file_url && <a href={s.file_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost">Download</a>}
                      <button 
                        onClick={() => {
                          setGradingId(s.id)
                          setGradeData({ marks: s.marks?.toString() || '', feedback: s.feedback || '' })
                        }} 
                        className="btn btn-sm btn-outlined" 
                        style={{ '--role-accent': '#185FA5' } as React.CSSProperties}
                      >
                        {s.status === 'graded' ? 'Re-grade' : 'Grade'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No submissions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {gradingId && (
        <div className="modal-overlay" onClick={() => setGradingId(null)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>Evaluate Submission</h2>
            <form onSubmit={handleGradeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div className="form-group">
                 <label className="form-label">Marks (Out of {assignment.max_marks})</label>
                 <input type="number" step="0.5" max={assignment.max_marks} min={0} className="form-input" required value={gradeData.marks} onChange={e => setGradeData(p => ({ ...p, marks: e.target.value }))} />
               </div>
               <div className="form-group">
                 <label className="form-label">Feedback</label>
                 <textarea className="form-input" rows={3} value={gradeData.feedback} onChange={e => setGradeData(p => ({ ...p, feedback: e.target.value }))} />
               </div>
               <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                 <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setGradingId(null)}>Cancel</button>
                 <button type="submit" className="btn btn-filled" style={{ flex: 1, background: '#185FA5', borderColor: '#185FA5' }}>Post Grade</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
