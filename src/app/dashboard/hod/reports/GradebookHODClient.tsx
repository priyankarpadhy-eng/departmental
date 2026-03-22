'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'

export function GradebookHODClient() {
  const { profile } = useAuth()
  const [batches, setBatches] = useState<any[]>([])
  const [offerings, setOfferings] = useState<any[]>([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedOffering, setSelectedOffering] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function fetchFilters() {
      try {
        // 1. Try High-Speed MongoDB
        const res = await fetch(`/api/hod/reports/gradebook?deptId=${profile!.dept_id}`);
        if (res.ok) {
          const data = await res.json();
          setBatches(data.batches || []);
          setOfferings(data.offerings || []);
          setLoading(false);
          return;
        }

        // Fallback: Original Firestore
        const batchSnap = await getDocs(query(collection(db, 'batches'), where('dept_id', '==', profile!.dept_id)))
        setBatches(batchSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        
        const offSnap = await getDocs(query(collection(db, 'course_offerings'), where('dept_id', '==', profile!.dept_id)))
        setOfferings(offSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchFilters()
  }, [profile])

  useEffect(() => {
    if (!selectedOffering) {
      setResults([])
      return
    }
    async function fetchResults() {
      setLoading(true)
      try {
        // 1. High-Speed MongoDB Aggregation API (Joins Student Data automatically)
        const response = await fetch(`/api/hod/reports/gradebook?deptId=${profile!.dept_id}&offeringId=${selectedOffering}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setLoading(false);
          return;
        }

        // 2. Fallback: Slow Firestore Loop
        const q = query(collection(db, 'results'), where('offering_id', '==', selectedOffering))
        const snap = await getDocs(q)
        
        const resList = await Promise.all(snap.docs.map(async (d) => {
          const res = { id: d.id, ...d.data() as any }
          const studentDoc = await getDoc(doc(db, 'profiles', res.student_id))
          return { ...res, student: studentDoc.data() }
        }))
        
        setResults(resList)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [selectedOffering])

  return (
    <>
      <Topbar title="Department Gradebook" accentColor="#534AB7" />
      <div className="content-container">
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Filter by Batch</label>
              <select className="form-input" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                <option value="">All Batches</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Select Course Offering</label>
              <select className="form-input" value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)}>
                <option value="">Choose a course</option>
                {offerings
                  .filter(o => !selectedBatch || o.batch_id === selectedBatch)
                  .map(o => <option key={o.id} value={o.id}>{o.course_name} ({o.batch_id})</option>)
                }
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="section-row" style={{ padding: '20px' }}>
            <h2 className="section-heading">Performance Overview</h2>
            {results.length > 0 && <button className="btn btn-sm btn-outlined" style={{ '--role-accent': '#534AB7' } as React.CSSProperties}>Export PDF</button>}
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Internal (40)</th>
                <th>External (60)</th>
                <th>Total (100)</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id}>
                  <td>{r.student?.full_name || 'Unknown'}</td>
                  <td className="secondary-text">{r.student?.roll_no || '—'}</td>
                  <td>{r.internal_marks || 0}</td>
                  <td>{r.external_marks || 0}</td>
                  <td style={{ fontWeight: 600 }}>{r.total || 0}</td>
                  <td>
                    <span className={`badge ${['O','E','A'].includes(r.grade) ? 'badge-success' : r.grade === 'F' ? 'badge-error' : 'badge-neutral'}`}>
                      {r.grade || 'NA'}
                    </span>
                  </td>
                </tr>
              ))}
              {selectedOffering && results.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No results published for this offering.</td></tr>
              )}
              {!selectedOffering && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Select a course to view the gradebook.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// Add missing import for getDoc and doc
import { getDoc, doc } from 'firebase/firestore'
