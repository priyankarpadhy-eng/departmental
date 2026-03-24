'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, getDocs, orderBy, where, onSnapshot } from 'firebase/firestore'
import toast from 'react-hot-toast'

interface AttendanceReportTableProps {
  role: 'admin' | 'hod' | 'faculty'
  facultyId?: string
}

export function AttendanceReportTable({ role, facultyId }: AttendanceReportTableProps) {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    batch: '',
    course: '',
    date: ''
  })
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  useEffect(() => {
    let q = query(collection(db, 'attendance_sessions'), orderBy('session_date', 'desc'))
    
    if (role === 'faculty' && facultyId) {
      q = query(collection(db, 'attendance_sessions'), where('faculty_id', '==', facultyId), orderBy('session_date', 'desc'))
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    }, (err) => {
      console.error('Real-time report error:', err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [role, facultyId])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedSessions = [...sessions].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1
    return 0
  })

  const filteredSessions = sortedSessions.filter(s => {
    const matchBatch = filter.batch ? s.batch_name?.toLowerCase().includes(filter.batch.toLowerCase()) : true
    const matchCourse = filter.course ? s.course_name?.toLowerCase().includes(filter.course.toLowerCase()) : true
    const matchDate = filter.date ? s.session_date?.includes(filter.date) : true
    return matchBatch && matchCourse && matchDate
  })

  const downloadCSV = () => {
    const headers = ['Date', 'Batch', 'Semester', 'Course', 'Type', 'Faculty', 'Status', 'OTP']
    const rows = filteredSessions.map(s => [
      new Date(s.session_date).toLocaleDateString(),
      s.batch_name || 'N/A',
      s.semester_name || 'N/A',
      s.course_name || 'N/A',
      s.session_type,
      s.faculty_name || 'N/A',
      s.is_open ? 'Open' : 'Closed',
      s.otp || 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading report...</div>

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-secondary)' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Filter Batch..." 
            className="form-input" 
            style={{ width: '150px', fontSize: '13px' }}
            value={filter.batch}
            onChange={e => setFilter(p => ({ ...p, batch: e.target.value }))}
          />
          <input 
            type="text" 
            placeholder="Filter Course..." 
            className="form-input" 
            style={{ width: '150px', fontSize: '13px' }}
            value={filter.course}
            onChange={e => setFilter(p => ({ ...p, course: e.target.value }))}
          />
        </div>
        <button onClick={downloadCSV} className="btn btn-filled" style={{ background: '#0F6E56', borderColor: '#0F6E56', fontSize: '13px' }}>
          📊 Export to Excel (CSV)
        </button>
      </div>

      <div className="data-table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th onClick={() => handleSort('session_date')} style={{ cursor: 'pointer' }}>Date {sortConfig?.key === 'session_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('batch_name')} style={{ cursor: 'pointer' }}>Batch {sortConfig?.key === 'batch_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('semester_name')} style={{ cursor: 'pointer' }}>Sem {sortConfig?.key === 'semester_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('course_name')} style={{ cursor: 'pointer' }}>Course {sortConfig?.key === 'course_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              <th>Type</th>
              <th onClick={() => handleSort('faculty_name')} style={{ cursor: 'pointer' }}>Faculty {sortConfig?.key === 'faculty_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              <th>OTP</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map(s => (
              <tr key={s.id}>
                <td className="secondary-text">{new Date(s.session_date).toLocaleDateString()}</td>
                <td style={{ fontWeight: 600 }}>{s.batch_name}</td>
                <td className="secondary-text">{s.semester_name || 'N/A'}</td>
                <td>{s.course_name}</td>
                <td><span className="badge badge-neutral">{s.session_type}</span></td>
                <td className="secondary-text">{s.faculty_name}</td>
                <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1B5E20' }}>{s.otp || '—'}</td>
                <td>
                  <span className={`badge ${s.is_open ? 'badge-success' : 'badge-neutral'}`}>
                    {s.is_open ? 'Active' : 'Ended'}
                  </span>
                </td>
              </tr>
            ))}
            {filteredSessions.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }} className="secondary-text">No sessions found matching filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
