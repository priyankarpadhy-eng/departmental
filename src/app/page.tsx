'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase/config'
import { collection, where, getDocs, getDoc, doc, onSnapshot, query, limit } from 'firebase/firestore'
import type { UserRole, Profile, NewsEvent, GalleryPhoto } from '@/types'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { Footer } from '@/components/landing/Footer'

const ROLE_ROUTES: Record<UserRole, string> = {
  admin: '/dashboard/admin',
  hod: '/dashboard/hod',
  faculty: '/dashboard/faculty',
  student: '/dashboard/student',
  alumni: '/dashboard/alumni',
}

// ─── Scroll-aware fade+slide animation wrapper ────────────────────────────────
const FadeUp = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 48 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
)

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ value, label, icon, isDark }: { value: string; label: string; icon: string; isDark: boolean }) => (
  <motion.div
    whileHover={{ y: -8, scale: 1.04 }}
    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    style={{
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      border: isDark ? '1px solid rgba(185,255,102,0.18)' : '1px solid rgba(0,0,0,0.1)',
      borderRadius: '20px', padding: '28px 20px',
      backdropFilter: 'blur(12px)', textAlign: 'center', cursor: 'default',
      boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
    }}
  >
    <div style={{ fontSize: '34px', marginBottom: '8px' }}>{icon}</div>
    <div style={{ fontSize: '30px', fontWeight: 900, color: '#B9FF66', letterSpacing: '-1px',
      textShadow: isDark ? '0 0 20px rgba(185,255,102,0.4)' : 'none' }}>{value}</div>
    <div style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)', marginTop: '6px', fontWeight: 600 }}>{label}</div>
  </motion.div>
)

