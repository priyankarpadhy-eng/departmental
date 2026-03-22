'use client'

import { useSearchParams } from 'next/navigation'
import { QuizTakerClient } from './QuizTakerClient'

export default function Page() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  if (!id) return <div style={{ padding: '40px', textAlign: 'center' }}>No quiz ID provided.</div>

  return <QuizTakerClient quizId={id} />
}
