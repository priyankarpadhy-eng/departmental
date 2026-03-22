'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
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
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function QuizStudentClient() {
  const { user, profile } = useAuth()
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [attempts, setAttempts] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function fetchData() {
      try {
        const qSnap = await getDocs(query(collection(db, 'quizzes'), where('batch_id', '==', profile?.batch_id), where('is_active', '==', true)))
        setQuizzes(qSnap.docs.map(d => ({ id: d.id, ...d.data() })))

        const attSnap = await getDocs(query(collection(db, 'quiz_attempts'), where('student_id', '==', user?.uid)))
        const attMap: Record<string, any> = {}
        attSnap.docs.forEach(d => {
          attMap[d.data().quiz_id] = d.data()
        })
        setAttempts(attMap)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [profile])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Quizzes...</div>

  return (
    <>
      <Topbar title="Online Assessments" accentColor="#0F6E56" />
      <div className="content-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {quizzes.map(q => {
            const attempt = attempts[q.id]
            return (
              <div key={q.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className={`badge ${attempt ? 'badge-neutral' : 'badge-success'}`}>
                    {attempt ? 'Completed' : 'Available'}
                  </span>
                  <span className="secondary-text" style={{ fontSize: '11px' }}>{q.duration_mins} mins</span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{q.title}</h3>
                <p className="secondary-text" style={{ fontSize: '12px' }}>{q.course_name}</p>
                
                <div style={{ marginTop: '20px' }}>
                   {attempt ? (
                     <div style={{ padding: '12px', background: 'var(--surface-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                       <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Your Score</div>
                       <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F6E56' }}>{attempt.score} XP</div>
                     </div>
                   ) : (
                      <Link href={`/dashboard/student/quiz/take?id=${q.id}`} className="btn btn-filled" style={{ display: 'block', textAlign: 'center', background: '#0F6E56', borderColor: '#0F6E56' }}>
                        Start Quiz
                      </Link>
                   )}
                </div>
              </div>
            )
          })}
          {quizzes.length === 0 && (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px' }}>
              <p className="secondary-text">No active quizzes found for your batch.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
