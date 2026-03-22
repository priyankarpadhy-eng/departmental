'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'

export function HodFacultyClient() {
  const { profile } = useAuth()
  const [faculty, setFaculty] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.dept_id) return

    async function fetchFaculty() {
      try {
        const q = query(
          collection(db, 'profiles'),
          where('role', '==', 'faculty'),
          where('dept_id', '==', profile.dept_id)
        )
        const snap = await getDocs(q)
        setFaculty(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching faculty:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFaculty()
  }, [profile])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading department faculty...</div>

  return (
    <>
      <Topbar title="Faculty Management" accentColor="#534AB7" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="section-heading">Department Faculty</h2>
            <p className="secondary-text">View and manage faculty members in your department.</p>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Faculty Member</th>
                <th>Designation</th>
                <th>Expertise</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculty.map(f => (
                <tr key={f.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar avatar-sm">{f.full_name?.charAt(0)}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{f.full_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{f.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="secondary-text">{f.designation || 'Lecturer'}</td>
                  <td className="secondary-text">{f.expertise || 'Engineering'}</td>
                  <td>
                    <span className={`badge ${f.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {f.is_active ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-ghost">View Performance</button>
                  </td>
                </tr>
              ))}
              {faculty.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>No faculty found for your department.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
