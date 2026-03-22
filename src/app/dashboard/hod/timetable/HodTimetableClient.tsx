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

export function HodTimetableClient() {
  const { profile } = useAuth()
  const [batches, setBatches] = useState<any[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.dept_id) return

    async function fetchBatches() {
      try {
        const q = query(
          collection(db, 'batches'),
          where('dept_id', '==', profile.dept_id)
        )
        const snap = await getDocs(q)
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setBatches(data)
        if (data.length > 0) setSelectedBatchId(data[0].id)
      } catch (err) {
        console.error('Error fetching batches:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBatches()
  }, [profile])

  useEffect(() => {
    if (!selectedBatchId) return

    async function fetchTimetable() {
      try {
        const q = query(
          collection(db, 'timetable_slots'),
          where('batch_id', '==', selectedBatchId)
        )
        const snap = await getDocs(q)
        setSlots(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching timetable:', err)
      }
    }

    fetchTimetable()
  }, [selectedBatchId])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading department schedules...</div>

  return (
    <>
      <Topbar title="Master Timetable" accentColor="#534AB7" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="section-heading">Master Schedule</h2>
            <p className="secondary-text">View and verify timetables for all batches in your department.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Select Batch:</label>
            <select 
                className="form-input" 
                style={{ width: '200px' }}
                value={selectedBatchId} 
                onChange={e => setSelectedBatchId(e.target.value)}
            >
                {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.graduation_year} — {b.section}</option>
                ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {DAYS.map((day) => {
            const daySlots = slots.filter(s => s.day === day).sort((a, b) => a.period_id - b.period_id)
            return (
              <div key={day} className="card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '12px' }}>{day}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {daySlots.map(slot => (
                        <div key={slot.id} style={{ 
                            padding: '10px', 
                            background: 'var(--surface-secondary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                        }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#534AB7' }}>Period {slot.period_id}</span>
                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{slot.room}</span>
                             </div>
                             <div style={{ fontSize: '13px', fontWeight: 600 }}>{slot.course_name}</div>
                             <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{slot.faculty_name}</div>
                        </div>
                    ))}
                    {daySlots.length === 0 && <p className="secondary-text" style={{ fontSize: '12px', textAlign: 'center', padding: '10px' }}>No classes scheduled</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
