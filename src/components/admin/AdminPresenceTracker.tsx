'use client'

import { useEffect, useRef } from 'react'
import { db, auth } from '@/lib/firebase/config'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { usePathname } from 'next/navigation'

export function AdminPresenceTracker() {
  const pathname = usePathname()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  async function updatePresence(page: string) {
    const user = auth.currentUser
    if (!user) return

    try {
      // 1. Update Legacy Firestore (USA) fallback
      const presenceRef = doc(db, 'admin_presence', user.uid);
      await setDoc(presenceRef, {
        admin_id: user.uid,
        full_name: user.displayName || 'Admin',
        last_seen: new Date(),
        current_page: page,
      }, { merge: true });

      // 2. Update High-Speed MongoDB (Mumbai) - NEW
      await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ping',
          data: { uid: user.uid, fullName: user.displayName || 'Admin', page }
        })
      });
    } catch (error) {
       // Ignore presence errors to keep UI smooth
    }
  }

  useEffect(() => {
    updatePresence(pathname)

    intervalRef.current = setInterval(() => {
      updatePresence(pathname)
    }, 60_000)

    const handleBeforeUnload = async () => {
      const user = auth.currentUser
      if (!user) return

      // Mark session as offline
      const sessionId = localStorage.getItem('admin_session_id')
      if (sessionId) {
        try {
          const sessionRef = doc(db, 'admin_sessions', sessionId);
          await updateDoc(sessionRef, {
            logout_at: new Date(),
            is_online: false,
          });
        } catch (e) {}
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pathname])

  return null
}
