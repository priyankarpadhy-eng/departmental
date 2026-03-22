'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, where, limit, getDocs, getCountFromServer } from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'

export default function HodDashboard() {
  const { profile, user } = useAuth()
  const [stats, setStats] = useState<any[]>([])
  const [defaulters, setDefaulters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile || profile.role !== 'hod') return

    async function fetchData() {
      const deptId = profile?.dept_id

      try {
        if (!user) return;
        // 2. High-Speed MongoDB Unified API
        const response = await fetch(`/api/hod/dashboard?uid=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          const activeSems = data.activeSemesters || [];
          const activeSemDisplay = activeSems.length === 0 ? 'None' : 
                                   activeSems.length === 1 ? activeSems[0].name : 
                                   `${activeSems.length} Active`;

          setStats([
            { label: 'Students', value: data.studentCount ?? 0, color: '#0F6E56', bg: '#E7F4F0', icon: '🎓' },
            { label: 'Faculty', value: data.facultyCount ?? 0, color: '#185FA5', bg: '#E8F0F9', icon: '👨‍🏫' },
            { label: 'Pending approvals', value: data.pendingApprovals ?? 0, color: '#9A6B00', bg: '#FFF8E1', icon: '📋' },
            { label: 'Active semester(s)', value: activeSemDisplay, color: '#534AB7', bg: '#EEEDF9', icon: '📅', isText: true },
          ]);
          setDefaulters(data.defaulters || []);
          setLoading(false);
          return;
        }

        // 3. Fallback: Original Firestore logic
        const [
          studentCountSnap,
          facultyCountSnap,
          activeSemSnap,
          defaultersSnap,
          pendingLeaveSnap,
          pendingStudentReqSnap,
        ] = await Promise.all([
          getCountFromServer(query(collection(db, 'profiles'), where('role', '==', 'student'), where('dept_id', '==', deptId))),
          getCountFromServer(query(collection(db, 'profiles'), where('role', '==', 'faculty'), where('dept_id', '==', deptId))),
          getDocs(query(collection(db, 'semesters'), where('dept_id', '==', deptId), where('is_active', '==', true))),
          getDocs(query(collection(db, 'attendance_summary'), where('attendance_pct', '<', 75), limit(5))),
          getCountFromServer(query(collection(db, 'leave_requests'), where('status', '==', 'pending'))),
          getCountFromServer(query(collection(db, 'student_requests'), where('status', '==', 'pending'))),
        ])

        const activeSemCount = activeSemSnap.docs.length
        const activeSemDisplay = activeSemCount === 0 ? 'None' : 
                                 activeSemCount === 1 ? activeSemSnap.docs[0].data().name : 
                                 `${activeSemCount} Active`
        const pendingApprovals = (pendingLeaveSnap.data().count || 0) + (pendingStudentReqSnap.data().count || 0)

        setStats([
          { label: 'Students', value: studentCountSnap.data().count ?? 0, color: '#0F6E56', bg: '#E7F4F0', icon: '🎓' },
          { label: 'Faculty', value: facultyCountSnap.data().count ?? 0, color: '#185FA5', bg: '#E8F0F9', icon: '👨‍🏫' },
          { label: 'Pending approvals', value: pendingApprovals, color: '#9A6B00', bg: '#FFF8E1', icon: '📋' },
          { label: 'Active semester(s)', value: activeSemDisplay, color: '#534AB7', bg: '#EEEDF9', icon: '📅', isText: true },
        ])

        setDefaulters(defaultersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching HOD dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [profile])

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading HOD overview...</div>
  }

  return (
    <>
      <Topbar title={`Good ${getGreeting()}, ${(profile && profile.full_name || '').split(' ')[0] || 'HOD'}`} accentColor="#534AB7" />
      <div className="content-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, fontSize: '18px' }}>{s.icon}</div>
              <div className={s.isText ? 'section-heading' : 'stat-value'} style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-row">
            <h2 className="section-heading">Attendance defaulters (below 75%)</h2>
            <Link href="/dashboard/hod/defaulters" style={{ fontSize: '12px', color: '#534AB7', textDecoration: 'none' }}>View all →</Link>
          </div>
          {defaulters.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr><th>Student</th><th>Roll no.</th><th>Subject</th><th>Attendance</th><th>Classes needed</th></tr>
              </thead>
              <tbody>
                {defaulters.map((d: any) => {
                  const needed = Math.max(0, Math.ceil((0.75 * (d.total_sessions || 0) - (d.present_count || 0)) / 0.25))
                  return (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 500 }}>{d.student_name || '—'}</td>
                      <td className="secondary-text">{d.roll_no || '—'}</td>
                      <td>{d.course_name || '—'}</td>
                      <td>
                        <span className="badge badge-error">{d.attendance_pct || 0}%</span>
                      </td>
                      <td className="secondary-text">{needed} more</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p className="secondary-text">No defaulters — all students above 75% 🎉</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
