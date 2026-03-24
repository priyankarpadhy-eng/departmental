'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot
} from 'firebase/firestore'
import toast from 'react-hot-toast'

interface DetailedReportProps {
  role: 'admin' | 'hod' | 'faculty'
  facultyId?: string
}

export function AttendanceDetailedReportTable({ role, facultyId }: DetailedReportProps) {
  const [batches, setBatches] = useState<any[]>([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  
  const [students, setStudents] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'roll', direction: 'asc' })

  // Initial fetch for batches
  useEffect(() => {
    getDocs(collection(db, 'batches')).then(snap => {
      setBatches(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  // Main listener logic
  useEffect(() => {
    if (!selectedBatch) {
      setStudents([])
      setSessions([])
      setRecords([])
      return
    }

    setLoading(true)
    
    // 1. Listen to Students in Batch
    const studentsQ = query(
      collection(db, 'profiles'),
      where('batch_id', '==', selectedBatch),
      where('role', '==', 'student')
    )
    const unsubStudents = onSnapshot(studentsQ, (snap) => {
      setStudents(snap.docs.map(d => ({ 
        id: d.id, 
        name: d.data().full_name, 
        roll: d.data().roll_no || 'N/A', 
        reg: d.data().registration_no || 'N/A' 
      })))
    })

    // 2. Listen to Sessions
    const sessionsQ = query(
      collection(db, 'attendance_sessions'),
      where('batch_id', '==', selectedBatch),
      where('session_date', '>=', startDate + 'T00:00:00'),
      where('session_date', '<=', endDate + 'T23:59:59')
    )
    const unsubSessions = onSnapshot(sessionsQ, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    // 3. Listen to Records for this batch
    // Since session list changes, we'll listen to records by batch_id
    // This assumes we added batch_id to records in previous step
    const recordsQ = query(
      collection(db, 'attendance_records'),
      where('batch_id', '==', selectedBatch),
      where('marked_at', '>=', startDate + 'T00:00:00'),
      where('marked_at', '<=', endDate + 'T23:59:59')
    )
    const unsubRecords = onSnapshot(recordsQ, (snap) => {
      setRecords(snap.docs.map(d => d.data()))
    })

    return () => {
      unsubStudents()
      unsubSessions()
      unsubRecords()
    }
  }, [selectedBatch, startDate, endDate])

  const reportData = React.useMemo(() => {
    const rows: any[] = []
    const sortedSessions = [...sessions].sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    
    students.forEach(student => {
      sortedSessions.forEach(session => {
        const record = records.find(r => r.student_id === student.id && r.session_id === session.id)
        rows.push({
          studentName: student.name,
          roll: student.roll,
          reg: student.reg,
          date: new Date(session.session_date).toLocaleDateString(),
          course: session.course_name,
          status: record ? 'Present' : 'Absent',
          method: record?.method || '—'
        })
      })
    })
    return rows
  }, [students, sessions, records])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const filteredAndSortedData = React.useMemo(() => {
    return [...reportData]
      .filter(item => 
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.roll.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reg.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (!sortConfig) return 0
        const { key, direction } = sortConfig
        const valA = a[key]?.toString().toLowerCase() || ''
        const valB = b[key]?.toString().toLowerCase() || ''
        if (valA < valB) return direction === 'asc' ? -1 : 1
        if (valA > valB) return direction === 'asc' ? 1 : -1
        return 0
      })
  }, [reportData, searchTerm, sortConfig])

  const exportCSV = () => {
    const headers = ['Student Name', 'Roll Number', 'Registration Number', 'Date', 'Course', 'Status', 'Method']
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedData.map(r => [
        `"${r.studentName}"`, `"${r.roll}"`, `"${r.reg}"`, `"${r.date}"`, `"${r.course}"`, `"${r.status}"`, `"${r.method}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `RealTime_Attendance_${selectedBatch}.csv`
    link.click()
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #dfe1e5' }}>
      <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #dfe1e5', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#5f6368' }}>Batch</label>
          <select className="form-input" style={{ padding: '6px 10px', height: '32px', fontSize: '13px' }} value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
             <option value="">Select Batch...</option>
             {batches.map(b => <option key={b.id} value={b.id}>{b.section || b.name} ({b.graduation_year})</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#5f6368' }}>From</label>
          <input type="date" className="form-input" style={{ padding: '6px 10px', height: '32px', fontSize: '13px' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#5f6368' }}>To</label>
          <input type="date" className="form-input" style={{ padding: '6px 10px', height: '32px', fontSize: '13px' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          {loading && <span style={{ fontSize: '12px', color: '#1a73e8', fontWeight: 600 }}>Syncing...</span>}
          {!loading && reportData.length > 0 && <span style={{ fontSize: '12px', color: '#137333', fontWeight: 600 }}>● Live</span>}
          <input 
            type="text" 
            placeholder="Search grid..." 
            className="form-input" 
            style={{ width: '180px', height: '32px', padding: '6px 10px', fontSize: '13px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-outlined" style={{ height: '32px', padding: '0 16px', fontSize: '13px', borderColor: '#dadce0', color: '#3c4043' }} onClick={exportCSV} disabled={reportData.length === 0}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', overflow: 'auto', maxHeight: '600px', minHeight: '300px' }}>
        {filteredAndSortedData.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8f9fa' }}>
               <tr>
                  <th style={excelHeaderStyle} onClick={() => handleSort('studentName')}>Student Name {sortConfig?.key === 'studentName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th style={excelHeaderStyle} onClick={() => handleSort('roll')}>Roll Number {sortConfig?.key === 'roll' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th style={excelHeaderStyle} onClick={() => handleSort('reg')}>Registration Num {sortConfig?.key === 'reg' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th style={excelHeaderStyle} onClick={() => handleSort('date')}>Date</th>
                  <th style={excelHeaderStyle} onClick={() => handleSort('course')}>Course</th>
                  <th style={excelHeaderStyle} onClick={() => handleSort('status')}>Status</th>
                  <th style={excelHeaderStyle}>Method</th>
               </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e8eaed' }}>
                  <td style={excelCellStyle}>{r.studentName}</td>
                  <td style={excelCellStyle}>{r.roll}</td>
                  <td style={excelCellStyle}>{r.reg}</td>
                  <td style={excelCellStyle}>{r.date}</td>
                  <td style={excelCellStyle}>{r.course}</td>
                  <td style={{ ...excelCellStyle, color: r.status === 'Present' ? '#137333' : '#d93025', fontWeight: 600 }}>
                     {r.status}
                  </td>
                  <td style={excelCellStyle}>{r.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#70757a', flexDirection: 'column', gap: '12px' }}>
            {!selectedBatch ? (
               <p>Please select a batch to view the live attendance grid.</p>
            ) : (
               <p>No sessions found for this batch in the selected period.</p>
            )}
          </div>
        )}
      </div>
      
      <div style={{ background: '#f8f9fa', borderTop: '1px solid #dfe1e5', padding: '4px 20px', fontSize: '11px', color: '#5f6368', display: 'flex', justifyContent: 'space-between' }}>
         <span>Live Sync: Enabled</span>
         <span>Count: {filteredAndSortedData.length} records</span>
      </div>
    </div>
  )
}

const excelHeaderStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderRight: '1px solid #dfe1e5',
  borderBottom: '1px solid #dfe1e5',
  color: '#3c4043',
  fontWeight: 500,
  cursor: 'pointer',
  background: '#f8f9fa',
  whiteSpace: 'nowrap'
}

const excelCellStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRight: '1px solid #dfe1e5',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}
