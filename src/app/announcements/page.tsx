'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Bell, 
  Calendar, 
  ArrowLeft, 
  Info, 
  Megaphone,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { Footer } from '@/components/landing/Footer'

// ─── Theme Helper ──────────────────────────────────────────────────────────
const getTheme = (isDark: boolean) => ({
  background: isDark ? '#050508' : '#F9FAFB',
  card: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.95)',
  text: isDark ? '#F3F4F6' : '#111827',
  muted: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.55)',
  border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  accent: '#B9FF66',
  surface: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
})

// ─── Animation Wrapper ──────────────────────────────────────────────────────
const FadeUp = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
)

export default function AnnouncementsPage() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const T = getTheme(isDark)
  
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const q = query(collection(db, 'announcements'), orderBy('created_at', 'desc'))
        const snap = await getDocs(q)
        setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('Fetch announcements error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnnouncements()
  }, [])

  return (
    <div style={{
      background: T.background,
      color: T.text,
      minHeight: '100vh',
      fontFamily: 'inherit',
      transition: 'all 0.4s ease',
      overflowX: 'hidden'
    }}>
      
      {/* ─── Navigation ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: isMobile ? '16px 20px' : '24px 8%',
        background: isDark ? 'rgba(5, 5, 8, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: T.accent, color: '#000', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>CE</div>
          <span style={{ fontWeight: 800, fontSize: isMobile ? '18px' : '22px', letterSpacing: '-0.5px', color: T.text }}>IGIT Portal</span>
        </Link>
        <button onClick={toggle} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDark ? '☀️' : '🌙'} {isMobile ? '' : (isDark ? 'Light' : 'Dark')}
        </button>
      </nav>

      {/* ─── Hero Section ─── */}
      <section style={{ padding: isMobile ? '120px 20px 40px' : '180px 8% 80px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(185,255,102,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <FadeUp>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Link href="/" style={{ color: T.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600 }}>
              <ArrowLeft size={16} /> Home
            </Link>
            <span style={{ color: T.border }}>/</span>
            <span style={{ color: T.accent, fontWeight: 700, fontSize: '14px' }}>Announcements</span>
          </div>
          
          <h1 style={{ 
            fontSize: isMobile ? '38px' : '64px', 
            fontWeight: 900, 
            letterSpacing: '-2px', 
            marginBottom: '16px',
            background: isDark ? 'linear-gradient(to bottom, #FFF, #888)' : 'linear-gradient(to bottom, #000, #444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Latest <span style={{ color: T.accent, WebkitTextFillColor: 'initial' }}>Notices</span>
          </h1>
          <p style={{ fontSize: isMobile ? '16px' : '20px', color: T.muted, maxWidth: '600px', lineHeight: 1.6 }}>
            Stay informed with the latest updates, academic notices, and official news from the Civil Engineering Department.
          </p>
        </FadeUp>
      </section>

      {/* ─── Announcements Feed ─── */}
      <section style={{ padding: isMobile ? '0 20px 80px' : '0 8% 120px', maxWidth: '1000px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: `4px solid ${T.border}`, borderTopColor: T.accent, borderRadius: '50%' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '20px' : '32px' }}>
            {announcements.length > 0 ? announcements.map((note, idx) => (
              <FadeUp key={note.id} delay={idx * 0.1}>
                <motion.div
                  whileHover={{ borderColor: T.accent, x: 4 }}
                  style={{
                    background: T.card,
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${T.border}`,
                    borderRadius: '24px',
                    padding: isMobile ? '24px' : '36px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(185,255,102,0.1)', color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Megaphone size={18} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>
                        {note.created_at?.seconds ? new Date(note.created_at.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Official Update'}
                      </span>
                    </div>
                    {note.is_important && (
                      <span style={{ background: '#E24B4A', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 900 }}>URGENT</span>
                    )}
                  </div>

                  <div>
                    <h2 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 800, marginBottom: '14px', lineHeight: 1.3 }}>{note.title}</h2>
                    <div style={{ 
                      fontSize: isMobile ? '15px' : '16px', 
                      lineHeight: 1.6, 
                      color: T.muted, 
                      whiteSpace: 'pre-wrap',
                      opacity: 0.9
                    }}>
                      {note.body}
                    </div>
                  </div>

                  {note.file_url && (
                    <motion.a
                      href={note.file_url}
                      target="_blank"
                      whileHover={{ scale: 1.02, background: 'rgba(185,255,102,0.15)' }}
                      style={{
                        padding: '12px 20px',
                        background: 'rgba(185,255,102,0.1)',
                        border: `1px solid ${T.accent}`,
                        borderRadius: '12px',
                        color: T.accent,
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginTop: '10px',
                        width: isMobile ? '100%' : 'fit-content'
                      }}
                    >
                      <ExternalLink size={16} /> View Document
                    </motion.a>
                  )}
                </motion.div>
              </FadeUp>
            )) : (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Bell size={48} style={{ color: T.muted, marginBottom: '16px', opacity: 0.5 }} />
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: T.muted }}>No active announcements.</h2>
                <p style={{ color: T.muted, opacity: 0.7 }}>We'll notify you here when there's an update.</p>
              </div>
            )}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
