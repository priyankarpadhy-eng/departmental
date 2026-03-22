'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useRef } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  addDoc,
  doc,
  getDoc
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface Props {
  quizId: string
}

export function QuizTakerClient({ quizId }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    if (!quizId) return
    async function fetchData() {
      try {
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId))
        if (!quizDoc.exists()) {
          toast.error('Quiz not found')
          router.push('/dashboard/student/quiz')
          return
        }
        const data = { id: quizDoc.id, ...(quizDoc.data() as any) }
        setQuiz(data)
        setTimeLeft(data.duration_mins * 60)

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

  useEffect(() => {
    if (loading || submitted || timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [loading, submitted, timeLeft])

  async function handleAutoSubmit() {
    if (submitted) return
    toast.error('Time up! Auto-submitting...')
    submitQuiz()
  }

  async function submitQuiz() {
    if (submitted || !user) return
    setSubmitted(true)
    clearInterval(timerRef.current)

    // Calculate score
    let score = 0
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) {
        score += 10 // 10 points per correct answer
      }
    })

    try {
      await addDoc(collection(db, 'quiz_attempts'), {
        quiz_id: quizId,
        student_id: user.uid,
        score,
        answers,
        submitted_at: new Date().toISOString()
      })
      toast.success(`Quiz submitted! Your score: ${score} XP`)
    } catch (err) {
      toast.error('Failed to save attempt')
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Preparing Quiz...</div>
  if (!quiz) return null

  if (submitted) {
    return (
      <div className="content-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎯</div>
          <h2 className="section-heading">Quiz Completed!</h2>
          <p className="secondary-text" style={{ marginBottom: '24px' }}>Your responses have been recorded safely.</p>
          <Link href="/dashboard/student/quiz" className="btn btn-filled" style={{ background: '#0F6E56', borderColor: '#0F6E56' }}>Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentIdx]

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '60px', background: '#0F6E56', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 100 }}>
        <div style={{ fontWeight: 600 }}>{quiz.title}</div>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '18px' }}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="content-container" style={{ paddingTop: '80px' }}>
        <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Question {currentIdx + 1} of {questions.length}</span>
            <div style={{ width: '100px', height: '4px', background: 'var(--surface-secondary)', borderRadius: '2px', overflow: 'hidden', alignSelf: 'center' }}>
               <div style={{ width: `${((currentIdx + 1) / questions.length) * 100}%`, height: '100%', background: '#0F6E56' }} />
            </div>
          </div>

          {currentQ ? (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>{currentQ.question}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {currentQ.options.map((opt: any) => (
                  <button 
                    key={opt.label}
                    onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: opt.label }))}
                    style={{ 
                      padding: '16px', 
                      borderRadius: '12px', 
                      border: answers[currentQ.id] === opt.label ? '2px solid #0F6E56' : '1px solid var(--border-color)',
                      background: answers[currentQ.id] === opt.label ? 'rgba(15, 110, 86, 0.05)' : 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: answers[currentQ.id] === opt.label ? '#0F6E56' : 'var(--text-tertiary)' }}>{opt.label}.</span>
                    <span style={{ color: 'var(--text-primary)' }}>{opt.text}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">No questions found.</div>
          )}

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
            <button 
              disabled={currentIdx === 0} 
              onClick={() => setCurrentIdx(prev => prev - 1)}
              className="btn btn-ghost"
            >
              Previous
            </button>
            
            {currentIdx === questions.length - 1 ? (
              <button 
                onClick={submitQuiz}
                className="btn btn-filled" 
                style={{ background: '#1A7A46', borderColor: '#1A7A46' }}
              >
                Submit Quiz
              </button>
            ) : (
              <button 
                onClick={() => setCurrentIdx(prev => prev + 1)}
                className="btn btn-filled" 
                style={{ background: '#0F6E56', borderColor: '#0F6E56' }}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
