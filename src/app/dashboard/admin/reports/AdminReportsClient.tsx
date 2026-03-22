'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  getDocs,
  query,
  limit,
  orderBy
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import toast from 'react-hot-toast'

export function AdminReportsClient() {
  const [stats, setStats] = useState<any>({
    users: 0,
    attendance: 0,
    quizzes: 0,
    materials: 0
  })
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersSnap, attSnap, quizSnap, matSnap, logsSnap] = await Promise.all([
          getDocs(collection(db, 'profiles')),
          getDocs(collection(db, 'attendance_records')),
          getDocs(collection(db, 'quizzes')),
          getDocs(collection(db, 'study_materials')),
          getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(10)))
        ])

        setStats({
          users: usersSnap.size,
          attendance: attSnap.size,
          quizzes: quizSnap.size,
          materials: matSnap.size
        })
        setRecentLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        toast.error('Failed to load system reports')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Generating system reports...</div>

  return (
    <>
      <Topbar title="System Reports" accentColor="#E24B4A" />
      <div className="content-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats.users}</div>
            <div className="secondary-text">Registered profiles</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Attendance Records</div>
            <div className="stat-value">{stats.attendance}</div>
            <div className="secondary-text">Entries processed</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Online Quizzes</div>
            <div className="stat-value">{stats.quizzes}</div>
            <div className="secondary-text">Created by faculty</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Shared Resources</div>
            <div className="stat-value">{stats.materials}</div>
            <div className="secondary-text">Study materials</div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-heading" style={{ marginBottom: '16px' }}>Recent Audit Activity</h2>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map(log => (
                  <tr key={log.id}>
                    <td className="secondary-text" style={{ fontSize: '11px' }}>
                        {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{log.actorName || 'System'}</div>
                    </td>
                    <td>
                        <span className="badge badge-neutral">{log.module}</span>
                    </td>
                    <td>
                        <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '10px' }}>{log.action}</span>
                    </td>
                    <td className="secondary-text" style={{ maxWidth: '300px' }}>{log.description}</td>
                  </tr>
                ))}
                {recentLogs.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No logs found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