// ─── Expandable Notice Card ────────────────────────────────────────────────────────
const ExpandableNotice = ({ notice, delay, T, isDark, index }: any) => {
  const [open, setOpen] = useState(false)
  return (
    <FadeUp delay={delay}>
      <motion.div 
        whileHover={{ x: 6, borderColor: 'rgba(100,121,255,0.5)' }}
        onClick={() => setOpen(!open)}
        style={{
          background: open ? (isDark ? 'rgba(100,121,255,0.08)' : 'rgba(100,121,255,0.04)') : T.surface, 
          border: `1px solid ${open ? 'rgba(100,121,255,0.5)' : T.border}`, 
          borderRadius: '16px', padding: '18px 24px', cursor: 'pointer', overflow: 'hidden',
          backdropFilter: isDark ? 'blur(10px)' : 'none', transition: 'all 0.3s',
          boxShadow: T.shadow,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: open ? '#B9FF66' : '#6479FF', flexShrink: 0, transition: 'background 0.3s' }} />
            <span style={{ fontWeight: 600, fontSize: '15px', color: open ? '#6479FF' : T.text, transition: 'color 0.3s' }}>
              {notice.title || 'Untitled Notice'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: T.muted, whiteSpace: 'nowrap' }}>
              {notice.created_at ? new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
            </span>
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }} style={{ color: open ? '#6479FF' : T.muted, display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </motion.div>
          </div>
        </div>
        
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div style={{ paddingTop: '16px', marginTop: '14px', borderTop: `1px solid ${T.border}`, fontSize: '14px', color: T.muted, lineHeight: 1.6 }}>
                {notice.description || notice.content || 'No additional details provided for this notice.'}
                
                {(notice.file_url || notice.link) && (
                  <div style={{ marginTop: '16px' }}>
                    <a href={notice.file_url || notice.link} target="_blank" rel="noopener noreferrer" 
                       style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#6479FF', color: '#fff', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '12px', transition: 'all 0.2s' }} 
                       onClick={e => e.stopPropagation()}
                       onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                       onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      {notice.file_url ? '📄 View Document' : '🔗 Open Link'}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </FadeUp>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard = ({ title, desc, icon, accent, isDark }: { title: string; desc: string; icon: string; accent: string; isDark: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -10, boxShadow: `0 24px 60px ${accent}22` }}
    style={{
      background: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
      borderRadius: '24px', padding: '36px 28px',
      backdropFilter: isDark ? 'blur(16px)' : 'none',
      position: 'relative', overflow: 'hidden', cursor: 'default',
      boxShadow: isDark ? 'none' : '0 4px 24px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.3s ease',
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
      background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    <div style={{
      width: '52px', height: '52px', borderRadius: '14px',
      background: `${accent}22`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '24px', marginBottom: '20px',
    }}>{icon}</div>
    <h3 style={{ fontSize: '17px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#191A23', marginBottom: '10px' }}>{title}</h3>
    <p style={{ fontSize: '14px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)', lineHeight: 1.7 }}>{desc}</p>
  </motion.div>
)

// ─── Faculty Card ─────────────────────────────────────────────────────────────
const FacultyCard = ({ prof, isDark }: { prof: any; isDark: boolean }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true, margin: '-30px' }}
    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -8 }}
    style={{
      background: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
      borderRadius: '24px', padding: '28px',
      backdropFilter: isDark ? 'blur(16px)' : 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '14px', textAlign: 'center', cursor: 'default',
      boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)',
    }}
  >
    <div style={{
      width: '80px', height: '80px', borderRadius: '50%',
      border: '3px solid rgba(185,255,102,0.5)', overflow: 'hidden', flexShrink: 0,
    }}>
      <img
        src={prof.photo_url || prof.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.full_name || 'F')}&background=B9FF66&color=191A23&size=200`}
        alt={prof.full_name || 'Faculty'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e: any) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.full_name || 'F')}&background=B9FF66&color=191A23&size=200` }}
      />
    </div>
    <div>
      <div style={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#191A23', fontSize: '15px' }}>{prof.full_name}</div>
      <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px', fontWeight: 700 }}>{prof.designation || 'Faculty'}</div>
      {prof.expertise && <div style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', marginTop: '6px' }}>{prof.expertise}</div>}
    </div>
  </motion.div>
)

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { theme, toggle } = useTheme()
  const router = useRouter()
  const isDark = theme === 'dark'

  const [faculties, setFaculties] = useState<Profile[]>([])
  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<NewsEvent[]>([])
  const [gallery, setGallery] = useState<GalleryPhoto[]>([])
  const [currentGalleryIdx, setCurrentGalleryIdx] = useState(0)
  const [hod, setHod] = useState<Profile | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [loading, setLoading] = useState(true)

  const [settings, setSettings] = useState({
    title: 'Civil Engineering Department, IGIT SARANG',
    subtitle: 'A unified platform for students, faculty, and alumni to collaborate, learn, and grow together.',
    hod_quote: 'Our mission is to nurture technical excellence and ethical leadership in our students.',
    hod_name: 'Dr. Goutam Kumar Pothal',
    hod_photo_url: '',
    show_faculties: true,
    show_gallery: true,
  })

  // Dynamic theme tokens
  const T = {
    bg:        isDark ? '#0A0A0F'              : '#F8FAF5',
    surface:   isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    border:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    text:      isDark ? '#FFFFFF'              : '#191A23',
    muted:     isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
    faint:     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    navBg:     isDark ? 'rgba(10,10,15,0.92)'   : 'rgba(248,250,245,0.92)',
    navBorder: isDark ? 'rgba(185,255,102,0.15)' : 'rgba(0,0,0,0.1)',
    orbA:      isDark ? 'rgba(185,255,102,0.10)' : 'rgba(185,255,102,0.18)',
    orbB:      isDark ? 'rgba(100,121,255,0.09)' : 'rgba(100,121,255,0.12)',
    shadow:    isDark ? 'none'                  : '0 4px 24px rgba(0,0,0,0.07)',
    accent:    '#B9FF66',
    accentDark: '#191A23',
  }

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-advance gallery
  useEffect(() => {
    if (gallery.length <= 1) return
    const timer = setInterval(() => setCurrentGalleryIdx(p => (p + 1) % gallery.length), 4500)
    return () => clearInterval(timer)
  }, [gallery.length])

  useEffect(() => {
    async function fetchStatics() {
      try {
        const [hodSnap, facSnap, settingsSnap] = await Promise.all([
          getDocs(query(collection(db, 'profiles'), where('role', '==', 'hod'), limit(1))),
          getDocs(query(collection(db, 'profiles'), where('role', '==', 'faculty'), limit(8))),
          getDoc(doc(db, 'settings', 'landing')),
        ])
        if (!hodSnap.empty) setHod(hodSnap.docs[0].data() as Profile)
        setFaculties(facSnap.docs.map(d => ({ id: d.id, ...d.data() } as Profile)))
        if (settingsSnap.exists()) setSettings(prev => ({ ...prev, ...settingsSnap.data() }))
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchStatics()

    const unsubGallery = onSnapshot(collection(db, 'gallery'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryPhoto))
      setGallery(data.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 12))
    })
    const unsubEvents = onSnapshot(collection(db, 'news_events'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as NewsEvent))
      setEvents(data.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 5))
    })
    const unsubNotices = onSnapshot(collection(db, 'announcements'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
      setNotices(data.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 5))
    })
    return () => { unsubGallery(); unsubEvents(); unsubNotices() }
  }, [])

  const handleDashboardRedirect = () => {
    if (profile?.role) router.push(ROLE_ROUTES[profile.role as UserRole] || '/login')
  }

  const activeGallery = gallery.length > 0 ? gallery : [
    { id: 'p1', image_url: 'https://images.unsplash.com/photo-1590159491612-da7d25e0c06a?q=80&w=2000&auto=format&fit=crop', title: 'Department Entrance' },
    { id: 'p2', image_url: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=2000&auto=format&fit=crop', title: 'Construction Lab' },
    { id: 'p3', image_url: 'https://plus.unsplash.com/premium_photo-1661962283999-906969543884?q=80&w=2000&auto=format&fit=crop', title: 'Surveying Session' },
  ]

  const features = [
    { title: 'Latest Announcements', desc: notices[0]?.title || 'Stay updated with departmental news, circulars, and academic updates in real-time.', icon: '📢', accent: '#B9FF66', href: '/announcements' },
    { title: 'Academic ERP', desc: 'Manage attendance, results, assignments, and timetable – your unified academic hub.', icon: '📅', accent: '#6479FF', href: 'https://igit.icrp.in' },
    { title: 'Course Syllabus', desc: 'Browse semester-wise course structures and learning outcomes for all programmes.', icon: '📚', accent: '#FF9060', href: 'https://igitsarang.ac.in/students/coursestructure' },
    { title: 'Faculty Connect', desc: 'Directly reach out to department faculty, mentors, and academic advisors.', icon: '👨‍🏫', accent: '#60CFFF', href: '#faculty' },
    { title: 'Student Portal', desc: 'Access your profile, digital ID card, notices, attendance, and more.', icon: '🎓', accent: '#FF60CF', href: '/login' },
    { title: 'Alumni Network', desc: 'Connect with alumni for mentorship, job opportunities, and career guidance.', icon: '🤝', accent: '#FFD060', href: '/login' },
  ]

  if (authLoading && !profile) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: '44px', height: '44px', borderRadius: '50%', border: `3px solid ${T.border}`, borderTop: '3px solid #B9FF66' }} />
      </div>
    )
  }

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: 'hidden', transition: 'background 0.4s, color 0.4s' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #B9FF66; border-radius: 99px; }

        .hero-title-dark {
          background: linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.65) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-title-light {
          background: linear-gradient(135deg, #0f2010 0%, #1a5c28 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Scroll progress bar */}
      <motion.div style={{
        scaleX, position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, #B9FF66, #6479FF)',
        transformOrigin: '0%', zIndex: 9999,
      }} />

      {/* ── BACKGROUND ORBS ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div animate={{ x: [0, 100, -60, 0], y: [0, -70, 100, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-20%', left: '-10%', width: '65vw', height: '65vw',
            borderRadius: '50%', background: `radial-gradient(circle, ${T.orbA} 0%, transparent 70%)`, filter: 'blur(70px)' }} />
        <motion.div animate={{ x: [0, -80, 60, 0], y: [0, 90, -60, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          style={{ position: 'absolute', bottom: '0%', right: '-15%', width: '55vw', height: '55vw',
            borderRadius: '50%', background: `radial-gradient(circle, ${T.orbB} 0%, transparent 70%)`, filter: 'blur(80px)' }} />
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: isDark
            ? 'linear-gradient(rgba(185,255,102,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(185,255,102,0.04) 1px, transparent 1px)'
            : 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* ── FLOATING PARTICLES ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {Array.from({ length: 14 }, (_, i) => ({
          id: i, x: (i * 7.1 + 3) % 100, y: (i * 11.3 + 5) % 100,
          size: (i % 3) + 2.5, dur: 12 + (i * 1.7) % 10, delay: (i * 0.8) % 6,
        })).map(p => (
          <motion.div key={p.id}
            style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
              borderRadius: '50%', background: isDark ? 'rgba(185,255,102,0.55)' : 'rgba(22,163,74,0.35)' }}
            animate={{ y: [0, -28, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* ──────────────── NAVBAR ──────────────── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          padding: isScrolled ? '14px 8%' : '20px 8%',
          background: isScrolled ? T.navBg : (isDark ? 'rgba(10,10,15,0.5)' : 'rgba(248,250,245,0.5)'),
          backdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${isScrolled ? T.navBorder : 'transparent'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all 0.4s ease',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <motion.div whileHover={{ rotate: 10, scale: 1.1 }} style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #B9FF66, #91cc4a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '18px', color: '#191A23',
          }}>C</motion.div>
          <span style={{ fontWeight: 800, fontSize: '14px', color: T.text, letterSpacing: '0.5px', transition: 'color 0.4s' }}>CIVIL DEPT</span>
        </Link>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {['HOD', 'Gallery', 'Faculty', 'Features'].map((item) => (
            <motion.a key={item} href={`#${item.toLowerCase()}`}
              whileHover={{ color: '#B9FF66' }}
              style={{ textDecoration: 'none', color: T.muted, fontWeight: 600, fontSize: '14px', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', transition: 'color 0.2s' }}
            >{item}</motion.a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <motion.button onClick={toggle}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{ border: `1px solid ${T.border}`, background: T.faint, color: T.text, padding: '8px 14px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '15px', transition: 'all 0.3s' }}
          >{isDark ? '☀️' : '🌙'}</motion.button>

          {user ? (
            <motion.button onClick={handleDashboardRedirect}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{ background: '#B9FF66', color: '#191A23', padding: '10px 22px', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}
            >Dashboard →</motion.button>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/login" style={{
                textDecoration: 'none', border: '1.5px solid #B9FF66',
                background: isDark ? 'transparent' : 'rgba(185,255,102,0.08)',
                color: isDark ? '#B9FF66' : '#16a34a', padding: '10px 22px',
                borderRadius: '12px', fontWeight: 900, fontSize: '14px', display: 'block', transition: 'all 0.3s',
              }}>Login</Link>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* ──────────────── HERO ──────────────── */}
      <section style={{ padding: '160px 8% 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
            <span style={{
              background: isDark ? 'rgba(185,255,102,0.1)' : 'rgba(22,163,74,0.08)',
              border: isDark ? '1px solid rgba(185,255,102,0.3)' : '1px solid rgba(22,163,74,0.25)',
              color: isDark ? '#B9FF66' : '#16a34a', padding: '6px 18px',
              borderRadius: '99px', fontSize: '13px', fontWeight: 700,
            }}>
              🎓 IGIT SARANG · Civil Engineering
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 'clamp(38px, 5.5vw, 68px)', fontWeight: 900, lineHeight: 1.08,
              letterSpacing: '-3px', marginBottom: '24px',
            }}
          >
            <span className={isDark ? 'hero-title-dark' : 'hero-title-light'}>
              {settings.title}
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ fontSize: '18px', color: T.muted, lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 44px', fontWeight: 400, transition: 'color 0.4s' }}
          >{settings.subtitle}</motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            {user ? (
              <motion.button onClick={handleDashboardRedirect}
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(185,255,102,0.35)' }} whileTap={{ scale: 0.96 }}
                style={{ background: 'linear-gradient(135deg,#B9FF66,#91cc4a)', color: '#191A23', padding: '16px 40px', borderRadius: '16px', border: 'none', fontWeight: 900, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              >Manage Workspace <span>→</span></motion.button>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.05, boxShadow: '0 0 28px rgba(185,255,102,0.3)' }} whileTap={{ scale: 0.96 }}>
                  <Link href="/login" style={{ background: 'linear-gradient(135deg,#B9FF66,#91cc4a)', color: '#191A23', padding: '16px 36px', borderRadius: '16px', fontWeight: 900, fontSize: '16px', textDecoration: 'none', display: 'inline-block' }}>Login Access →</Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                  <Link href="/login" style={{
                    border: `1.5px solid ${T.border}`, background: T.faint,
                    color: T.text, padding: '16px 36px', borderRadius: '16px',
                    fontWeight: 800, fontSize: '16px', textDecoration: 'none', display: 'inline-block',
                    backdropFilter: 'blur(12px)', transition: 'all 0.3s',
                  }}>Create Account</Link>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px', maxWidth: '800px', margin: '80px auto 0' }}
        >
          {[
            { value: '60+',  label: 'Expert Faculty',    icon: '👨‍🎓' },
            { value: '2000+', label: 'Students',          icon: '🎓' },
            { value: '25+',  label: 'Years Legacy',      icon: '🏛️' },
            { value: '95%',  label: 'Placement Rate',    icon: '💼' },
          ].map(s => <StatCard key={s.label} {...s} isDark={isDark} />)}
        </motion.div>
      </section>

      {/* ──────────────── HOD SECTION ──────────────── */}
      <section id="hod" style={{ padding: '0 8% 120px', position: 'relative', zIndex: 1 }}>
        <FadeUp>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
            <div style={{ background: '#B9FF66', color: '#191A23', padding: '4px 16px', borderRadius: '10px', fontWeight: 900, fontSize: '26px' }}>HOD</div>
            <p style={{ color: T.muted, fontSize: '15px' }}>Visionary leadership guiding our department towards technical excellence.</p>
          </div>
        </FadeUp>
        <FadeUp delay={0.15}>
          <motion.div whileHover={{ boxShadow: isDark ? '0 30px 80px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.12)' }}
            style={{
              background: isDark
                ? 'linear-gradient(135deg,rgba(255,255,255,0.04) 0%,rgba(185,255,102,0.04) 100%)'
                : 'linear-gradient(135deg,#FFFFFF 0%,rgba(185,255,102,0.06) 100%)',
              border: isDark ? '1px solid rgba(185,255,102,0.2)' : '1px solid rgba(0,0,0,0.08)',
              borderRadius: '32px', padding: '52px',
              display: 'grid', gridTemplateColumns: '200px 1fr', gap: '48px', alignItems: 'center',
              backdropFilter: isDark ? 'blur(20px)' : 'none',
              position: 'relative', overflow: 'hidden',
              boxShadow: isDark ? 'none' : '0 4px 30px rgba(0,0,0,0.06)',
              transition: 'all 0.4s',
            }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '280px', height: '280px', borderRadius: '50%',
              background: isDark ? 'radial-gradient(circle,rgba(185,255,102,0.08) 0%,transparent 70%)' : 'radial-gradient(circle,rgba(185,255,102,0.18) 0%,transparent 70%)',
              pointerEvents: 'none' }} />
            <div style={{ textAlign: 'center' }}>
              <motion.div whileHover={{ scale: 1.06 }} style={{ width: '160px', height: '160px', borderRadius: '24px', overflow: 'hidden', margin: '0 auto', border: '3px solid rgba(185,255,102,0.45)', boxShadow: '0 0 40px rgba(185,255,102,0.15)' }}>
                <img
                  src={settings.hod_photo_url || hod?.photo_url || `https://ui-avatars.com/api/?name=Dr+G+K+Pothal&background=B9FF66&color=191A23&size=512`}
                  alt="HOD" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e: any) => { e.target.src = 'https://ui-avatars.com/api/?name=HOD&background=B9FF66&color=191A23&size=512' }}
                />
              </motion.div>
              <div style={{ marginTop: '16px', fontWeight: 800, fontSize: '16px', color: T.text }}>{settings.hod_name}</div>
              <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700, marginTop: '4px' }}>Head of Department</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', color: '#B9FF66', fontWeight: 900, lineHeight: 0.5, marginBottom: '16px' }}>"</div>
              <p style={{ fontSize: '18px', lineHeight: 1.8, color: T.muted, fontStyle: 'italic', transition: 'color 0.4s' }}>{settings.hod_quote}</p>
              <div style={{ marginTop: '28px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ background: isDark ? 'rgba(185,255,102,0.1)' : 'rgba(22,163,74,0.08)', border: isDark ? '1px solid rgba(185,255,102,0.2)' : '1px solid rgba(22,163,74,0.2)', padding: '6px 16px', borderRadius: '99px', fontSize: '12px', color: isDark ? '#B9FF66' : '#16a34a', fontWeight: 700 }}>Civil Engineering</span>
                <span style={{ background: isDark ? 'rgba(100,121,255,0.1)' : 'rgba(100,121,255,0.08)', border: isDark ? '1px solid rgba(100,121,255,0.2)' : '1px solid rgba(100,121,255,0.2)', padding: '6px 16px', borderRadius: '99px', fontSize: '12px', color: '#6479FF', fontWeight: 700 }}>IGIT SARANG</span>
              </div>
            </div>
          </motion.div>
        </FadeUp>
      </section>

      {/* ──────────────── GALLERY ──────────────── */}
      <section id="gallery" style={{ padding: '0 8% 120px', position: 'relative', zIndex: 1 }}>
        <FadeUp>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: '#B9FF66', color: '#191A23', padding: '4px 16px', borderRadius: '10px', fontWeight: 900, fontSize: '26px' }}>Gallery</div>
              <p style={{ color: T.muted, fontSize: '15px' }}>Capturing moments of innovation and learning.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[{ label: '←', fn: () => setCurrentGalleryIdx(p => (p - 1 + activeGallery.length) % activeGallery.length) },
                { label: '→', fn: () => setCurrentGalleryIdx(p => (p + 1) % activeGallery.length) }].map(btn => (
                <motion.button key={btn.label} onClick={btn.fn}
                  whileHover={{ scale: 1.1, background: '#B9FF66', color: '#191A23' }} whileTap={{ scale: 0.9 }}
                  style={{ width: '46px', height: '46px', borderRadius: '14px', background: T.surface, color: T.text, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: T.shadow }}
                >{btn.label}</motion.button>
              ))}
            </div>
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div style={{ position: 'relative', borderRadius: '32px', overflow: 'hidden', height: '520px', border: `1px solid ${T.border}`, boxShadow: isDark ? 'none' : '0 8px 40px rgba(0,0,0,0.1)' }}>
            <AnimatePresence mode="wait">
              <motion.div key={currentGalleryIdx}
                initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <img src={(activeGallery[currentGalleryIdx] as any)?.image_url || ''} alt="Gallery"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.72) 0%,transparent 55%)' }} />
                <div style={{ position: 'absolute', bottom: '36px', left: '40px' }}>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#FFFFFF', marginBottom: '6px' }}>{(activeGallery[currentGalleryIdx] as any)?.title || 'Departmental Highlight'}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>📍 Civil Engineering, IGIT SARANG</div>
                </div>
                <div style={{ position: 'absolute', bottom: '40px', right: '36px', display: 'flex', gap: '8px' }}>
                  {activeGallery.map((_, i) => (
                    <motion.div key={i} onClick={() => setCurrentGalleryIdx(i)}
                      animate={{ width: i === currentGalleryIdx ? '28px' : '8px', background: i === currentGalleryIdx ? '#B9FF66' : 'rgba(255,255,255,0.4)' }}
                      style={{ height: '8px', borderRadius: '99px', cursor: 'pointer' }}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </FadeUp>
      </section>

      {/* ──────────────── FEATURES ──────────────── */}
      <section id="features" style={{ padding: '0 8% 120px', position: 'relative', zIndex: 1 }}>
        <FadeUp>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
            <div style={{ background: '#B9FF66', color: '#191A23', padding: '4px 16px', borderRadius: '10px', fontWeight: 900, fontSize: '26px' }}>Features</div>
            <p style={{ color: T.muted, fontSize: '15px' }}>Integrated tools designed to streamline academic workflows.</p>
          </div>
        </FadeUp>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '24px' }}>
          {features.map((f, i) => (
            <motion.a key={f.title}
              href={f.href.startsWith('http') ? f.href : undefined}
              onClick={!f.href.startsWith('http') && f.href !== '#faculty' ? (e) => { e.preventDefault(); router.push(f.href) } : undefined}
              target={f.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <FeatureCard title={f.title} desc={f.desc} icon={f.icon} accent={f.accent} isDark={isDark} />
            </motion.a>
          ))}
        </div>
      </section>

      {/* ──────────────── FACULTY ──────────────── */}
      {settings.show_faculties && faculties.length > 0 && (
        <section id="faculty" style={{ padding: '0 8% 120px', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
              <div style={{ background: '#B9FF66', color: '#191A23', padding: '4px 16px', borderRadius: '10px', fontWeight: 900, fontSize: '26px' }}>Faculty</div>
              <p style={{ color: T.muted, fontSize: '15px' }}>Meet the experts guiding the next generation of engineers.</p>
            </div>
          </FadeUp>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: '20px' }}>
            {faculties.map(fac => <FacultyCard key={fac.id} prof={fac} isDark={isDark} />)}
          </div>
        </section>
      )}

      {/* ──────────────── NOTICES ──────────────── */}
      {notices.length > 0 && (
        <section style={{ padding: '0 8% 120px', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '36px' }}>
              <div style={{ background: '#6479FF', color: '#FFFFFF', padding: '4px 16px', borderRadius: '10px', fontWeight: 900, fontSize: '24px' }}>Notices</div>
            </div>
          </FadeUp>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notices.slice(0, 4).map((n, i) => (
              <ExpandableNotice key={n.id || i} notice={n} delay={i * 0.07} T={T} isDark={isDark} index={i} />
            ))}
          </div>
        </section>
      )}



      <Footer />
    </div>
  )
}
