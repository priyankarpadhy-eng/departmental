'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { auth } from '@/lib/firebase/config'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'
import toast from 'react-hot-toast'
import { db } from '@/lib/firebase/config'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginContent() {
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

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) toast.error(decodeURIComponent(error))
  }, [searchParams])

  // Removed syncSession for SPA/Static Hosting mode

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
      const redirectTo = searchParams.get('redirectTo') || '/';
      router.push(redirectTo);
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("Creating/linking profile for UID:", user.uid);
      
      const { collection, query, where, getDocs, deleteDoc } = await import('firebase/firestore');
      
      const q = query(collection(db, 'profiles'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        console.log("Found existing profile to link.");
        const existingDoc = querySnapshot.docs[0];
        const profileData = existingDoc.data();
        
        await deleteDoc(existingDoc.ref);
        await setDoc(doc(db, 'profiles', user.uid), {
          ...profileData,
          id: user.uid,
          full_name: fullName || profileData.full_name,
          roll_no: role === 'student' ? (rollNo || profileData.roll_no) : profileData.roll_no,
          registration_no: role === 'student' ? (regNo || profileData.registration_no) : profileData.registration_no,
          updated_at: new Date().toISOString(),
        });
        console.log("Profile linked successfully.");
      } else {
        console.log("Creating new profile.");
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
        });
        console.log("New profile created successfully.");
      }

      toast.success('Account created successfully!');
      router.push('/');
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message);
      setLoading(false);
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
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (error: any) {
      toast.error(error.message);
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--surface-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
        <Link 
          href="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'var(--text-secondary)', 
            textDecoration: 'none', 
            fontSize: '13px',
            marginBottom: '24px',
            width: 'fit-content',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Home
        </Link>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: '#1A1A18',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3L2 9l10 6 10-6-10-6zM2 17l10 6 10-6M2 13l10 6 10-6"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="page-title" style={{ marginBottom: '8px', fontSize: '24px' }}>
            Civil Engineering | IGIT
          </h1>
          <p className="secondary-text" style={{ fontSize: '14px' }}>
            Official Departmental Portal
          </p>
        </div>

        <div className="card card-lg" style={{ padding: '32px' }}>
          {/* Mode Toggle */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--surface-secondary)', 
            padding: '4px', 
            borderRadius: '12px', 
            marginBottom: '32px' 
          }}>
            <button 
              onClick={() => setMode('login')}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: mode === 'login' ? '600' : '400',
                background: mode === 'login' ? 'var(--surface-primary)' : 'transparent',
                color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Sign In
            </button>
            <button 
              onClick={() => setMode('signup')}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: mode === 'signup' ? '600' : '400',
                background: mode === 'signup' ? 'var(--surface-primary)' : 'transparent',
                color: mode === 'signup' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: mode === 'signup' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Create Account
            </button>
          </div>
          {mode === 'login' && (
            <>
              {!resetSent && (
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Email address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="you@department.edu"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-filled btn-lg"
                    disabled={loading}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      background: '#1A1A18',
                      borderColor: '#1A1A18',
                      marginTop: '4px',
                    }}
                  >
                    {loading ? 'Signing in…' : 'Sign in'}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setMode('reset')}
                      style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 className="section-heading" style={{ marginBottom: '4px' }}>Create an account</h2>
                <p className="secondary-text">Join the department portal</p>
              </div>

              <div className="form-group">
                <label className="form-label">Full name</label>
                <input
                  className="form-input"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@department.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">I am a</label>
                <select 
                  className="form-input" 
                  value={role} 
                  onChange={e => setRole(e.target.value as UserRole)}
                  required
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty / Teacher</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>

              {role === 'student' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Roll Number</label>
                    <input
                      className="form-input"
                      placeholder="e.g. 2101106123"
                      value={rollNo}
                      onChange={e => setRollNo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registration Number</label>
                    <input
                      className="form-input"
                      placeholder="e.g. 2101106123"
                      value={regNo}
                      onChange={e => setRegNo(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-filled btn-lg"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', background: '#1A1A18', borderColor: '#1A1A18', marginTop: '4px' }}
              >
                {loading ? 'Creating account…' : 'Sign up'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setMode('login')}
                  style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {resetSent ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <p className="body-text" style={{ fontWeight: 500 }}>Check your email</p>
                  <p className="secondary-text">
                    We&apos;ve sent a password reset link to <strong>{email}</strong>
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => { setMode('login'); setResetSent(false) }}
                    style={{ marginTop: '8px', fontSize: '12px' }}
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="section-heading" style={{ marginBottom: '4px' }}>Reset password</h2>
                    <p className="secondary-text">
                      Enter your email and we&apos;ll send you a reset link
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="you@department.edu"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-filled btn-lg"
                    disabled={loading}
                    style={{ width: '100%', justifyContent: 'center', background: '#1A1A18', borderColor: '#1A1A18' }}
                  >
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setMode('login')}
                    style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                  >
                    Back to sign in
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {[
            { role: 'Admin', color: '#E24B4A' },
            { role: 'HOD', color: '#534AB7' },
            { role: 'Faculty', color: '#185FA5' },
            { role: 'Student', color: '#0F6E56' },
            { role: 'Alumni', color: '#854F0B' },
          ].map(({ role, color }) => (
            <span
              key={role}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                color: 'var(--text-tertiary)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: color,
                  display: 'inline-block',
                }}
              />
              {role}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--surface-tertiary)' }} />}>
      <LoginContent />
    </Suspense>
  )
}
