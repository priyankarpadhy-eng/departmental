'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  Sparkles, 
  ChevronRight,
  Monitor,
  Search,
  BookOpen
} from 'lucide-react'
import { Footer } from '@/components/landing/Footer'

// ─── Theme Helper ──────────────────────────────────────────────────────────
const getTheme = (isDark: boolean) => ({
  background: isDark ? '#050508' : '#F9FAFB',
  card: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.9)',
  text: isDark ? '#F3F4F6' : '#111827',
  muted: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.55)',
  border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
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

export default function EventsPage() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const T = getTheme(isDark)
  
  const [events, setEvents] = useState<any[]>([])
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
    async function fetchEvents() {
      try {
        const q = query(collection(db, 'news_events'), orderBy('created_at', 'desc'))
        const snap = await getDocs(q)
        setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('Fetch events error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
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
        <button onClick={toggle} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' }}>
          {isDark ? '☀️' : '🌙'} {isMobile ? '' : (isDark ? 'Light' : 'Dark')}
        </button>
      </nav>

      {/* ─── Hero Section ─── */}
      <section style={{ padding: isMobile ? '120px 20px 40px' : '180px 8% 80px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(185,255,102,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <FadeUp>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Link href="/" style={{ color: T.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600 }}>
              <ArrowLeft size={16} /> Home
            </Link>
            <span style={{ color: T.border }}>/</span>
            <span style={{ color: T.accent, fontWeight: 700, fontSize: '14px' }}>Events</span>
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
            Upcoming <span style={{ color: T.accent, WebkitTextFillColor: 'initial' }}>Events</span>
          </h1>
          <p style={{ fontSize: isMobile ? '16px' : '20px', color: T.muted, maxWidth: '600px', lineHeight: 1.6 }}>
            Stay updated with the latest workshops, seminars, and academic gatherings scheduled in our department.
          </p>
        </FadeUp>
      </section>

      {/* ─── Events Feed ─── */}
      <section style={{ padding: isMobile ? '0 20px 80px' : '0 8% 120px', maxWidth: '1400px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: `4px solid ${T.border}`, borderTopColor: T.accent, borderRadius: '50%' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))', gap: isMobile ? '24px' : '32px' }}>
            {events.length > 0 ? events.map((ev, idx) => (
              <FadeUp key={ev.id} delay={idx * 0.1}>
                <motion.div
                  whileHover={{ y: -6, borderColor: T.accent }}
                  style={{
                    background: T.card,
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${T.border}`,
                    borderRadius: '24px',
                    padding: isMobile ? '24px' : '32px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    transition: 'border-color 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Event Meta Tag */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                    <span style={{ 
                      background: 'rgba(185,255,102,0.1)', 
                      color: T.accent, 
                      padding: '4px 12px', 
                      borderRadius: '8px', 
                      fontSize: '11px', 
                      fontWeight: 800, 
                      textTransform: 'uppercase',
                      border: '1px solid rgba(185,255,102,0.2)'
                    }}>
                      Department Event
                    </span>
                  </div>

                  <div style={{ zIndex: 1 }}>
                    <h3 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.3 }}>{ev.title}</h3>
                    <p style={{ color: T.muted, fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                      {ev.description || ev.content}
                    </p>
                  </div>

                  {ev.image_url && (
                    <div style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${T.border}`, aspectRatio: '16/9', marginBottom: '8px' }}>
                      <img src={ev.image_url} alt="Event" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  <div style={{ 
                    marginTop: 'auto', 
                    paddingTop: '20px', 
                    borderTop: `1px solid ${T.border}`, 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '16px',
                    zIndex: 1
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: T.muted, fontSize: '13px', fontWeight: 600 }}>
                      <Calendar size={16} style={{ color: T.accent }} />
                      {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}
                    </div>
                    {ev.venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: T.muted, fontSize: '13px', fontWeight: 600 }}>
                        <MapPin size={16} style={{ color: T.accent }} />
                        {ev.venue}
                      </div>
                    )}
                  </div>
                </motion.div>
              </FadeUp>
            )) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 0' }}>
                <Sparkles size={48} style={{ color: T.muted, marginBottom: '16px', opacity: 0.5 }} />
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: T.muted }}>No upcoming events scheduled.</h2>
                <p style={{ color: T.muted, opacity: 0.7 }}>Check back later for exciting academic activities.</p>
              </div>
            )}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
