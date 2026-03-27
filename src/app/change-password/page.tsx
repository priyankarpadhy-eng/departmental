'use client'

import React, { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase/config'
import { updatePassword } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Lock, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

// Premium Theme Tokens
const getTheme = (isDark: boolean) => ({
  background: isDark ? '#050508' : '#F9FAFB',
  card: isDark ? 'rgba(15, 15, 22, 0.75)' : 'rgba(255, 255, 255, 0.95)',
  text: isDark ? '#F3F4F6' : '#111827',
  muted: isDark ? '#9CA3AF' : '#6B7280',
  border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
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

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const router = useRouter()

  const T = getTheme(isDark)

  useEffect(() => {
    setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
  }, [])

  const hints = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Numeric digit', ok: /\d/.test(password) },
    { label: 'Special symbol', ok: /[!@#$%^&*]/.test(password) },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    const user = auth.currentUser;
    if (!user) {
        toast.error('You must be logged in to change your password');
        return;
    }

    setLoading(true)

    try {
      await updatePassword(user, password);
      
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        must_change_password: false
      });

      toast.success('Password updated successfully')
      router.push('/')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: T.background,
      color: T.text,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      overflowX: 'hidden'
    }}>
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(185,255,102,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(185,255,102,0.1)', color: T.accent, borderRadius: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <ShieldCheck size={32} />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px', letterSpacing: '-1.5px' }}>Secure Account</h1>
            <p style={{ color: T.muted, fontSize: '15px' }}>
              Please set a new secure password to continue
            </p>
          </div>

          <div style={{ background: T.card, backdropFilter: 'blur(20px)', border: `1px solid ${T.border}`, borderRadius: '28px', padding: '36px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
                  <input
                    type="password"
                    placeholder="Minimal 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '14px 16px 14px 48px', background: T.faint, border: `1.5px solid ${T.border}`, borderRadius: '14px', color: T.text, fontSize: '15px', outline: 'none', transition: 'all 0.3s' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = T.accent}
                    onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    style={{ width: '100%', padding: '14px 16px 14px 48px', background: T.faint, border: `1.5px solid ${T.border}`, borderRadius: '14px', color: T.text, fontSize: '15px', outline: 'none', transition: 'all 0.3s' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = T.accent}
                    onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                  />
                </div>
              </div>

              {password && (
                <div style={{ background: T.faint, borderRadius: '16px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {hints.map(hint => (
                    <div
                      key={hint.label}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: hint.ok ? T.accent : T.muted,
                        transition: 'color 0.3s'
                      }}
                    >
                      {hint.ok ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      {hint.label}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  background: T.accent, 
                  border: 'none', 
                  borderRadius: '16px', 
                  color: '#191A23', 
                  fontSize: '16px', 
                  fontWeight: 900, 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '10px',
                  boxShadow: '0 8px 24px rgba(185,255,102,0.2)',
                  marginTop: '10px'
                }}
              >
                {loading ? 'Updating Password...' : <>Set New Password <ArrowRight size={20} /></>}
              </button>
            </form>
          </div>
        </FadeUp>
      </div>
    </div>
  )
}
