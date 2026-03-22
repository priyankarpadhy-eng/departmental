'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  where,
  writeBatch
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { logAction } from '@/lib/logAction'

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

export function AdminTimetableClient() {
  const [batches, setBatches] = useState<any[]>([])
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)
  const [offerings, setOfferings] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchBatches() {
      try {
        const snap = await getDocs(collection(db, 'batches'))
        setBatches(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        toast.error('Failed to load batches')
      } finally {
        setLoading(false)
      }
    }
    fetchBatches()
  }, [])

  useEffect(() => {
    if (!selectedBatch) {
      setOfferings([])
      setSlots([])
      return
    }

    async function fetchData() {
      setLoading(true)
      try {
        const [offSnap, slotSnap] = await Promise.all([
          getDocs(query(collection(db, 'course_offerings'), where('batch_id', '==', selectedBatch))),
          getDocs(query(collection(db, 'timetable_slots'), where('batch_id', '==', selectedBatch)))
        ])
        
        setOfferings(offSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setSlots(slotSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        toast.error('Failed to load timetable data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedBatch])

  async function handleAssignSlot(day: string, periodId: number, offeringId: string) {
    if (!selectedBatch) return
    
    // Check if slot exists
    const existing = slots.find(s => s.day === day && s.period_id === periodId)
    
    try {
      if (offeringId === '') {
        // Remove slot
        if (existing) {
          await deleteDoc(doc(db, 'timetable_slots', existing.id))
          setSlots(prev => prev.filter(s => s.id !== existing.id))
          toast.success('Slot cleared')
        }
        return
      }

      const offering = offerings.find(o => o.id === offeringId)
      const slotData = {
        batch_id: selectedBatch,
        day,
        period_id: periodId,
        offering_id: offeringId,
        course_name: offering.course_name,
        course_code: offering.course_code,
        faculty_name: offering.faculty_name,
        room: offering.room || 'TBD',
        updated_at: new Date().toISOString()
      }

      if (existing) {
        await updateDoc(doc(db, 'timetable_slots', existing.id), slotData)
        setSlots(prev => prev.map(s => s.id === existing.id ? { ...s, ...slotData } : s))
      } else {
        const docRef = await addDoc(collection(db, 'timetable_slots'), slotData)
        setSlots(prev => [...prev, { id: docRef.id, ...slotData }])
      }
      
      toast.success('Slot assigned')
    } catch (err) {
      toast.error('Failed to save slot')
    }
  }

  if (loading && batches.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <>
      <Topbar title="Timetable Manager" accentColor="#E24B4A" />
      <div className="content-container">
        <div className="section-row" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="section-heading">Weekly Schedule Builder</h2>
            <p className="secondary-text">Assign subject offerings to specific time blocks</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="form-label">Batch:</span>
            <select 
              className="form-input" 
              style={{ width: '240px' }} 
              value={selectedBatch || ''} 
              onChange={e => setSelectedBatch(e.target.value)}
            >
              <option value="">— Select Student Batch —</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.graduation_year} — Section {b.section}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedBatch ? (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Period</th>
                  {DAYS.map(day => <th key={day}>{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(p => (
                  <tr key={p.id}>
                    <td style={{ background: 'var(--surface-secondary)', fontWeight: 500 }}>
                      <div style={{ fontSize: '12px' }}>{p.label}</div>
                      <div className="secondary-text" style={{ fontSize: '10px' }}>Period {p.id}</div>
                    </td>
                    {DAYS.map(day => {
                      if (p.isLunch) return <td key={day} style={{ textAlign: 'center', background: 'var(--surface-secondary)', color: 'var(--text-tertiary)', fontSize: '11px' }}>LUNCH</td>
                      
                      const slot = slots.find(s => s.day === day && s.period_id === p.id)
                      return (
                        <td key={day} style={{ border: '1px solid var(--border-color)', padding: '8px' }}>
                          <select 
                            className="form-input" 
                            style={{ 
                              fontSize: '11px', 
                              padding: '4px', 
                              height: 'auto',
                              borderColor: slot ? '#E24B4A' : 'var(--border-color)',
                              background: slot ? '#FDEDED' : 'transparent'
                            }}
                            value={slot?.offering_id || ''}
                            onChange={(e) => handleAssignSlot(day, p.id, e.target.value)}
                          >
                            <option value="">— Empty —</option>
                            {offerings.map(o => (
                              <option key={o.id} value={o.id}>{o.course_code}</option>
                            ))}
                          </select>
                          {slot && (
                            <div style={{ marginTop: '6px', fontSize: '10px', lineHeight: '1.2' }}>
                              <div style={{ fontWeight: 600, color: '#E24B4A' }}>{slot.course_name}</div>
                              <div className="secondary-text">{slot.faculty_name}</div>
                              <div style={{ color: 'var(--text-tertiary)' }}>Room: {slot.room}</div>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ minHeight: '400px' }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>📅</div>
            <h3>No Batch Selected</h3>
            <p className="secondary-text">Please pick a student batch from the dropdown above to manage their weekly timetable.</p>
          </div>
        )}
      </div>
    </>
  )
}
