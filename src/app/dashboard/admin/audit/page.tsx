'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { AuditDashboardClient } from './AuditDashboardClient'
import { AdminPresenceTracker } from '@/components/admin/AdminPresenceTracker'

export default function AuditPage() {
  const [onlineAdmins, setOnlineAdmins] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loginSessions, setLoginSessions] = useState<any[]>([])
  const [allAdmins, setAllAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 1. Initial High-Speed MongoDB Fetch
  useEffect(() => {
    async function loadInitialData() {
      // 1a. Check Cache first
      const cacheKey = 'cache_admin_audit_data'
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const decoded = JSON.parse(cached)
        setAuditLogs(decoded.logs || [])
        setOnlineAdmins(decoded.onlineAdmins || [])
        setLoginSessions(decoded.loginSessions || [])
        setLoading(false)
      }

      try {
        const response = await fetch('/api/admin/audit?limit=100');
        if (response.ok) {
          const data = await response.json();
          const logs = data.logs || []
          const online = data.onlineAdmins || []
          const sessions = data.loginSessions || []
          
          setAuditLogs(logs);
          setOnlineAdmins(online);
          setLoginSessions(sessions);

          // 1b. Update Cache
          sessionStorage.setItem(cacheKey, JSON.stringify({
            logs,
            onlineAdmins: online,
            loginSessions: sessions,
            updatedAt: new Date().toISOString()
          }))
        }
      } catch (e) {
        console.error("MongoDB Audit Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // 2. Real-time Listeners (Firestore Fallback & Live Updates)
  useEffect(() => {
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000)

    const unsubPresence = onSnapshot(query(collection(db, 'admin_presence'), where('last_seen', '>=', twoMinsAgo)), (snap) => {
      setOnlineAdmins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    const unsubAudit = onSnapshot(query(collection(db, 'audit_logs'), orderBy('created_at', 'desc'), limit(100)), (snap) => {
      setAuditLogs(snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate().toISOString() : new Date().toISOString()
      })))
    })

    const unsubSessions = onSnapshot(query(collection(db, 'admin_sessions'), orderBy('login_at', 'desc'), limit(50)), (snap) => {
      setLoginSessions(snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        login_at: doc.data().login_at?.toDate ? doc.data().login_at.toDate().toISOString() : new Date().toISOString()
      })))
    })

    // Fetch All Admins Filter
    async function fetchAdmins() {
      try {
        const q = query(collection(db, 'profiles'), where('role', '==', 'admin'), where('is_active', '==', true))
        const snap = await getDocs(q)
        setAllAdmins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (e) { console.error(e) }
    }
    fetchAdmins()

    return () => {
      unsubPresence()
      unsubAudit()
      unsubSessions()
    }
  }, [])

  if (loading) {
    return <div style={{ padding: '80px', textAlign: 'center' }}><div className="loader" style={{ margin: 'auto' }}></div></div>
  }

  return (
    <>
      <AdminPresenceTracker />
      <Topbar title="Audit & activity" accentColor="#E24B4A" />
      <div className="content-container">
        <AuditDashboardClient
          onlineAdmins={onlineAdmins}
          auditLogs={auditLogs}
          loginSessions={loginSessions}
          allAdmins={allAdmins}
        />
      </div>
    </>
  )
}

