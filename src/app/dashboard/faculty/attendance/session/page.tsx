'use client'

import { useSearchParams } from 'next/navigation'
import { AttendanceSessionClient } from './AttendanceSessionClient'

export default function Page() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('id')

  if (!sessionId) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>No session ID provided.</div>
  }

  return <AttendanceSessionClient sessionId={sessionId} />
}
