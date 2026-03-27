'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { auth, db } from '@/lib/firebase/config'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  GraduationCap, 
  Briefcase, 
  Users, 
  History, 
  ChevronRight, 
  CheckCircle2,
  Database,
  ShieldCheck,
  UserCheck
} from 'lucide-react'
import type { UserRole } from '@/types'
import toast from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'

// Premium Theme Tokens (Matching Landing Page)
const getTheme = (isDark: boolean) => ({
  background: isDark ? '#050508' : '#F9FAFB',
  card: isDark ? 'rgba(15, 15, 22, 0.75)' : 'rgba(255, 255, 255, 0.8)',
  text: isDark ? '#F3F4F6' : '#111827',
  muted: isDark ? '#9CA3AF' : '#6B7280',
  border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
  faint: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
  accent: '#B9FF66',
  accentDark: '#91cc4a',
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

function LoginContent() {
  const [isDark, setIsDark] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [role, setRole] = useState<UserRole>('student')
  const [rollNo, setRollNo] = useState('')
  const [regNo, setRegNo] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const T = getTheme(isDark)

  useEffect(() => {
    setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    const error = searchParams.get('error')
    if (error) toast.error(decodeURIComponent(error))
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast.success('Welcome back!')
      const redirectTo = searchParams.get('redirectTo') || '/'
      router.push(redirectTo)
    } catch (error: any) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      const { collection, query, where, getDocs, deleteDoc } = await import('firebase/firestore')
      const q = query(collection(db, 'profiles'), where('email', '==', email))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0]
        const profileData = existingDoc.data()
        await deleteDoc(existingDoc.ref)
        await setDoc(doc(db, 'profiles', user.uid), {
          ...profileData,
          id: user.uid,
          full_name: fullName || profileData.full_name,
          roll_no: role === 'student' ? (rollNo || profileData.roll_no) : profileData.roll_no,
          registration_no: role === 'student' ? (regNo || profileData.registration_no) : profileData.registration_no,
          updated_at: new Date().toISOString(),
        })
      } else {
        await setDoc(doc(db, 'profiles', user.uid), {
          id: user.uid,
          email: user.email,
          full_name: fullName,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: false,
          verification_status: 'pending',
          must_change_password: false,
          dept_id: 'CE',
          batch_id: null,
          roll_no: role === 'student' ? rollNo : null,
          registration_no: role === 'student' ? regNo : null,
          graduation_year: null,
          designation: null
        })
      }
      toast.success('Account created successfully!')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      toast.error('Enter your email address first')
      return
    }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
    } catch (error: any) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: T.background,
      color: T.text,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'inherit',
      transition: 'background 0.4s ease'
    }}>
      {/* Background Glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(185,255,102,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        
        {/* Header Badge */}
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '8px 16px', borderRadius: '12px', background: T.faint, border: `1px solid ${T.border}`, color: T.muted, fontSize: '13px', fontWeight: 600, transition: 'all 0.3s' }}>
              <ArrowLeft size={16} /> Back to Portal
            </Link>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ background: isDark ? 'rgba(185,255,102,0.1)' : 'rgba(22,163,74,0.08)', border: isDark ? '1px solid rgba(185,255,102,0.3)' : '1px solid rgba(22,163,74,0.25)', color: isDark ? T.accent : '#16a34a', padding: '6px 16px', borderRadius: '99px', fontSize: '12px', fontWeight: 800 }}>
                🎓 CIVIL ENGINEERING · IGIT
              </span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px', letterSpacing: '-1px' }}>
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Join Community' : 'Reset Access'}
            </h1>
            <p style={{ color: T.muted, fontSize: '15px' }}>
              Official access point for departmental resources.
            </p>
          </div>
        </FadeUp>

        {/* Main Card */}
        <FadeUp delay={0.1}>
          <div style={{
            background: T.card,
            backdropFilter: 'blur(24px)',
            borderRadius: '24px',
            border: `1px solid ${T.border}`,
            padding: '36px',
            boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.3)' : '0 20px 50px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {/* Tab Control */}
            <div style={{ display: 'flex', background: T.faint, padding: '4px', borderRadius: '14px', marginBottom: '32px', position: 'relative' }}>
              <motion.div
                layout
                style={{
                  position: 'absolute',
                  top: '4px',
                  bottom: '4px',
                  left: mode === 'signup' ? '50%' : '4px',
                  right: mode === 'signup' ? '4px' : '50%',
                  background: isDark ? '#1A1A1A' : '#FFFFFF',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 0
                }}
              />
              <button onClick={() => { setMode('login'); setResetSent(false) }} style={{ flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer', zIndex: 1, fontSize: '14px', fontWeight: mode === 'login' ? 700 : 500, color: mode === 'login' ? T.text : T.muted, transition: 'color 0.3s' }}>
                Sign In
              </button>
              <button onClick={() => setMode('signup')} style={{ flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer', zIndex: 1, fontSize: '14px', fontWeight: mode === 'signup' ? 700 : 500, color: mode === 'signup' ? T.text : T.muted, transition: 'color 0.3s' }}>
                Create Account
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'login' && !resetSent && (
                <motion.form 
                  key="login"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleLogin} 
                  style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                  <InputField label="Email Address" icon={<Mail size={18} />} placeholder="name@igit.ac.in" value={email} onChange={setEmail} type="email" T={T} isDark={isDark} />
                  <div>
                    <InputField label="Password" icon={<Lock size={18} />} placeholder="••••••••" value={password} onChange={setPassword} type="password" T={T} isDark={isDark} />
                    <div style={{ textAlign: 'right', marginTop: '8px' }}>
                      <button type="button" onClick={() => setMode('reset')} style={{ background: 'none', border: 'none', color: T.muted, fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>Forgot Password?</button>
                    </div>
                  </div>
                  <PrimaryButton loading={loading} text="Sign In Access" T={T} />
                </motion.form>
              )}

              {mode === 'signup' && (
                <motion.form 
                  key="signup"
                  initial={{ opacity: 0, x: 10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleSignUp} 
                  style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
                >
                  <InputField label="Full Name" icon={<User size={18} />} placeholder="John Doe" value={fullName} onChange={setFullName} T={T} isDark={isDark} />
                  <InputField label="Email Address" icon={<Mail size={18} />} placeholder="name@igit.ac.in" value={email} onChange={setEmail} type="email" T={T} isDark={isDark} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Member Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {[
                        { id: 'student', label: 'Student', icon: <GraduationCap size={16} /> },
                        { id: 'faculty', label: 'Faculty', icon: <Briefcase size={16} /> },
                        { id: 'alumni', label: 'Alumni', icon: <History size={16} /> }
                      ].map(r => (
                        <button key={r.id} type="button" onClick={() => setRole(r.id as UserRole)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', borderRadius: '12px', border: `1.5px solid ${role === r.id ? T.accent : T.border}`, background: role === r.id ? (isDark ? 'rgba(185,255,102,0.1)' : 'rgba(185,255,102,0.05)') : 'transparent', color: role === r.id ? T.text : T.muted, cursor: 'pointer', transition: 'all 0.2s' }}>
                          {r.icon}
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {role === 'student' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <InputField label="Roll No" value={rollNo} onChange={setRollNo} T={T} isDark={isDark} />
                      <InputField label="Reg No" value={regNo} onChange={setRegNo} T={T} isDark={isDark} />
                    </motion.div>
                  )}

                  <InputField label="Create Password" icon={<Lock size={18} />} placeholder="Min 8 chars" value={password} onChange={setPassword} type="password" T={T} isDark={isDark} />
                  <PrimaryButton loading={loading} text="Create Workspace" T={T} />
                </motion.form>
              )}

              {mode === 'reset' && (
                <motion.form 
                  key="reset"
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  onSubmit={handlePasswordReset} 
                  style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}
                >
                  {resetSent ? (
                    <div style={{ padding: '20px 0' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(185,255,102,0.1)', color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <CheckCircle2 size={32} />
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Check Your Email</h3>
                      <p style={{ color: T.muted, fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>We've sent a secure reset link to <br /><strong style={{ color: T.text }}>{email}</strong></p>
                      <button type="button" onClick={() => { setMode('login'); setResetSent(false) }} style={{ color: T.accent, background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Return to Login</button>
                    </div>
                  ) : (
                    <>
                      <InputField label="Verification Email" icon={<Mail size={18} />} placeholder="name@igit.ac.in" value={email} onChange={setEmail} type="email" T={T} isDark={isDark} />
                      <p style={{ fontSize: '13px', color: T.muted, lineHeight: 1.5 }}>Enter your registered email and we'll send you a link to regain access to your account.</p>
                      <PrimaryButton loading={loading} text="Send Recovery Link" T={T} />
                      <button type="button" onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: T.muted, fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>Cancel & Return</button>
                    </>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </FadeUp>

        {/* Roles Hint */}
        <FadeUp delay={0.2}>
          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.muted, fontSize: '12px', fontWeight: 600 }}>
              <ShieldCheck size={14} style={{ color: '#E24B4A' }} /> Admin Controls
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.muted, fontSize: '12px', fontWeight: 600 }}>
              <UserCheck size={14} style={{ color: '#534AB7' }} /> Verified Access
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.muted, fontSize: '12px', fontWeight: 600 }}>
              <Database size={14} style={{ color: '#0F6E56' }} /> Central Vault
            </div>
          </div>
        </FadeUp>
      </div>
    </div>
  )
}

function InputField({ label, icon, placeholder, value, onChange, type = 'text', T, isDark }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '13px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: T.muted }}>{icon}</div>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          style={{
            width: '100%',
            padding: `14px 16px ${14}px ${icon ? '48px' : '16px'}`,
            background: T.faint,
            border: `1.5px solid ${T.border}`,
            borderRadius: '14px',
            color: T.text,
            fontSize: '15px',
            fontWeight: 500,
            outline: 'none',
            transition: 'all 0.3s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = `1.5px solid ${T.accent}`
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'white'
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = `1.5px solid ${T.border}`
            e.currentTarget.style.background = T.faint
          }}
        />
      </div>
    </div>
  )
}

function PrimaryButton({ loading, text, T }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading}
      type="submit"
      style={{
        width: '100%',
        padding: '16px',
        background: `linear-gradient(135deg, ${T.accent}, ${T.accentDark})`,
        border: 'none',
        borderRadius: '14px',
        color: '#191A23',
        fontSize: '16px',
        fontWeight: 900,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        boxShadow: '0 8px 24px rgba(185,255,102,0.2)'
      }}
    >
      {loading ? (
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '20px', height: '20px', border: '2.5px solid rgba(0,0,0,0.1)', borderTopColor: '#000', borderRadius: '50%' }} />
      ) : (
        <>
          {text} <ChevronRight size={18} />
        </>
      )}
    </motion.button>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#050508' }} />}>
      <LoginContent />
    </Suspense>
  )
}
