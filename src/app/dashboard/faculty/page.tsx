'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, where, orderBy, limit, getDocs, getCountFromServer } from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'

export default function FacultyDashboard() {
  const { profile, user } = useAuth()
  const [todaySlots, setTodaySlots] = useState<any[]>([])
  const [pendingGrades, setPendingGrades] = useState(0)
  const [offerings, setOfferings] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile || !user || profile.role !== 'faculty') return

    async function fetchData() {
      const today = new Date().getDay()
      const dayIndex = today === 0 ? 6 : today - 1

      // 1. Check cache for instant load
      const cacheKey = `cache_faculty_dash_${user?.uid || 'guest'}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const decoded = JSON.parse(cached)
        setTodaySlots(decoded.todaySlots || [])
        setPendingGrades(decoded.pendingGrades || 0)
        setOfferings(decoded.offerings || [])
        setAnnouncements(decoded.announcements || [])
        setLoading(false)
      }

      try {
        if (!user) return;
        // 2. High-Speed MongoDB Unified API
        const response = await fetch(`/api/faculty/dashboard?uid=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setTodaySlots(data.slots || []);
          setPendingGrades(data.pendingGradesCount || 0);
          setOfferings(data.offerings || []);
          setAnnouncements(data.announcements || []);
          setLoading(false);

          // Update cache
          sessionStorage.setItem(cacheKey, JSON.stringify({
            todaySlots: data.slots,
            pendingGrades: data.pendingGradesCount,
            offerings: data.offerings,
            announcements: data.announcements,
            updatedAt: new Date().toISOString()
          }));
          return; // Exit on success
        }

        // 3. Fallback: Original Firestore Logic
        const [
          slotsSnap,
          submissionsCount,
          offeringsSnap,
          announcementsSnap
        ] = await Promise.all([
          getDocs(query(
            collection(db, 'timetable_slots'),
            where('faculty_id', '==', user?.uid),
            where('day_of_week', '==', dayIndex),
            orderBy('start_time')
          )),
          getCountFromServer(query(
            collection(db, 'submissions'),
            where('faculty_id', '==', user?.uid),
            where('marks', '==', null)
          )),
          getDocs(query(
            collection(db, 'course_offerings'),
            where('faculty_id', '==', user?.uid),
            limit(6)
          )),
          getDocs(query(
            collection(db, 'announcements'),
            orderBy('is_pinned', 'desc'),
            orderBy('created_at', 'desc'),
            limit(5)
          ))
        ])

        const freshSlots = slotsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const freshPendingGrades = submissionsCount.data().count
        const freshOfferings = offeringsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const freshAnnouncements = announcementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        setTodaySlots(freshSlots)
        setPendingGrades(freshPendingGrades)
        setOfferings(freshOfferings)
        setAnnouncements(freshAnnouncements)

        // Update cache
        sessionStorage.setItem(cacheKey, JSON.stringify({
          todaySlots: freshSlots,
          pendingGrades: freshPendingGrades,
          offerings: freshOfferings,
          announcements: freshAnnouncements,
          updatedAt: new Date().toISOString()
        }))
      } catch (err) {
        console.error('Error fetching faculty dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [profile, user])

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>
  }

  const dayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <>
      <Topbar title={`Good ${getGreeting()}, ${(profile && profile.full_name || '').split(' ')[0] || 'Faculty'}`} accentColor="#185FA5" />
      <div className="content-container">
        {/* Verification Alert */}
        {profile?.verification_status !== 'verified' && (
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Active courses', value: offerings.length, color: '#185FA5', bg: '#E8F0F9', icon: '📚' },
            { label: 'Pending grades', value: pendingGrades, color: '#9A6B00', bg: '#FFF8E1', icon: '📝' },
            { label: "Today's classes", value: todaySlots.length, color: '#0F6E56', bg: '#E7F4F0', icon: '🗓' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, fontSize: '18px' }}>{s.icon}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card">
            <h2 className="section-heading" style={{ marginBottom: '16px' }}>{DAYS[dayIndex]}&apos;s classes</h2>
            {todaySlots.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {todaySlots.map((slot: any) => (
                  <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--surface-secondary)', borderRadius: '8px' }}>
                    <div style={{ textAlign: 'center', minWidth: '52px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#185FA5' }}>{(slot.start_time || '').slice(0, 5)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{(slot.end_time || '').slice(0, 5)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{slot.course_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{slot.batch_name || 'Batch'} · {slot.room || 'Room TBD'}</div>
                    </div>
                    <Link href={`/dashboard/faculty/attendance?offering=${slot.offering_id}`} className="btn btn-outlined btn-sm" style={{ '--role-accent': '#185FA5' } as React.CSSProperties}>Take attendance</Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><p className="secondary-text">No classes scheduled today</p></div>
            )}
          </div>

          <div className="card">
            <div className="section-row">
              <h2 className="section-heading">Active courses</h2>
              <Link href="/dashboard/faculty/attendance" style={{ fontSize: '12px', color: '#185FA5', textDecoration: 'none' }}>Manage →</Link>
            </div>
            {offerings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {offerings.map((o: any) => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-secondary)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{o.course_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{o.course_code} · Batch {o.batch_name}</div>
                    </div>
                    <span className="badge badge-info">{o.semester_name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><p className="secondary-text">No active course offerings</p></div>
            )}
          </div>
        </div>

        {announcements.length > 0 && (
          <div className="card" style={{ marginTop: '16px' }}>
            <h2 className="section-heading" style={{ marginBottom: '16px' }}>Recent announcements</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {announcements.map((a: any) => (
                <div key={a.id} style={{ padding: '12px', background: a.is_pinned ? 'var(--accent-faculty-bg)' : 'var(--surface-secondary)', borderRadius: '8px', borderLeft: a.is_pinned ? '3px solid #185FA5' : '3px solid transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {a.is_pinned && <span className="badge badge-info">Pinned</span>}
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{a.title}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{(a.body || '').slice(0, 120)}{(a.body || '').length > 120 ? '…' : ''}</p>
                    By {a.author_name} · {a.created_at ? new Date(a.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
