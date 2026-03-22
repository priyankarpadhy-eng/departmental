'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy,
  doc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function QuizFacultyClient() {
  const { user, profile } = useAuth()
  const [offerings, setOfferings] = useState<any[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  
  // Create form state
  const [newQuiz, setNewQuiz] = useState({
    offering_id: '',
    title: '',
    duration_mins: 15,
  })

  useEffect(() => {
    if (!user) return
    
    async function fetchData() {
      try {
        const offSnap = await getDocs(query(collection(db, 'course_offerings'), where('faculty_id', '==', user?.uid)))
        setOfferings(offSnap.docs.map(d => ({ id: d.id, ...d.data() })))

        const quizSnap = await getDocs(query(collection(db, 'quizzes'), where('faculty_id', '==', user?.uid), orderBy('created_at', 'desc')))
        setQuizzes(quizSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    try {
      const selectedOff = offerings.find(o => o.id === newQuiz.offering_id)
      const quizData = {
        ...newQuiz,
        faculty_id: user.uid,
        course_name: selectedOff?.course_name || '',
        batch_id: selectedOff?.batch_id || '',
        is_active: false,
        created_at: new Date().toISOString()
      }
      const docRef = await addDoc(collection(db, 'quizzes'), quizData)
      setQuizzes(prev => [{ id: docRef.id, ...quizData }, ...prev])
      toast.success('Quiz shell created! Now add questions.')
      setShowCreate(false)
    } catch (err) {
      toast.error('Failed to create quiz')
    }
  }

  async function toggleActive(quizId: string, current: boolean) {
    try {
      await updateDoc(doc(db, 'quizzes', quizId), { is_active: !current })
      setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, is_active: !current } : q))
      toast.success(current ? 'Quiz deactivated' : 'Quiz is now LIVE')
    } catch (err) {
      toast.error('Update failed')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Quiz Manager...</div>

  return (
    <>
      <Topbar title="Online Quiz Manager" accentColor="#185FA5" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="section-heading">My Quizzes</h2>
            <p className="secondary-text">Create and manage interactive assessments.</p>
          </div>
          <button className="btn btn-filled" style={{ background: '#185FA5', borderColor: '#185FA5' }} onClick={() => setShowCreate(true)}>
             + Create New Quiz
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {quizzes.map(q => (
            <div key={q.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className={`badge ${q.is_active ? 'badge-success' : 'badge-neutral'}`}>
                  {q.is_active ? 'LIVE' : 'Draft'}
                </span>
                <span className="secondary-text" style={{ fontSize: '11px' }}>{q.duration_mins} mins</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{q.title}</h3>
              <p className="secondary-text" style={{ fontSize: '12px' }}>{q.course_name} · Batch: {q.batch_id}</p>
              
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <Link href={`/dashboard/faculty/quiz/questions?id=${q.id}`} className="btn btn-sm btn-outlined" style={{ flex: 1, '--role-accent': '#185FA5' } as React.CSSProperties}>
                  Manage Questions
                </Link>
                <button 
                  onClick={() => toggleActive(q.id, q.is_active)}
                  className={`btn btn-sm ${q.is_active ? 'btn-outlined' : 'btn-filled'}`}
                  style={q.is_active ? { '--role-accent': '#E74C3C', flex: 1 } as React.CSSProperties : { background: '#27AE60', borderColor: '#27AE60', flex: 1 }}
                >
                  {q.is_active ? 'Pause' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
          {quizzes.length === 0 && <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}><p className="secondary-text">No quizzes found.</p></div>}
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>Create Quiz</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div className="form-group">
                 <label className="form-label">Course</label>
                 <select className="form-input" required value={newQuiz.offering_id} onChange={e => setNewQuiz(p => ({ ...p, offering_id: e.target.value }))}>
                   <option value="">Select Course</option>
                   {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} ({o.batch_id})</option>)}
                 </select>
               </div>
               <div className="form-group">
                 <label className="form-label">Quiz Title</label>
                 <input className="form-input" required placeholder="e.g. Unit 1 Class Test" value={newQuiz.title} onChange={e => setNewQuiz(p => ({ ...p, title: e.target.value }))} />
               </div>
               <div className="form-group">
                 <label className="form-label">Duration (Minutes)</label>
                 <input type="number" className="form-input" required value={newQuiz.duration_mins} onChange={e => setNewQuiz(p => ({ ...p, duration_mins: Number(e.target.value) }))} />
               </div>
               <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                 <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                 <button type="submit" className="btn btn-filled" style={{ flex: 1, background: '#185FA5', borderColor: '#185FA5' }}>Create Quiz</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
