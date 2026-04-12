'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, where, orderBy, limit, getDocs, getCountFromServer } from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'

export default function AdminDashboard() {
  const { profile, user } = useAuth()
  const [stats, setStats] = useState<any[]>([])
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [onlineAdmins, setOnlineAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [moodCounts, setMoodCounts] = useState<Record<string, number>>({})

  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<any>(null)
  const [migrationError, setMigrationError] = useState<string | null>(null)

  const triggerMigration = async () => {
    if (!confirm('Sync ALL Firestore data to MongoDB Atlas (Mumbai)? This resolves site lag. Continue?')) return
    setMigrating(true)
    setMigrationError(null)
    try {
      const res = await fetch('/api/admin/migrate-firestore-to-mongo', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Migration failed')
      setMigrationResult(data)
    } catch (err: any) {
      console.error(err)
      setMigrationError(err.message || 'Server error during sync')
    } finally {
      setMigrating(false)
    }
  }

  useEffect(() => {
    if (!profile || profile.role !== 'admin' || !user) return

    async function fetchData() {
      // 1. Check Cache first for instant load
      const cacheKey = `cache_admin_dash_${user?.uid || 'guest'}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const decoded = JSON.parse(cached)
        setMoodCounts(decoded.moodCounts || {})
        setStats(decoded.stats || [])
        setRecentLogs(decoded.recentLogs || [])
        setOnlineAdmins(decoded.onlineAdmins || [])
        setLoading(false)
      }

      try {
        if (!user) return
        // 2. High-Speed MongoDB Unified API (Mumbai)
        const response = await fetch(`/api/admin/dashboard?uid=${user?.uid}`)
        if (response.ok) {
          const data = await response.json()
          setMoodCounts(data.moodCounts || {})
          
          const s = data.stats || {}
          const newStats = [
            { label: 'Total users', value: s.usersCount || 0, icon: '👥', color: '#E24B4A', bg: '#FDEDED' },
            { label: 'Students', value: s.studentsCount || 0, icon: '🎓', color: '#0F6E56', bg: '#E7F4F0' },
            { label: 'Faculty members', value: s.facultyCount || 0, icon: '👨‍🏫', color: '#185FA5', bg: '#E8F0F9' },
            { label: 'Active semester(s)', value: s.semesterDisplay || 'None', icon: '📅', color: '#534AB7', bg: '#EEEDF9', isText: true },
          ]
          setStats(newStats)
          setRecentLogs(data.recentLogs || [])
          setOnlineAdmins(data.onlineAdmins || [])
          setLoading(false)

          // 3. Update Cache
          sessionStorage.setItem(cacheKey, JSON.stringify({
            moodCounts: data.moodCounts,
            stats: newStats,
            recentLogs: data.recentLogs,
            onlineAdmins: data.onlineAdmins,
            updatedAt: new Date().toISOString()
          }))
          return
        }

        // 4. Fallback: Original Firestore Logic (USA)
        const [
          usersCountResult,
          studentsCountResult,
          facultyCountResult,
          activeSemesterSnap,
          recentLogsSnap,
          onlineAdminsSnap,
          moodSnap
        ] = await Promise.all([
          getCountFromServer(collection(db, 'profiles')),
          getCountFromServer(query(collection(db, 'profiles'), where('role', '==', 'student'))),
          getCountFromServer(query(collection(db, 'profiles'), where('role', '==', 'faculty'))),
          getDocs(query(collection(db, 'semesters'), where('is_active', '==', true))),
          getDocs(query(collection(db, 'audit_logs'), orderBy('created_at', 'desc'), limit(8))),
          getDocs(query(collection(db, 'admin_presence'), where('last_seen', '>=', new Date(Date.now() - 2 * 60 * 1000)))),
          getDocs(query(collection(db, 'student_posts'), limit(50)))
        ])

        const moods: Record<string, number> = {}
        moodSnap.docs.forEach(d => {
            const m = d.data().mood || '😊'
            moods[m] = (moods[m] || 0) + 1
        })
        setMoodCounts(moods)

        const activeSemesters = activeSemesterSnap.docs.map(doc => doc.data().name)
        const semesterDisplay = activeSemesters.length === 0 ? 'None' : 
                                 activeSemesters.length === 1 ? activeSemesters[0] : 
                                 `${activeSemesters.length} Active`

        const fallbackStats = [
          { label: 'Total users', value: usersCountResult.data().count, icon: '👥', color: '#E24B4A', bg: '#FDEDED' },
          { label: 'Students', value: studentsCountResult.data().count, icon: '🎓', color: '#0F6E56', bg: '#E7F4F0' },
          { label: 'Faculty members', value: facultyCountResult.data().count, icon: '👨‍🏫', color: '#185FA5', bg: '#E8F0F9' },
          { label: 'Active semester(s)', value: semesterDisplay, icon: '📅', color: '#534AB7', bg: '#EEEDF9', isText: true },
        ]
        setStats(fallbackStats)

        const fallbackLogs = recentLogsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate().toISOString() : new Date().toISOString()
        }))
        setRecentLogs(fallbackLogs)

        const fallbackOnline = onlineAdminsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setOnlineAdmins(fallbackOnline)

        // 5. Update Cache from fallback
        sessionStorage.setItem(cacheKey, JSON.stringify({
          moodCounts: moods,
          stats: fallbackStats,
          recentLogs: fallbackLogs,
          onlineAdmins: fallbackOnline,
          updatedAt: new Date().toISOString()
        }))
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [profile, user])


  const actionColors: Record<string, string> = {
    created: 'badge-success',
    updated: 'badge-info',
    deleted: 'badge-error',
    login: 'badge-neutral',
    logout: 'badge-neutral',
    exported: 'badge-warning',
    viewed: 'badge-neutral',
  }

  return (
    <>
      <Topbar title="Admin overview" accentColor="#E24B4A" />

      <div className="content-container">
        {/* Migration Alert Hub */}
        {!migrationResult && !migrating && !migrationError ? (
           <div className="card" style={{ marginBottom: '24px', border: '1px solid #534AB7', background: 'rgba(83, 74, 183, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
               <div style={{ background: '#EEEDF9', padding: '12px', borderRadius: '12px', fontSize: '24px' }}>⚡</div>
               <div>
                 <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#534AB7' }}>Performance Migration Available</h3>
                 <p className="secondary-text" style={{ fontSize: '12px' }}>Move your data to MongoDB Atlas (Mumbai) to eliminate regional lag.</p>
               </div>
             </div>
             <button className="btn btn-filled" onClick={triggerMigration} style={{ background: '#534AB7', borderColor: '#534AB7' }}>
               Start Sync
             </button>
           </div>
        ) : migrationError ? (
            <div className="card" style={{ marginBottom: '24px', border: '1px solid #E24B4A', background: 'rgba(226, 75, 74, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: '#FDEDED', padding: '12px', borderRadius: '12px', fontSize: '24px' }}>❌</div>
                    <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#E24B4A' }}>Sync Failed</h3>
                        <p className="secondary-text" style={{ fontSize: '12px' }}>{migrationError}</p>
                    </div>
                </div>
                <button className="btn btn-filled" onClick={triggerMigration} style={{ background: '#E24B4A', borderColor: '#E24B4A' }}>Retry Sync</button>
            </div>
        ) : migrationResult ? (
          <div className="card" style={{ marginBottom: '24px', border: '1px solid #0F6E56', background: 'rgba(15, 110, 86, 0.05)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                 <div style={{ background: '#E7F4F0', padding: '12px', borderRadius: '12px', fontSize: '24px' }}>✅</div>
                 <div>
                   <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F6E56' }}>Migration Successful</h3>
                   <p className="secondary-text" style={{ fontSize: '12px' }}>
                       Successfully moved {Number(Object.values(migrationResult.counts || {}).reduce((a: any, b: any) => Number(a) + Number(b), 0))} records.
                   </p>
                 </div>
               </div>
               <button className="btn btn-sm btn-ghost" onClick={() => setMigrationResult(null)}>Dismiss</button>
             </div>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: '24px', textAlign: 'center', border: '1px dashed #534AB7' }}>
             <div className="loader" style={{ margin: '0 auto 12px auto', width: '24px', height: '24px' }}></div>
             <p style={{ fontSize: '13px', fontWeight: 500 }}>Transferring data records from Firebase (USA) to Mumbai (MongoDB)...</p>
             <p className="secondary-text" style={{ fontSize: '11px' }}>Please do not close this tab. This may take a minute for large data.</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {loading ? [1,2,3,4].map(i => (
             <div key={i} className="stat-card skeleton" style={{ height: '100px', opacity: 0.5 }}></div>
          )) : stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-icon" style={{ background: stat.bg, fontSize: '18px' }}>{stat.icon}</div>
              <div className={stat.isText ? 'section-heading' : 'stat-value'} style={{ color: stat.color }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          
          <div className="card" style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', color: 'white' }}>
            <h2 className="section-heading" style={{ color: 'white', marginBottom: '4px' }}>Department Sentiment</h2>
            <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '20px' }}>Real-time student mood aggregated from the social feed</p>
            {loading ? (
                <div className="skeleton" style={{ height: '60px', width: '100%', opacity: 0.2 }}></div>
            ) : (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {Object.entries(moodCounts).length > 0 ? Object.entries(moodCounts).map(([emoji, count]) => (
                        <div key={emoji} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '24px' }}>{emoji}</span>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, fontSize: '18px' }}>{count}</div>
                                <div style={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase' }}>Students</div>
                            </div>
                        </div>
                    )) : (
                        <p style={{ opacity: 0.5, fontSize: '12px' }}>No mood data available yet.</p>
                    )}
                </div>
            )}
          </div>

          <div className="card">
            <div className="section-row">
              <h2 className="section-heading">Admin presence</h2>
              <span className="badge badge-success">{onlineAdmins.length} online</span>
            </div>
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[1,2].map(i => <div key={i} className="skeleton" style={{ height: '36px', borderRadius: '8px', opacity: 0.3 }}></div>)}
                </div>
            ) : onlineAdmins.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {onlineAdmins.map((presence: any, idx) => (
                  <div key={presence.id || presence._id || idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="avatar avatar-md" style={{ background: 'var(--accent-admin-bg)', color: 'var(--accent-admin)' }}>
                      {(presence.full_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{presence.full_name || 'Admin'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{presence.current_page}</div>
                    </div>
                    <span className="online-dot online" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="secondary-text">No other admins online</p>
            )}
          </div>

          <div className="card">
            <div className="section-row">
              <h2 className="section-heading">Recent activity</h2>
              <Link href="/dashboard/admin/audit" style={{ fontSize: '12px', color: 'var(--accent-admin)', textDecoration: 'none' }}>View all →</Link>
            </div>
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '36px', borderRadius: '8px', opacity: 0.3 }}></div>)}
                </div>
            ) : recentLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentLogs.map((log: any, index: number) => (
                  <div key={log.id || log._id || index} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div className="avatar avatar-sm" style={{ background: 'var(--surface-secondary)', flexShrink: 0, marginTop: '2px' }}>
                      {(log.full_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{log.description}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {timeAgo(log.createdAt || log.created_at)} · {log.module}
                      </div>
                    </div>
                    <span className={`badge ${actionColors[log.action] || 'badge-neutral'}`}>{log.action}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="secondary-text">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function timeAgo(date: any) {
  if (!date) return 'just now'
  const time = date.toDate ? date.toDate().getTime() : new Date(date).getTime()
  const diff = Date.now() - time
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
