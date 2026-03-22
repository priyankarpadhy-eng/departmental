'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { AdminUsersClient } from './AdminUsersClient'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // 1. Check cache for instant load
      const cached = sessionStorage.getItem('cache_admin_users_data')
      if (cached) {
        const decoded = JSON.parse(cached)
        setUsers(decoded.users || [])
        setDepartments(decoded.departments || [])
        setBatches(decoded.batches || [])
        setLoading(false)
      }

      try {
        const [usersSnap, deptsSnap, batchesSnap] = await Promise.all([
          getDocs(query(collection(db, 'profiles'), orderBy('created_at', 'desc'))),
          getDocs(query(collection(db, 'departments'), orderBy('name'))),
          getDocs(query(collection(db, 'batches'), orderBy('graduation_year', 'desc')))
        ])

        const freshUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const freshDepts = deptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const freshBatches = batchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        setUsers(freshUsers)
        setDepartments(freshDepts)
        setBatches(freshBatches)

        // 2. Update cache
        sessionStorage.setItem('cache_admin_users_data', JSON.stringify({
          users: freshUsers,
          departments: freshDepts,
          batches: freshBatches,
          updatedAt: new Date().toISOString()
        }))
      } catch (err) {
        console.error('Error fetching users data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])


  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading user management...</div>
  }

  return (
    <>
      <Topbar title="User management" accentColor="#E24B4A" />
      <div className="content-container">
        <AdminUsersClient
          users={users as any}
          departments={departments as any}
          batches={batches as any}
        />
      </div>
    </>
  )
}
