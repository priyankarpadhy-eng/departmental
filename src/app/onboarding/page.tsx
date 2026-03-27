'use client'

import React, { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase/config'
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Phone, 
  Building2, 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  LogOut,
  RefreshCcw,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

// Premium Theme Tokens
const getTheme = (isDark: boolean) => ({
  background: isDark ? '#050508' : '#F9FAFB',
  card: isDark ? 'rgba(15, 15, 22, 0.75)' : 'rgba(255, 255, 255, 0.9)',
  text: isDark ? '#F3F4F6' : '#111827',
  muted: isDark ? '#9CA3AF' : '#6B7280',
  border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
  faint: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
  accent: '#B9FF66',
})

const FadeUp = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
)

export default function OnboardingPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [departments, setDepartments] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [isDark, setIsDark] = useState(true)

  const T = getTheme(isDark)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    dept_id: 'CE',
    batch_id: '',
    roll_no: '',
    registration_no: '',
    designation: '',
    graduation_year: '',
    current_company: '',
    current_job_title: ''
  })

  useEffect(() => {
    setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (profile?.verification_status === 'verified') {
       router.replace('/dashboard/' + profile.role)
    }
    if (profile) {
      setForm(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        dept_id: profile.dept_id || 'CE',
        batch_id: profile.batch_id || '',
        roll_no: profile.roll_no || '',
        registration_no: profile.registration_no || '',
        designation: profile.designation || '',
        graduation_year: profile.graduation_year?.toString() || '',
        current_company: profile.current_company || '',
        current_job_title: profile.current_job_title || ''
      }))
    }
  }, [profile])

  useEffect(() => {
    async function fetchData() {
      try {
        const [deptSnap, batchSnap] = await Promise.all([
          getDocs(collection(db, 'departments')),
          getDocs(collection(db, 'batches'))
        ])
        setDepartments(deptSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setBatches(batchSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
      } finally {
        setDataLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      const updateData: any = {
        full_name: form.full_name,
        phone: form.phone,
        dept_id: form.dept_id,
        verification_status: 'pending',
        updated_at: new Date().toISOString()
      }

      if (profile?.role === 'student') {
        updateData.batch_id = form.batch_id
        updateData.roll_no = form.roll_no
        updateData.registration_no = form.registration_no
      } else if (profile?.role === 'faculty') {
        updateData.designation = form.designation
      } else if (profile?.role === 'alumni') {
        updateData.graduation_year = Number(form.graduation_year)
        updateData.current_company = form.current_company
        updateData.current_job_title = form.current_job_title
      }

      await updateDoc(doc(db, 'profiles', user.uid), updateData)
      toast.success('Profile updated and verification request sent!')
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || dataLoading) return (
    <div style={{ minHeight: '100vh', background: T.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: `3px solid ${T.border}`, borderTopColor: T.accent, borderRadius: '50%' }} />
    </div>
  )
  
  if (!user || !profile) return <div>Auth required.</div>

  if (profile.verification_status === 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: T.background, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <FadeUp>
          <div style={{ background: T.card, backdropFilter: 'blur(20px)', border: `1px solid ${T.border}`, borderRadius: '24px', padding: '40px', maxWidth: '480px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(185,255,102,0.1)', color: T.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Clock size={32} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '12px', letterSpacing: '-1px' }}>Verification Pending</h1>
            <p style={{ color: T.muted, lineHeight: 1.6, marginBottom: '32px' }}>
              Thanks, <strong>{profile.full_name}</strong>! Your profile is being reviewed by the department admins. We'll grant you access once verified.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => window.location.reload()} style={{ width: '100%', padding: '14px', background: T.accent, border: 'none', borderRadius: '12px', color: '#000', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <RefreshCcw size={18} /> Refresh Status
              </button>
              <button onClick={() => { auth.signOut(); router.push('/login'); }} style={{ width: '100%', padding: '14px', background: 'none', border: `1px solid ${T.border}`, borderRadius: '12px', color: T.muted, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </div>
        </FadeUp>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.background, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: '520px', position: 'relative' }}>
        
        {/* Background Glow */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(185,255,102,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ background: 'rgba(185,255,102,0.1)', color: T.accent, padding: '6px 16px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', border: '1px solid rgba(185,255,102,0.2)' }}>
                Step 2: Profile Setup
              </span>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '8px', letterSpacing: '-1.5px' }}>Almost There</h1>
            <p style={{ color: T.muted }}>Setup your professional identity on the portal.</p>
          </div>

          <div style={{ background: T.card, backdropFilter: 'blur(24px)', border: `1px solid ${T.border}`, borderRadius: '28px', padding: '36px', position: 'relative', zIndex: 1 }}>
            
            {profile.verification_status === 'rejected' && (
              <div style={{ padding: '16px', background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: '14px', color: '#E24B4A', fontSize: '14px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
                <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>Verification Rejected</strong>
                  {profile.rejection_reason || 'Please check your details and try again.'}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <InputField label="Full Name" icon={<User size={18} />} required value={form.full_name} onChange={(v: string) => setForm(p => ({ ...p, full_name: v }))} T={T} isDark={isDark} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
                  <select 
                    style={{ width: '100%', padding: '14px 16px 14px 48px', background: T.faint, border: `1.5px solid ${T.border}`, borderRadius: '14px', color: T.text, fontSize: '15px', fontWeight: 500, outline: 'none', appearance: 'none' }}
                    required value={form.dept_id} onChange={e => setForm(p => ({ ...p, dept_id: e.target.value }))}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              {profile.role === 'student' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Academic Batch</label>
                    <div style={{ position: 'relative' }}>
                      <GraduationCap size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
                      <select 
                        style={{ width: '100%', padding: '14px 16px 14px 48px', background: T.faint, border: `1.5px solid ${T.border}`, borderRadius: '14px', color: T.text, fontSize: '15px', fontWeight: 500, outline: 'none', appearance: 'none' }}
                        required value={form.batch_id} onChange={e => setForm(p => ({ ...p, batch_id: e.target.value }))}
                      >
                        <option value="">Select Graduation Batch</option>
                        {batches.filter(b => !form.dept_id || b.dept_id === form.dept_id).map(b => (
                          <option key={b.id} value={b.id}>{b.graduation_year} — Section {b.section}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <InputField label="Roll Number" placeholder="e.g. 210110..." value={form.roll_no} onChange={(v: string) => setForm(p => ({ ...p, roll_no: v }))} required T={T} isDark={isDark} />
                    <InputField label="Reg Number" placeholder="e.g. 210110..." value={form.registration_no} onChange={(v: string) => setForm(p => ({ ...p, registration_no: v }))} required T={T} isDark={isDark} />
                  </div>
                </div>
              )}

              {profile.role === 'faculty' && (
                <InputField label="Designation" icon={<Briefcase size={18} />} placeholder="e.g. Assistant Professor" required value={form.designation} onChange={(v: string) => setForm(p => ({ ...p, designation: v }))} T={T} isDark={isDark} />
              )}

              {profile.role === 'alumni' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <InputField label="Graduation Year" type="number" icon={<Calendar size={18} />} value={form.graduation_year} onChange={(v: string) => setForm(p => ({ ...p, graduation_year: v }))} required T={T} isDark={isDark} />
                  <InputField label="Company Office" icon={<Building2 size={18} />} placeholder="e.g. Google, TCS" value={form.current_company} onChange={(v: string) => setForm(p => ({ ...p, current_company: v }))} T={T} isDark={isDark} />
                  <InputField label="Job Title" icon={<Briefcase size={18} />} placeholder="e.g. Senior Engineer" value={form.current_job_title} onChange={(v: string) => setForm(p => ({ ...p, current_job_title: v }))} T={T} isDark={isDark} />
                </div>
              )}

              <InputField label="Contact Phone" icon={<Phone size={18} />} placeholder="+91 ..." value={form.phone} onChange={(v: string) => setForm(p => ({ ...p, phone: v }))} T={T} isDark={isDark} />

              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button 
                  type="submit" 
                  disabled={loading} 
                  style={{ width: '100%', padding: '16px', background: T.accent, border: 'none', borderRadius: '16px', color: '#191A23', fontSize: '16px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(185,255,102,0.2)' }}
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '20px', height: '20px', border: '2.5px solid rgba(0,0,0,0.1)', borderTopColor: '#000', borderRadius: '50%' }} />
                  ) : (
                    <>Submit For Review <ArrowRight size={20} /></>
                  )}
                </button>
                <button type="button" onClick={() => auth.signOut()} style={{ background: 'none', border: 'none', color: T.muted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Sign Out</button>
              </div>
            </form>
          </div>
        </FadeUp>
      </div>
    </div>
  )
}

function InputField({ label, icon, placeholder, value, onChange, type = 'text', required, T, isDark }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '13px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }}>{icon}</div>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          style={{ width: '100%', padding: `14px 16px 14px ${icon ? '48px' : '16px'}`, background: T.faint, border: `1.5px solid ${T.border}`, borderRadius: '14px', color: T.text, fontSize: '15px', fontWeight: 500, outline: 'none', transition: 'all 0.3s' }}
          onFocus={(e) => { e.currentTarget.style.border = `1.5px solid ${T.accent}`; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'white'; }}
          onBlur={(e) => { e.currentTarget.style.border = `1.5px solid ${T.border}`; e.currentTarget.style.background = T.faint; }}
        />
      </div>
    </div>
  )
}
