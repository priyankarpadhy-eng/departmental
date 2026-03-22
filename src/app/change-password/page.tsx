'use client'

import { useState } from 'react'
import { auth, db } from '@/lib/firebase/config'
import { updatePassword } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
      
      // UpdateFirestore Profile
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
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px', height: '48px', background: '#0F6E56',
              borderRadius: '12px', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="1.5"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="page-title" style={{ marginBottom: '4px' }}>Set your password</h1>
          <p className="secondary-text">
            Your account requires a new password before you can continue
          </p>
        </div>

        <div className="card card-lg">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input
                type="password"
                className="form-input"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Repeat your new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>

            {password && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: '8+ chars', ok: password.length >= 8 },
                  { label: 'Uppercase', ok: /[A-Z]/.test(password) },
                  { label: 'Number', ok: /\d/.test(password) },
                  { label: 'Special char', ok: /[!@#$%^&*]/.test(password) },
                ].map(hint => (
                  <span
                    key={hint.label}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '11px',
                      color: hint.ok ? 'var(--status-success)' : 'var(--text-tertiary)',
                    }}
                  >
                    {hint.ok ? '✓' : '○'} {hint.label}
                  </span>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-filled btn-lg"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', background: '#0F6E56', borderColor: '#0F6E56', marginTop: '4px' }}
            >
              {loading ? 'Updating password…' : 'Set new password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
