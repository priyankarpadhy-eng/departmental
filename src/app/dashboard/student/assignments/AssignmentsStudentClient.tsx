'use client'

import React, { useState, useEffect } from 'react'
import { db, storage } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  addDoc,
  doc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { Assignment, Submission } from '@/types'

export function AssignmentsStudentClient() {
  const { user, profile } = useAuth()
  const [assignments, setAssignments] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    if (!profile || !user) return

    async function fetchData() {
      try {
        if (!user || !profile?.batch_id) return;

        // 1. Try High-Speed MongoDB (Unified fetch)
        const response = await fetch(`/api/student/classroom?batchId=${profile.batch_id}&type=assignments&uid=${user.uid}`);
        if (response.ok) {
           const data = await response.json();
           const assignmentList = data.items || [];
           const subList = data.submissions || [];
           
           const subMap: Record<string, any> = {}
           subList.forEach((s: any) => {
             subMap[s.assignment_id] = s;
           });

           setAssignments(assignmentList);
           setSubmissions(subMap);
           setLoading(false);
           return;
        }

        // 2. Fallback: Firestore
        const q = query(
          collection(db, 'assignments'),
          where('batch_id', '==', profile?.batch_id || ''),
          orderBy('due_date', 'asc')
        )
        const snap = await getDocs(q)
        const assignmentList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setAssignments(assignmentList)

        const subQ = query(
          collection(db, 'submissions'),
          where('student_id', '==', user?.uid || '')
        )
        const subSnap = await getDocs(subQ)
        const subMap: Record<string, any> = {}
        subSnap.docs.forEach(doc => {
          const data = doc.data()
          subMap[data.assignment_id] = { id: doc.id, ...data }
        })
        setSubmissions(subMap)
      } catch (err) {
        console.error('Error fetching assignments:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [profile, user])

  async function handleUpload(assignmentId: string, file: File) {
    if (!user) return
    setUploading(assignmentId)

    try {
      const storageRef = ref(storage, `submissions/${assignmentId}/${user.uid}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      const submissionData = {
        assignment_id: assignmentId,
        student_id: user.uid,
        file_url: url,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
        marks: null,
        feedback: null
      }

      const docRef = await addDoc(collection(db, 'submissions'), submissionData)
      setSubmissions(prev => ({ ...prev, [assignmentId]: { id: docRef.id, ...submissionData } }))
      toast.success('Assignment submitted successfully!')
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploading(null)
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading assignments...</div>

  return (
    <>
      <Topbar title="Assignments" accentColor="#0F6E56" />
      <div className="content-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {assignments.map((assignment) => {
            const submission = submissions[assignment.id]
            const isOverdue = new Date(assignment.due_date) < new Date() && !submission

            return (
              <div key={assignment.id} className="card">
                <div className="section-row" style={{ marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{assignment.title}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{assignment.course_name} · Max Marks: {assignment.max_marks}</p>
                  </div>
                  <span className={`badge ${isOverdue ? 'badge-error' : submission ? 'badge-success' : 'badge-warning'}`}>
                    {submission ? 'Submitted' : isOverdue ? 'Overdue' : 'Pending'}
                  </span>
                </div>
                
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {assignment.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--surface-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px' }}>
                    <div style={{ color: 'var(--text-tertiary)' }}>Due Date</div>
                    <div style={{ fontWeight: 500 }}>{new Date(assignment.due_date).toLocaleString()}</div>
                  </div>

                  {submission ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Marks</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F6E56' }}>{submission.marks !== null ? `${submission.marks} / ${assignment.max_marks}` : 'Not graded'}</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {assignment.file_url && (
                        <a href={assignment.file_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outlined" style={{ '--role-accent': '#0F6E56' } as React.CSSProperties}>
                          Download Brief
                        </a>
                      )}
                      <label className="btn btn-sm btn-filled" style={{ background: '#0F6E56', borderColor: '#0F6E56', cursor: 'pointer' }}>
                        {uploading === assignment.id ? 'Uploading...' : 'Upload File'}
                        <input 
                          type="file" 
                          hidden 
                          disabled={!!uploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUpload(assignment.id, file)
                          }} 
                        />
                      </label>
                    </div>
                  )}
                </div>
                
                {submission && submission.feedback && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'var(--accent-student-bg)', borderRadius: '6px', fontSize: '12px' }}>
                    <strong>Feedback:</strong> {submission.feedback}
                  </div>
                )}
              </div>
            )
          })}
          {assignments.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p className="secondary-text">No assignments found for your batch.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
