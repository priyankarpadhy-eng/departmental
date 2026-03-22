'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PERIODS = [
  { id: 1, label: '09:00 - 10:00' },
  { id: 2, label: '10:00 - 11:00' },
  { id: 3, label: '11:00 - 12:00' },
  { id: 4, label: '12:00 - 01:00' },
  { id: 5, label: '01:00 - 02:00', isLunch: true },
  { id: 6, label: '02:00 - 03:00' },
  { id: 7, label: '03:00 - 04:00' },
  { id: 8, label: '04:00 - 05:00' },
]

export function TimetableStudentClient() {
  const { profile } = useAuth()
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.batch_id) {
      setLoading(profile ? false : true) // Stay loading if profile is not yet here
      return
    }

    async function fetchTimetable() {
      try {
        // 1. Try High-Speed MongoDB
        const res = await fetch(`/api/academic/timetable?batchId=${profile!.batch_id}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
          setLoading(false);
          return;
        }

        // 2. Fallback: Firestore
        const q = query(
          collection(db, 'timetable_slots'),
          where('batch_id', '==', profile?.batch_id)
        )
        const snap = await getDocs(q)
        setSlots(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching timetable:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTimetable()
  }, [profile])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading timetable...</div>

  return (
    <>
      <Topbar title="Weekly Timetable" accentColor="#0F6E56" />
      <div className="content-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {DAYS.map((day) => {
            const daySlots = slots.filter(s => s.day === day).sort((a, b) => a.period_id - b.period_id)
            return (
              <div key={day} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                <h3 className="section-heading" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', color: '#0F6E56' }}>{day}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {PERIODS.map(p => {
                        if (p.isLunch) return <div key={p.id} style={{ fontSize: '10px', textAlign: 'center', color: 'var(--text-tertiary)', padding: '4px', background: 'var(--surface-secondary)', borderRadius: '4px' }}>LUNCH BREAK</div>
                        
                        const slot = daySlots.find(s => s.period_id === p.id)
                        return (
                            <div key={p.id} style={{ 
                                padding: '10px', 
                                background: slot ? 'rgba(15, 110, 86, 0.05)' : 'transparent', 
                                border: slot ? '1px solid rgba(15, 110, 86, 0.1)' : '1px dashed var(--border-color)',
                                borderRadius: '8px' 
                            }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: slot ? '#0F6E56' : 'var(--text-tertiary)' }}>
                                    {p.label}
                                </div>
                                {slot ? (
                                    <div style={{ marginTop: '4px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{slot.course_name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{slot.faculty_name}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Room: {slot.room}</div>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: '4px' }}>Free Period</div>
                                )}
                            </div>
                        )
                    })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
