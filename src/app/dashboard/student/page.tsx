'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import { DigitalIDCard } from '@/components/dashboard/DigitalIDCard'

export default function StudentDashboard() {
  const { profile, user } = useAuth()
  const [todaySlots, setTodaySlots] = useState<any[]>([])
  const [attendanceSummaries, setAttendanceSummaries] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [activeQuizzes, setActiveQuizzes] = useState<any[]>([])
  const [pinned, setPinned] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLiveSession, setActiveLiveSession] = useState<any>(null)

  useEffect(() => {
    if (!profile?.batch_id) return
    const q = query(collection(db, 'live_sessions'), where('batch_id', '==', profile.batch_id))
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setActiveLiveSession({ id: snap.docs[0].id, ...snap.docs[0].data() })
      } else {
        setActiveLiveSession(null)
      }
    })
    return () => unsubscribe()
  }, [profile])

  useEffect(() => {
    if (!profile || !user) return

    async function fetchData() {
      const today = new Date().getDay()
      const dayIndex = today === 0 ? 6 : today - 1

      // 1. Check cache for instant load
      const cacheKey = `cache_student_dash_${user?.uid || 'guest'}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const decoded = JSON.parse(cached)
        setTodaySlots(decoded.todaySlots || [])
        setAttendanceSummaries(decoded.attendanceSummaries || [])
        setAssignments(decoded.assignments || [])
        setActiveQuizzes(decoded.activeQuizzes || [])
        setPinned(decoded.pinned || [])
        setLoading(false)
      }

      try {
        if (!user) return;
        // 2. Try the High-Speed Unified MongoDB API First
        const response = await fetch(`/api/student/dashboard?uid=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setTodaySlots(data.timetable || []);
          setAttendanceSummaries(data.attendanceSummary || []);
          setAssignments(data.assignments || []);
          setActiveQuizzes(data.quizzes || []);
          setPinned(data.pinned || []);
          setLoading(false);

          // Update cache
          sessionStorage.setItem(cacheKey, JSON.stringify({
            todaySlots: data.timetable,
            attendanceSummaries: data.attendanceSummary,
            assignments: data.assignments,
            activeQuizzes: data.quizzes,
            pinned: data.pinned,
            updatedAt: new Date().toISOString()
          }));
          return; // Exit if MongoDB fetch succeeds
        }
        
        // 3. Fallback to Original Firestore Logic (If MongoDB not setup yet)
        const [
          slotsSnap,
          attendanceSnap,
          assignmentsSnap,
          quizzesSnap,
          pinnedSnap
        ] = await Promise.all([
          getDocs(query(
            collection(db, 'timetable_slots'),
            where('batch_id', '==', (profile && profile.batch_id) || ''),
            where('day_of_week', '==', dayIndex),
            orderBy('start_time')
          )),
          getDocs(query(
            collection(db, 'attendance_summary'),
            where('student_id', '==', (user && user.uid) || '')
          )),
          getDocs(query(
            collection(db, 'assignments'),
            where('due_date', '>=', new Date().toISOString()),
            orderBy('due_date'),
            limit(5)
          )),
          getDocs(query(
            collection(db, 'quiz'),
            where('is_active', '==', true),
            limit(3)
          )),
          getDocs(query(
            collection(db, 'announcements'),
            where('is_pinned', '==', true),
            limit(3)
          ))
        ])

        const freshSlots = slotsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const freshAttendance = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const freshAssignments = assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const freshQuizzes = quizzesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const freshPinned = pinnedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        setTodaySlots(freshSlots)
        setAttendanceSummaries(freshAttendance)
        setAssignments(freshAssignments)
        setActiveQuizzes(freshQuizzes)
        setPinned(freshPinned)

        // Update cache
        sessionStorage.setItem(cacheKey, JSON.stringify({
          todaySlots: freshSlots,
          attendanceSummaries: freshAttendance,
          assignments: freshAssignments,
          activeQuizzes: freshQuizzes,
          pinned: freshPinned,
          updatedAt: new Date().toISOString()
        }))
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [profile, user])

  const defaulterSubjects = (attendanceSummaries || []).filter(s => (s.attendance_pct || 0) < 75)

  const SkeletonCard = () => (
    <div className="card skeleton" style={{ height: '160px', opacity: 0.5 }}></div>
  )

  return (
    <>
      <Topbar title={`Good ${getGreeting()}, ${(profile && profile.full_name || '').split(' ')[0] || 'Student'}`} accentColor="#0F6E56" />
      <div className="content-container">
        {/* Verification Alert (only if profile loaded) */}
        {!loading && profile?.verification_status !== 'verified' && (
          <div style={{
            background: profile?.verification_status === 'rejected' ? 'var(--status-error-bg)' : 'rgba(234, 179, 8, 0.1)',
            border: `1px solid ${profile?.verification_status === 'rejected' ? 'var(--status-error)' : 'var(--accent-hod)'}`,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: profile?.verification_status === 'rejected' ? 'var(--status-error)' : 'var(--accent-hod)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              {profile?.verification_status === 'rejected' ? '❌' : '⏳'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: profile?.verification_status === 'rejected' ? 'var(--status-error)' : 'var(--text-primary)' }}>
                {profile?.verification_status === 'rejected' ? 'Account Verification Rejected' : 'Account Verification Required'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {profile?.verification_status === 'rejected' 
                  ? `Your request was rejected: ${profile.rejection_reason || 'Please update your details.'}`
                  : profile?.verification_status === 'pending'
                  ? 'Your profile is currently under review by the administration.'
                  : 'Please complete your profile and request verification to access all features.'
                }
              </p>
            </div>
            <Link href="/onboarding" className="btn btn-filled" style={{ background: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {profile?.verification_status === 'rejected' || !profile?.verification_status ? 'Update Profile' : 'View Details'}
            </Link>
          </div>
        )}

        {/* Phase 3: Live Class Banner */}
        <div style={{
          background: activeLiveSession ? 'linear-gradient(90deg, #185FA5 0%, #1a73e8 100%)' : 'linear-gradient(90deg, #0F6E56 0%, #15803d 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.5s ease'
        }}>
          <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ 
                width: '10px', 
                height: '10px', 
                background: activeLiveSession ? '#ff4d4d' : '#4ade80', 
                borderRadius: '50%', 
                boxShadow: `0 0 10px ${activeLiveSession ? '#ff4d4d' : '#4ade80'}`,
                animation: activeLiveSession ? 'pulse 1.5s infinite' : 'none'
              }}></div>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {activeLiveSession ? 'Live Now' : 'Virtual Classroom'}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
              {activeLiveSession ? activeLiveSession.course_name : 'No Active Lectures'}
            </h2>
            <p style={{ opacity: 0.9, fontSize: '13px', marginTop: '4px' }}>
              {activeLiveSession 
                ? `Prof. ${activeLiveSession.faculty_name} is currently teaching live.` 
                : 'Join your virtual meeting room for collaborative learning and discussions.'
              }
            </p>
            <button 
              className="btn" 
              style={{ 
                background: 'white', 
                color: activeLiveSession ? '#185FA5' : '#0F6E56', 
                marginTop: '16px', 
                fontWeight: 600, 
                padding: '10px 24px', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onClick={() => window.open(`https://meet.jit.si/${activeLiveSession?.room_name || 'dept-portal-lobby'}`, '_blank')}
            >
              {activeLiveSession ? 'Join Lecture' : 'Enter Lobby'}
            </button>
          </div>
          <div style={{ position: 'absolute', right: '-20px', top: '-10px', opacity: 0.15, pointerEvents: 'none' }}>
            <svg width="220" height="220" viewBox="0 0 24 24" fill="white">
              <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
          </div>
        </div>

        {!loading && defaulterSubjects.length > 0 && (
          <div
            style={{
              background: 'var(--status-error-bg)',
              border: '1px solid var(--accent-admin)',
              borderRadius: '12px',
              padding: '14px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="var(--accent-admin)" strokeWidth="1.5"/>
              <path d="M12 9v4M12 17h.01" stroke="var(--accent-admin)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--status-error)' }}>
                Attendance warning — {defaulterSubjects.length} subject{defaulterSubjects.length > 1 ? 's' : ''} below 75%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {defaulterSubjects.map((s: any) => s.course_name || 'Subject').join(', ')}
              </div>
            </div>
            <Link href="/dashboard/student/attendance" style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--status-error)', textDecoration: 'none', fontWeight: 500 }}>
              View details →
            </Link>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Phase 3: Digital ID Section */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--surface-secondary)', border: 'none', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.05)' }}>
            <h2 className="section-heading" style={{ marginBottom: '8px', alignSelf: 'flex-start' }}>Digital Wallet</h2>
            <p className="secondary-text" style={{ alignSelf: 'flex-start', marginBottom: '10px' }}>Hover to interact with your identity card.</p>
            <DigitalIDCard 
              name={profile?.full_name || 'Student Name'}
              role="Undergraduate Student"
              idNumber={user?.uid.slice(0, 10).toUpperCase() || 'ID-000000'}
              department={profile?.department?.code || 'CS / ENGINEERING'}
              batch={String(profile?.graduation_year || 2026)}
              rollNo={profile?.roll_no || undefined}
              regNo={profile?.registration_no || undefined}
              imageUrl={profile?.photo_url || undefined}
            />
          </div>
          
          {loading ? <SkeletonCard /> : (
            <div className="card">
              <h2 className="section-heading" style={{ marginBottom: '16px' }}>Today&apos;s schedule</h2>
              {todaySlots.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {todaySlots.map((slot: any) => (
                    <div key={slot.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', background: 'var(--surface-secondary)', borderRadius: '8px' }}>
                      <div style={{ textAlign: 'center', minWidth: '48px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#0F6E56' }}>{(slot.start_time || '').slice(0, 5)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{(slot.end_time || '').slice(0, 5)}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{slot.course_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{slot.faculty_name} · {slot.room}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><p className="secondary-text">No classes today</p></div>
              )}
            </div>
          )}

          {loading ? <SkeletonCard /> : (
            <div className="card">
              <div className="section-row">
                <h2 className="section-heading">Upcoming assignments</h2>
                <Link href="/dashboard/student/assignments" style={{ fontSize: '12px', color: '#0F6E56', textDecoration: 'none' }}>View all →</Link>
              </div>
              {assignments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {assignments.map((a: any) => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-secondary)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{a.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{a.course_name}</div>
                      </div>
                      <span
                        className={`badge ${new Date(a.due_date).getTime() - Date.now() < 86400000 ? 'badge-error' : 'badge-warning'}`}
                        style={{ fontSize: '11px' }}
                      >
                        {daysUntil(a.due_date)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><p className="secondary-text">No upcoming assignments</p></div>
              )}
            </div>
          )}

          {loading ? <SkeletonCard /> : (
            <div className="card">
              <div className="section-row">
                <h2 className="section-heading">Attendance overview</h2>
                <Link href="/dashboard/student/attendance" style={{ fontSize: '12px', color: '#0F6E56', textDecoration: 'none' }}>Full view →</Link>
              </div>
              {attendanceSummaries.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {attendanceSummaries.slice(0, 5).map((s: any) => (
                    <div key={s.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px' }}>{s.course_name}</span>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: (s.attendance_pct || 0) >= 75 ? '#0F6E56' : '#C0392B' }}>
                          {s.attendance_pct || 0}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(100, s.attendance_pct || 0)}%`,
                            background: (s.attendance_pct || 0) >= 85 ? '#0F6E56' : (s.attendance_pct || 0) >= 75 ? '#9A6B00' : '#C0392B',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><p className="secondary-text">No attendance data yet</p></div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? <div className="card skeleton" style={{ height: '100px', opacity: 0.5 }}></div> : activeQuizzes.length > 0 && (
              <div className="card">
                <h2 className="section-heading" style={{ marginBottom: '12px' }}>Active quizzes</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeQuizzes.map((q: any) => (
                    <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--accent-student-bg)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{q.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{q.course_name} · {q.duration_mins} min</div>
                      </div>
                      <Link href={`/dashboard/student/quiz/take?id=${q.id}`} className="btn btn-sm btn-filled" style={{ '--role-accent': '#0F6E56', background: '#0F6E56', borderColor: '#0F6E56' } as React.CSSProperties}>
                        Take quiz
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading ? <div className="card skeleton" style={{ height: '100px', opacity: 0.5 }}></div> : pinned.length > 0 && (
              <div className="card">
                <h2 className="section-heading" style={{ marginBottom: '12px' }}>Pinned announcements</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pinned.map((a: any) => (
                    <div key={a.id} style={{ padding: '10px', background: 'var(--surface-secondary)', borderRadius: '8px', borderLeft: '3px solid #0F6E56' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{a.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{(a.body || '').slice(0, 80)}…</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}
