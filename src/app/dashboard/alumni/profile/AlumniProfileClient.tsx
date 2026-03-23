'use client'

import React, { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase/config'
import { doc, updateDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'

const ACCENT = '#854F0B'
const ACCENT_LIGHT = '#FDF3E7'

export function AlumniProfileClient() {
  const { user, profile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name:        profile?.full_name        || '',
    current_company:  profile?.current_company  || '',
    current_job_title: profile?.current_job_title || '',
    graduation_year:  profile?.graduation_year  || '',
    phone:            profile?.phone            || '',
    // stored as free-text in the profile doc
    linkedin_url:     (profile as any)?.linkedin_url || '',
    city:             (profile as any)?.city         || '',
    is_mentor:        (profile as any)?.is_mentor    ?? false,
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }))

  async function handleUpdate() {
    if (!user) return toast.error('Not authenticated')
    setSaving(true)
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        ...form,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
        updated_at: new Date().toISOString(),
      })
      toast.success('Profile updated!')
      setEditing(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function toggleMentor(val: boolean) {
    if (!user) return
    setForm(p => ({ ...p, is_mentor: val }))
    try {
      await updateDoc(doc(db, 'profiles', user.uid), { is_mentor: val, updated_at: new Date().toISOString() })
      toast.success(`Mentoring ${val ? 'enabled' : 'disabled'}`)
    } catch (err) {
      toast.error('Could not save mentor status')
      setForm(p => ({ ...p, is_mentor: !val }))
    }
  }

  const Field = ({ label, field, type = 'text', placeholder = '' }: { label: string; field: string; type?: string; placeholder?: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '11px', fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {editing ? (
        <input
          type={type}
          className="form-input"
          value={(form as any)[field]}
          onChange={set(field)}
          placeholder={placeholder}
          style={{ borderColor: 'var(--border-color)', transition: 'border-color 0.2s' }}
        />
      ) : (
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', minHeight: '20px' }}>
          {(form as any)[field] || <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>Not provided</span>}
        </div>
      )}
    </div>
  )

  return (
    <>
      <Topbar title="My Alumni Profile" accentColor={ACCENT} />
      <div className="content-container">
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── Hero card ── */}
          <div className="card" style={{ padding: '32px', background: `linear-gradient(135deg, ${ACCENT_LIGHT} 0%, #fff 100%)`, border: `1px solid rgba(133,79,11,0.15)`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: `rgba(133,79,11,0.07)` }} />
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: '92px', height: '92px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${ACCENT}`, boxShadow: `0 0 0 4px rgba(133,79,11,0.12)` }}>
                  <img
                    src={profile?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'A')}&background=854F0B&color=fff&size=200`}
                    alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '18px', height: '18px', borderRadius: '50%', background: '#22C55E', border: '2px solid white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>{profile?.full_name || 'Alumni Member'}</h2>
                <div style={{ fontWeight: 600, color: ACCENT, fontSize: '13px', marginBottom: '8px' }}>
                  {form.current_job_title ? `${form.current_job_title}${form.current_company ? ` @ ${form.current_company}` : ''}` : 'Update your profile'}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile?.graduation_year && <span style={{ background: 'rgba(133,79,11,0.1)', color: ACCENT, padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>Batch {profile.graduation_year}</span>}
                  <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>Alumni</span>
                  {form.is_mentor && <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>Mentor</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {editing && (
                  <button className="btn btn-ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                )}
                <button
                  className="btn btn-filled"
                  style={{ background: editing ? '#22C55E' : ACCENT, borderColor: editing ? '#22C55E' : ACCENT, minWidth: '120px' }}
                  onClick={editing ? handleUpdate : () => setEditing(true)}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editing ? '✓ Save Changes' : '✏️ Edit Profile'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Form fields ── */}
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <Field label="Full Name"        field="full_name"        placeholder="Your full name" />
              <Field label="Graduation Year"  field="graduation_year"  type="number" placeholder="e.g. 2021" />
              <Field label="Current Company"  field="current_company"  placeholder="e.g. Infosys" />
              <Field label="Job Title"        field="current_job_title" placeholder="e.g. Civil Engineer" />
              <Field label="Phone"            field="phone"            placeholder="+91 XXXXX XXXXX" />
              <Field label="City / Location"  field="city"             placeholder="e.g. Bhubaneswar" />
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="LinkedIn Profile URL" field="linkedin_url" placeholder="https://linkedin.com/in/..." />
              </div>
            </div>
          </div>

          {/* ── Mentorship toggle ── */}
          <div className="card" style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', background: form.is_mentor ? '#EFF6FF' : undefined, border: form.is_mentor ? '1px solid rgba(37,99,235,0.2)' : undefined, transition: 'all 0.3s' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎓 Become a Mentor
                {form.is_mentor && <span style={{ background: '#2563EB', color: 'white', padding: '2px 10px', borderRadius: '99px', fontSize: '11px' }}>Active</span>}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Allow students to reach out to you for career guidance and mentorship.</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '28px', cursor: 'pointer', flexShrink: 0 }}>
              <input type="checkbox" checked={form.is_mentor} onChange={e => toggleMentor(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '99px', transition: '0.3s',
                background: form.is_mentor ? '#2563EB' : 'var(--border-color)',
              }}>
                <span style={{
                  position: 'absolute', left: form.is_mentor ? '26px' : '2px', top: '2px',
                  width: '24px', height: '24px', background: 'white', borderRadius: '50%',
                  transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }} />
              </span>
            </label>
          </div>

        </div>
      </div>
    </>
  )
}
