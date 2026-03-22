'use client'

import { useSearchParams } from 'next/navigation'
import { AssignmentEvaluationClient } from './AssignmentEvaluationClient'

export default function Page() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  if (!id) return <div style={{ padding: '40px', textAlign: 'center' }}>No assignment ID provided.</div>

  return <AssignmentEvaluationClient assignmentId={id} />
}
