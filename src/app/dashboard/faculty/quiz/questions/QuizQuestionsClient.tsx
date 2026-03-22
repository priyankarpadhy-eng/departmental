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
  getDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface Props {
  quizId: string
}

export function QuizQuestionsClient({ quizId }: Props) {
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: [
      { label: 'A', text: '' },
      { label: 'B', text: '' },
      { label: 'C', text: '' },
      { label: 'D', text: '' }
    ],
    correct_answer: 'A'
  })

  useEffect(() => {
    if (!quizId) return
    async function fetchData() {
      try {
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId))
        if (quizDoc.exists()) setQuiz({ id: quizDoc.id, ...quizDoc.data() })

        const qry = query(collection(db, 'quiz_questions'), where('quiz_id', '==', quizId), orderBy('order_no', 'asc'))
        const snap = await getDocs(qry)
        setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [quizId])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    try {
      const questionData = {
        quiz_id: quizId,
        ...newQuestion,
        order_no: questions.length + 1,
        created_at: new Date().toISOString()
      }
      const docRef = await addDoc(collection(db, 'quiz_questions'), questionData)
      setQuestions([...questions, { id: docRef.id, ...questionData }])
      toast.success('Question added')
      setShowAdd(false)
      setNewQuestion({
        question: '',
        options: [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }],
        correct_answer: 'A'
      })
    } catch (err) {
      toast.error('Failed to add question')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this question?')) return
    try {
      await deleteDoc(doc(db, 'quiz_questions', id))
      setQuestions(prev => prev.filter(q => q.id !== id))
      toast.success('Question removed')
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Questions...</div>
  if (!quiz) return <div style={{ padding: '40px', textAlign: 'center' }}>Quiz not found.</div>

  return (
    <>
      <Topbar title={`Questions: ${quiz.title}`} accentColor="#185FA5" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="section-heading">Question Bank</h2>
            <p className="secondary-text">{questions.length} questions in this quiz.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-filled" style={{ background: '#185FA5', borderColor: '#185FA5' }} onClick={() => setShowAdd(true)}>
              + Add Question
            </button>
            <Link href="/dashboard/faculty/quiz" className="btn btn-ghost">Back</Link>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {questions.map((q, idx) => (
            <div key={q.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, color: '#185FA5' }}>Question {idx + 1}</span>
                <button onClick={() => handleDelete(q.id)} style={{ color: '#E74C3C', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
              </div>
              <p style={{ fontSize: '15px', marginBottom: '16px', fontWeight: 500 }}>{q.question}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {q.options.map((opt: any) => (
                  <div 
                    key={opt.label} 
                    style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      background: q.correct_answer === opt.label ? 'rgba(39, 174, 96, 0.1)' : 'var(--surface-secondary)',
                      border: q.correct_answer === opt.label ? '1px solid #27AE60' : '1px solid var(--border-color)',
                      fontSize: '13px',
                      display: 'flex',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{opt.label}.</span> {opt.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {questions.length === 0 && <div className="empty-state">No questions added yet.</div>}
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>Add Question</h2>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Question Text</label>
                <textarea className="form-input" required value={newQuestion.question} onChange={e => setNewQuestion(p => ({ ...p, question: e.target.value }))} rows={2} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {newQuestion.options.map((opt, idx) => (
                  <div key={opt.label} className="form-group">
                    <label className="form-label">Option {opt.label}</label>
                    <input 
                      className="form-input" 
                      required 
                      value={opt.text} 
                      onChange={e => {
                        const next = [...newQuestion.options]
                        next[idx].text = e.target.value
                        setNewQuestion(p => ({ ...p, options: next }))
                      }} 
                    />
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">Correct Option</label>
                <select className="form-input" value={newQuestion.correct_answer} onChange={e => setNewQuestion(p => ({ ...p, correct_answer: e.target.value }))}>
                  {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>Option {l}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                 <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
                 <button type="submit" className="btn btn-filled" style={{ flex: 1, background: '#185FA5', borderColor: '#185FA5' }}>Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
