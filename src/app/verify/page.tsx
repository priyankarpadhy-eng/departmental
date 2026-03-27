'use client'

import React, { useState } from 'react'
import { db } from '@/lib/firebase/config'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function VerifyPage() {
  const [refId, setRefId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!refId.trim()) return
    
    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Premium verification delay for UX
      await new Promise(r => setTimeout(r, 1200))
      const cleanId = refId.trim()
      let snap: any = null

      if (!cleanId.includes('/')) {
        const directSnap = await getDoc(doc(db, 'requests', cleanId))
        if (directSnap.exists()) {
          snap = directSnap
        }
      }

      if (!snap) {
        const q = query(collection(db, 'requests'), where('reference_no', '==', cleanId))
        const qSnap = await getDocs(q)
        if (!qSnap.empty) {
          snap = qSnap.docs[0]
        }
      }

      if (snap && snap.exists()) {
        const data = snap.data()
        if (data.status === 'approved') {
          setResult({ ...data, id: snap.id })
        } else {
          setError('Document found but its status is currently: ' + (data.status || 'pending').toUpperCase())
        }
      } else {
        setError('No record found matching this Reference Number. Please ensure it is exactly as shown on the document.')
      }
    } catch (err: any) {
      console.error('Verification Error:', err)
      setError(`Search Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
      `}</style>
      
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
             <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', marginBottom: '10px', letterSpacing: '-0.5px' }}>Document Verification</h1>
             <p style={{ color: '#64748b', fontSize: '15px' }}>Instantly verify the authenticity of IGIT issued digital letters.</p>
          </motion.div>
        </div>

        <div style={{ background: '#fff', padding: '36px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <span>TRACKING ID / REFERENCE NO</span>
                <span style={{ fontSize: '11px', color: '#6479FF' }}>Look at the bottom of the certificate</span>
              </label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '16px', fontWeight: 500, outline: 'none' }}
                placeholder="Ex: IGIT/CE-02/2026/XXXX"
                value={refId}
                onChange={e => setRefId(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '16px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', position: 'relative' }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                   <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                   />
                   <span>Securing Record...</span>
                </div>
              ) : 'Verify Authenticity'}
            </button>
          </form>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ marginTop: '30px', padding: '24px', border: '2px solid #ef4444', borderRadius: '16px', background: '#fef2f2', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>❌</div>
                <h3 style={{ color: '#991b1b', fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>INVALID / DUPLICATE</h3>
                <p style={{ color: '#b91c1c', fontSize: '14px', lineHeight: 1.5 }}>
                  This Tracking ID is not in our official records. This certificate is likely a <strong>duplicate</strong> or <strong>counterfeit</strong>.
                </p>
              </motion.div>
            )}

            {result && (
              <motion.div 
                initial={{ height: 0, opacity: 0, y: 20 }} animate={{ height: 'auto', opacity: 1, y: 0 }}
                style={{ marginTop: '30px', border: '2px solid #059669', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(5, 150, 105, 0.1)' }}>
                <motion.div 
                  initial={{ backgroundPosition: '0%' }} animate={{ backgroundPosition: ['0%', '100%', '0%'] }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  style={{ background: 'linear-gradient(90deg, #059669 0%, #065f46 50%, #059669 100%)', backgroundSize: '200% 100%', padding: '24px', color: '#fff', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
                  <h3 style={{ fontWeight: 800, fontSize: '22px' }}>OFFICIALLY AUTHENTIC</h3>
                  <p style={{ fontSize: '13px', opacity: 0.9 }}>Digital security verification completed successfully.</p>
                </motion.div>
                <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#fff' }}>
                  {[
                    { label: 'Issued To:', value: result.student_name },
                    { label: 'Document:', value: result.type },
                    { label: 'Issue Date:', value: new Date(result.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { label: 'Tracking Hash:', value: result.id.toUpperCase(), mono: true },
                  ].map((row, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: idx < 3 ? '1px solid #f1f5f9' : 'none', paddingBottom: idx < 3 ? '12px' : '0' }}>
                      <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>{row.label}</span>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: row.mono ? '#059669' : '#1e293b', fontFamily: row.mono ? 'monospace' : 'inherit' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#0F6E56', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>← Back to IGIT Department Home</Link>
        </div>
      </div>
    </div>
  )
}
