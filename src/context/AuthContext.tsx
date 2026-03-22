'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase/config'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import type { Profile } from '@/types'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // 1. Immediate optimistic check from local storage (User Side!)
  useEffect(() => {
    const cachedProfile = typeof window !== 'undefined' ? localStorage.getItem('dept_profile') : null
    if (cachedProfile) {
      try {
        setProfile(JSON.parse(cachedProfile))
        // We set initialCheckDone true optimistically to show the shell ASAP
        setInitialCheckDone(true) 
      } catch (e) {
        console.error("Error parsing cached profile:", e)
      }
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid))
          if (profileDoc.exists()) {
            const data = profileDoc.data() as Profile
            setProfile(data)
            // Persist for next load
            localStorage.setItem('dept_profile', JSON.stringify(data))
          } else {
            setProfile(null)
            localStorage.removeItem('dept_profile')
          }
        } catch (error) {
          console.error("Error fetching profile:", error)
          // Don't clear cache on network error to allow offline-ish behavior
        }
      } else {
        setProfile(null)
        localStorage.removeItem('dept_profile')
      }
      
      setLoading(false)
      setInitialCheckDone(true)
    })

    return () => unsubscribe()
  }, [])

  // Route protection logic
  useEffect(() => {
    if (!initialCheckDone || loading) return

    // Helper to prevent redundant redirects
    const safeNavigate = (target: string) => {
      if (pathname !== target) {
        router.replace(target)
      }
    }

    if (!user) {
      if (pathname.startsWith('/dashboard/')) {
        safeNavigate('/login')
      }
      return
    }

    if (!profile) {
      if (pathname.startsWith('/dashboard/')) {
        // Only redirect if we definitely attempted to fetch the profile
        safeNavigate('/')
      }
      return
    }

    // Role-based check
    if (pathname.startsWith('/dashboard/')) {
      const role = profile.role

      const isWrongRole = 
        (pathname.startsWith('/dashboard/admin') && role !== 'admin') ||
        (pathname.startsWith('/dashboard/hod') && role !== 'hod') ||
        (pathname.startsWith('/dashboard/faculty') && role !== 'faculty') ||
        (pathname.startsWith('/dashboard/student') && role !== 'student') ||
        (pathname.startsWith('/dashboard/alumni') && role !== 'alumni')
      
      if (isWrongRole) {
        safeNavigate('/login')
      }
    }
  }, [pathname, user, profile, loading, initialCheckDone, router])

  // Instead of a blocking full-screen loader for EVERYONE, 
  // only block if we truly don't know who the user is and it's NOT an optimistic load.
  if (!initialCheckDone && !profile) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-primary)' }}>
        <div className="loader"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
