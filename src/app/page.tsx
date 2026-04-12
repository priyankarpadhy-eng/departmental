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
import LandingStorageSearch from '@/components/landing/LandingStorageSearch'

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
      background: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
      border: isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(0,0,0,0.08)',
      borderRadius: '20px', padding: '28px 20px',
      backdropFilter: 'blur(12px)', textAlign: 'center', cursor: 'default',
      boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)',
    }}
  >
    <div style={{ fontSize: '34px', marginBottom: '8px' }}>{icon}</div>
    <div style={{ fontSize: '32px', fontWeight: 900, color: '#6366F1', letterSpacing: '-1.5px',
      textShadow: isDark ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none' }}>{value}</div>
    <div style={{ fontSize: '13px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.75)', marginTop: '8px', fontWeight: 700 }}>{label}</div>
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
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: open ? '#6366F1' : '#64748B', flexShrink: 0, transition: 'background 0.3s' }} />
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
const FacultyCard = ({ prof, isDark, T }: { prof: any; isDark: boolean; T: any }) => (
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
      border: `3px solid ${T.accent}33`, overflow: 'hidden', flexShrink: 0,
    }}>
      <img
        src={prof.photo_url || prof.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.full_name || 'F')}&background=6366F1&color=FFFFFF&size=200`}
        alt={prof.full_name || 'Faculty'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e: any) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.full_name || 'F')}&background=6366F1&color=FFFFFF&size=200` }}
      />
    </div>
    <div>
      <div style={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#191A23', fontSize: '15px' }}>{prof.full_name}</div>
      <div style={{ fontSize: '12px', color: T.accent, marginTop: '4px', fontWeight: 700 }}>{prof.designation || 'Faculty'}</div>
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
  const [isPaused, setIsPaused] = useState(false)
  const [hod, setHod] = useState<Profile | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [loading, setLoading] = useState(true)

  // Verification State
  const [vRef, setVRef] = useState('')
  const [vResult, setVResult] = useState<any>(null)
  const [vLoading, setVLoading] = useState(false)
  const [vError, setVError] = useState('')

  async function handleInPageVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!vRef.trim()) return
    setVLoading(true)
    setVError('')
    setVResult(null)

    try {
      await new Promise(r => setTimeout(r, 1200)) // Deluxe delay
      const cleanId = vRef.trim()
      let snap: any = null

      if (!cleanId.includes('/')) {
        const directSnap = await getDoc(doc(db, 'requests', cleanId))
        if (directSnap.exists()) snap = directSnap
      }
      if (!snap) {
        const q = query(collection(db, 'requests'), where('reference_no', '==', cleanId))
        const qSnap = await getDocs(q)
        if (!qSnap.empty) snap = qSnap.docs[0]
      }

      if (snap && snap.exists()) {
        const data = snap.data()
        if (data.status === 'approved') setVResult({ ...data, id: snap.id })
        else setVError('Found, but status is: ' + (data.status || 'PENDING').toUpperCase())
      } else {
        setVError('No record found matching this Reference Number.')
      }
    } catch (err: any) {
      setVError(`Search Error: ${err.message}`)
    } finally {
      setVLoading(false)
    }
  }

  const [settings, setSettings] = useState({
    title: 'Civil Engineering Department, IGIT SARANG',
    subtitle: 'A unified platform for students, faculty, and alumni to collaborate, learn, and grow together.',
    hod_quote: 'Our mission is to nurture technical excellence and ethical leadership in our students.',
    hod_name: 'Dr. Goutam Kumar Pothal',
    hod_photo_url: '',
    show_faculties: true,
    show_gallery: true,
    logos: [],
  })

  // Dynamic theme tokens - Premium Indigo & Slate
  const T = {
    bg:        isDark ? '#020617'              : '#FFFFFF',
    surface:   isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.8)',
    border:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    text:      isDark ? '#F1F5F9'              : '#0F172A',
    muted:     isDark ? '#94A3B8'              : '#64748B',
    faint:     isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    navBg:     isDark ? 'rgba(2, 6, 23, 0.85)'  : 'rgba(255, 255, 255, 0.85)',
    navBorder: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
    orbA:      isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.15)',
    orbB:      isDark ? 'rgba(139, 92, 246, 0.10)' : 'rgba(139, 92, 246, 0.12)',
    shadow:    isDark ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(99, 102, 241, 0.05)',
    accent:    '#6366F1',
    accentDark: '#4F46E5',
    success:   '#6366F1',
  }

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const activeGallery = gallery.length > 0 ? gallery : [
    { id: 'p1', image_url: 'https://images.unsplash.com/photo-1590159491612-da7d25e0c06a?q=80&w=2000&auto=format&fit=crop', title: 'Department Entrance' },
    { id: 'p2', image_url: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=2000&auto=format&fit=crop', title: 'Construction Lab' },
    { id: 'p3', image_url: 'https://plus.unsplash.com/premium_photo-1661962283999-906969543884?q=80&w=2000&auto=format&fit=crop', title: 'Surveying Session' },
  ]

  // Auto-advance gallery - respects isPaused state
  useEffect(() => {
    if (gallery.length <= 1 || isPaused) return
    const timer = setInterval(() => setCurrentGalleryIdx(p => (p + 1) % gallery.length), 4500)
    return () => clearInterval(timer)
  }, [gallery.length, isPaused])

  // Preload gallery images to ensure they are fetched only once and kept in memory
  useEffect(() => {
    activeGallery.forEach((photo: any) => {
      if (photo.image_url) {
        const img = new Image();
        img.src = photo.image_url;
      }
    });
  }, [activeGallery]);

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
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #6366F1; border-radius: 99px; }

        .hero-title-dark {
          background: linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-title-light {
          background: linear-gradient(135deg, #0F172A 0%, #4338CA 100%);
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
          padding: isScrolled ? (isMobile ? '12px 5%' : '14px 8%') : (isMobile ? '16px 5%' : '20px 8%'),
          background: isScrolled ? T.navBg : (isDark ? 'rgba(10,10,15,0.5)' : 'rgba(248,250,245,0.5)'),
          backdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${isScrolled ? T.navBorder : 'transparent'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all 0.4s ease',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {(settings.logos && (settings as any).logos.length > 0) ? (
              (settings as any).logos.map((url: string, idx: number) => (
                <img 
                  key={idx}
                  src={url} 
                  alt="Logo" 
                  style={{ width: isMobile ? '30px' : '38px', height: 'auto', objectFit: 'contain' }} 
                />
              ))
            ) : (
                <div style={{ 
                  width: '36px', height: '36px', borderRadius: '8px', 
                  background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed rgba(99, 102, 241, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1', fontSize: '10px', fontWeight: 900
                }}>LOGO</div>
            )}
          </div>
          <span style={{ fontWeight: 800, fontSize: isMobile ? '13px' : '16px', color: T.text, letterSpacing: '0.3px', transition: 'color 0.4s' }}>Dept. of Civil Engineering</span>
        </Link>

        {!isMobile && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {['Storage', 'HOD', 'Gallery', 'Faculty', 'Features'].map((item) => (
              <motion.a key={item} href={item === 'Storage' ? '#central-tank' : `#${item.toLowerCase()}`}
                whileHover={{ color: '#B9FF66' }}
                style={{ textDecoration: 'none', color: T.muted, fontWeight: 600, fontSize: '14px', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', transition: 'color 0.2s' }}
              >{item}</motion.a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px', alignItems: 'center' }}>
          {!isMobile && (
            <motion.button onClick={toggle}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{ border: `1px solid ${T.border}`, background: T.faint, color: T.text, padding: '8px 14px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '15px', transition: 'all 0.3s' }}
            >{isDark ? '☀️' : '🌙'}</motion.button>
          )}

          {user ? (
            <motion.button onClick={handleDashboardRedirect}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{ background: '#6366F1', color: '#FFFFFF', padding: isMobile ? '8px 14px' : '10px 22px', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: isMobile ? '12px' : '14px' }}
            >{isMobile ? 'Dashboard' : 'Dashboard →'}</motion.button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href="#verify" style={{
                textDecoration: 'none', border: `1.5px solid ${T.border}`,
                background: T.faint, color: T.text, padding: isMobile ? '8px 14px' : '10px 22px',
                borderRadius: '12px', fontWeight: 800, fontSize: isMobile ? '12px' : '14px', display: 'block'
              }}>Verify</a>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/login" style={{
                  textDecoration: 'none', border: `1.5px solid ${T.accent}`,
                  background: isDark ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                  color: T.accent, padding: isMobile ? '8px 14px' : '10px 22px',
                  borderRadius: '12px', fontWeight: 900, fontSize: isMobile ? '12px' : '14px', display: 'block', transition: 'all 0.3s',
                }}>Login</Link>
              </motion.div>
            </div>
          )}

          {isMobile && (
            <motion.button 
              onClick={() => setMenuOpen(!menuOpen)}
              whileTap={{ scale: 0.9 }}
              style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.faint, border: `1px solid ${T.border}`, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {menuOpen ? <line x1="18" y1="6" x2="6" y2="18" /> : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </motion.button>
          )}
        </div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobile && menuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1001 }}
              />
              <motion.div 
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '280px', background: T.bg, zIndex: 1002, padding: '80px 24px 40px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: `1px solid ${T.border}`, boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }}
              >
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ color: T.muted, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>Explore</div>
                  {['Storage', 'HOD', 'Gallery', 'Faculty', 'Features'].map(item => (
                    <Link key={item} href={item === 'Storage' ? '#central-tank' : `#${item.toLowerCase()}`}
                      onClick={() => setMenuOpen(false)}
                      style={{ textDecoration: 'none', color: T.text, fontWeight: 700, fontSize: '17px', padding: '12px 16px', borderRadius: '12px', display: 'block', transition: 'all 0.2s', background: 'transparent' }}
                    >{item}</Link>
                  ))}
                </div>
                
                <div style={{ marginTop: 'auto' }}>
                  <button onClick={() => { toggle(); setMenuOpen(false); }} style={{ width: '100%', border: `1px solid ${T.border}`, background: T.faint, color: T.text, padding: '16px', borderRadius: '16px', fontWeight: 800, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    {isDark ? '☀️ Light' : '🌙 Dark'} Mode
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ──────────────── HERO ──────────────── */}
      <section style={{ padding: isMobile ? '120px 5% 60px' : '160px 8% 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: isMobile ? '20px' : '32px' }}>
            <span style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#6366F1', padding: '6px 18px',
              borderRadius: '99px', fontSize: isMobile ? '11px' : '13px', fontWeight: 700,
            }}>
              🎓 IGIT SARANG · Civil Engineering
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: isMobile ? '34px' : 'clamp(38px, 5.5vw, 68px)', fontWeight: 900, lineHeight: 1.1,
              letterSpacing: isMobile ? '-1.5px' : '-3px', marginBottom: '24px',
            }}
          >
            <span className={isDark ? 'hero-title-dark' : 'hero-title-light'}>
              {settings.title}
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ fontSize: isMobile ? '15px' : '18px', color: T.muted, lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 44px', fontWeight: 400, transition: 'color 0.4s' }}
          >{settings.subtitle}</motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            {user ? (
              <motion.button onClick={handleDashboardRedirect}
                whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${T.accent}33` }} whileTap={{ scale: 0.96 }}
                style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)', color: '#FFFFFF', padding: isMobile ? '14px 28px' : '16px 40px', borderRadius: '16px', border: 'none', fontWeight: 900, fontSize: isMobile ? '14px' : '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              >Manage Workspace <span>→</span></motion.button>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.05, boxShadow: `0 0 28px ${T.accent}22` }} whileTap={{ scale: 0.96 }} style={{ width: isMobile ? '100%' : 'auto' }}>
                  <Link href="/login" style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)', color: '#FFFFFF', padding: isMobile ? '14px' : '16px 36px', borderRadius: '16px', fontWeight: 900, fontSize: isMobile ? '14px' : '16px', textDecoration: 'none', display: 'block', textAlign: 'center' }}>Login Access →</Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} style={{ width: isMobile ? '100%' : 'auto' }}>
                  <Link href="/login" style={{
                    border: `1.5px solid ${T.border}`, background: T.faint,
                    color: T.text, padding: isMobile ? '14px' : '16px 36px', borderRadius: '16px',
                    fontWeight: 800, fontSize: isMobile ? '14px' : '16px', textDecoration: 'none', display: 'block', textAlign: 'center',
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
          style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? '8px' : '20px', maxWidth: '800px', margin: isMobile ? '40px auto 0' : '80px auto 0' }}
        >
            {[
              { value: '15+',   label: 'Expert Faculty',    icon: '👨‍🎓' },
              { value: '400+',  label: 'Students',          icon: '🎓' },
              { value: `${new Date().getFullYear() - 1983}+`,  label: 'Years Legacy',      icon: '🏛️' },
              { value: '30+',   label: 'Placements 2026',   icon: '💼' },
            ].map(s => <StatCard key={s.label} {...s} isDark={isDark} />)}
          </motion.div>
        </section>

  
        {/* ──────────────── HOD SECTION ──────────────── */}
        <section id="hod" style={{ padding: isMobile ? '0 5% 80px' : '0 8% 100px', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: isMobile ? '32px' : '48px' }}>
              <div style={{ background: T.accent, color: '#FFFFFF', padding: '4px 16px', borderRadius: '10px', fontWeight: 900, fontSize: isMobile ? '20px' : '26px' }}>HOD</div>
              <p style={{ color: T.muted, fontSize: isMobile ? '13px' : '15px' }}>Visionary leadership guiding our department.</p>
            </div>
          </FadeUp>
          <FadeUp delay={0.15}>
            <motion.div whileHover={isMobile ? {} : { boxShadow: isDark ? '0 30px 80px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.12)' }}
              style={{
                background: isDark
                  ? 'linear-gradient(135deg,rgba(255,255,255,0.04) 0%,rgba(99, 102, 241, 0.04) 100%)'
                  : 'linear-gradient(135deg,#FFFFFF 0%,rgba(99, 102, 241, 0.06) 100%)',
                border: isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: '32px', padding: isMobile ? '32px 24px' : '52px',
                display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '32px' : '48px', alignItems: 'center',
                backdropFilter: isDark ? 'blur(20px)' : 'none',
                position: 'relative', overflow: 'hidden',
                boxShadow: isDark ? 'none' : '0 4px 30px rgba(0,0,0,0.06)',
                transition: 'all 0.4s',
              }}
            >
              <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', borderRadius: '50%',
                background: isDark ? 'radial-gradient(circle,rgba(99, 102, 241, 0.08) 0%,transparent 70%)' : 'radial-gradient(circle,rgba(99, 102, 241, 0.18) 0%,transparent 70%)',
                pointerEvents: 'none' }} />
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <motion.div whileHover={{ scale: 1.06 }} style={{ width: isMobile ? '140px' : '160px', height: isMobile ? '140px' : '160px', borderRadius: '24px', overflow: 'hidden', margin: '0 auto', border: '3px solid rgba(99, 102, 241, 0.45)', boxShadow: '0 0 40px rgba(99, 102, 241, 0.15)' }}>
                  <img
                    src={settings.hod_photo_url || hod?.photo_url || `https://ui-avatars.com/api/?name=Dr+G+K+Pothal&background=6366F1&color=FFFFFF&size=512`}
                    alt="HOD" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e: any) => { e.target.src = 'https://ui-avatars.com/api/?name=HOD&background=6366F1&color=FFFFFF&size=512' }}
                  />
                </motion.div>
                <div style={{ marginTop: '16px', fontWeight: 800, fontSize: '16px', color: T.text }}>{settings.hod_name}</div>
                <div style={{ fontSize: '12px', color: '#6366F1', fontWeight: 700, marginTop: '4px' }}>Head of Department</div>
              </div>
              <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                <div style={{ fontSize: '48px', color: '#6366F1', fontWeight: 900, lineHeight: 0.5, marginBottom: '16px' }}>"</div>
                <p style={{ fontSize: isMobile ? '16px' : '18px', lineHeight: 1.8, color: T.muted, fontStyle: 'italic', transition: 'color 0.4s' }}>{settings.hod_quote}</p>
                <div style={{ marginTop: '28px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                  <span style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '6px 14px', borderRadius: '99px', fontSize: '11px', color: '#6366F1', fontWeight: 700 }}>Civil Engineering</span>
                  <span style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '6px 14px', borderRadius: '99px', fontSize: '11px', color: '#6366F1', fontWeight: 700 }}>IGIT SARANG</span>
                </div>
              </div>
            </motion.div>
          </FadeUp>
        </section>

        {/* ──────────────── CENTRAL STORAGE SEARCH ──────────────── */}
        <LandingStorageSearch isDark={isDark} T={T} />

        {/* ──────────────── QUICK VERIFICATION ──────────────── */}
        <section id="verify" style={{ padding: isMobile ? '0 5% 80px' : '0 8% 100px', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <div style={{
              background: isDark ? 'rgba(83, 74, 183, 0.05)' : 'rgba(83, 74, 183, 0.03)',
              border: `1px solid ${isDark ? 'rgba(83, 74, 183, 0.2)' : 'rgba(83, 74, 183, 0.1)'}`,
              borderRadius: '24px', padding: isMobile ? '32px 24px' : '52px 60px',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: '32px', marginBottom: (vResult || vError) ? '32px' : '0' }}>
                <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
                  <h3 style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 900, color: T.text, marginBottom: '12px' }}>Verify Certificates</h3>
                  <p style={{ color: T.muted, fontSize: '15px' }}>Enter the Tracking ID / Reference Number to validate any digital document instantly.</p>
                </div>
                
                <form onSubmit={handleInPageVerify} style={{ flex: 1, width: '100%', maxWidth: '500px', position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="Enter Tracking ID (e.g. IGIT/CE-02...)" 
                    value={vRef}
                    onChange={e => setVRef(e.target.value)}
                    style={{
                      width: '100%', padding: '18px 24px', borderRadius: '16px',
                      background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                      border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      color: T.text, fontSize: '15px', fontWeight: 600, outline: 'none',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#534AB7')}
                    onBlur={e => (e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}
                  />
                  <button 
                    disabled={vLoading}
                    type="submit"
                    style={{
                      position: 'absolute', right: '8px', top: '8px', bottom: '8px',
                      background: '#534AB7', color: '#fff', padding: '0 24px',
                      borderRadius: '12px', border: 'none', fontWeight: 800,
                      cursor: vLoading ? 'wait' : 'pointer', fontSize: '14px',
                    }}
                  >
                    {vLoading ? '...' : 'Verify'}
                  </button>
                </form>
              </div>

              {/* Results Area */}
              <AnimatePresence>
                {vLoading && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ width: '32px', height: '32px', border: '3px solid rgba(83, 74, 183, 0.2)', borderTop: '3px solid #534AB7', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    <p style={{ marginTop: '12px', color: '#534AB7', fontWeight: 700, fontSize: '13px' }}>Validating document from secure node...</p>
                  </motion.div>
                )}

                {vError && !vLoading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
                    padding: '24px', borderRadius: '16px', background: 'rgba(226,75,74,0.1)',
                    border: '1.5px solid rgba(226,75,74,0.3)', color: '#E24B4A',
                    display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{vError}</div>
                  </motion.div>
                )}

                {vResult && !vLoading && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{
                    marginTop: '20px', padding: '32px', borderRadius: '24px',
                    background: isDark ? 'rgba(185,255,102,0.06)' : '#fff',
                    border: '2px solid #B9FF66', boxShadow: '0 20px 40px rgba(185,255,102,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#B9FF66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>✅</div>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: T.text }}>Authentic Document Found</div>
                        <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 700 }}>VERIFIED BY CIVIL DEPT. IGIT SARANG</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px' }}>
                      <div style={{ background: T.faint, padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: T.muted, marginBottom: '6px', textTransform: 'uppercase' }}>Student Name</div>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{vResult.student_name}</div>
                      </div>
                      <div style={{ background: T.faint, padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: T.muted, marginBottom: '6px', textTransform: 'uppercase' }}>Reference No</div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#534AB7' }}>{vResult.reference_no}</div>
                      </div>
                      <div style={{ background: T.faint, padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: T.muted, marginBottom: '6px', textTransform: 'uppercase' }}>Doc Type</div>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{vResult.type.replace('_', ' ').toUpperCase()}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: '12px', color: T.muted, fontWeight: 600 }}>Issued on: {new Date(vResult.issued_date || vResult.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FadeUp>
        </section>

      {/* ──────────────── GALLERY ──────────────── */}
      <section id="gallery" style={{ padding: isMobile ? '0 5% 80px' : '0 8% 120px', position: 'relative', zIndex: 1 }}>
        <FadeUp>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '24px' : '40px', flexDirection: isMobile ? 'column' : 'row', gap: '16px', textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
              <div style={{ background: '#B9FF66', color: '#191A23', padding: '4px 16px', borderRadius: '10px', fontWeight: 900, fontSize: isMobile ? '20px' : '26px' }}>Gallery</div>
              <p style={{ color: T.muted, fontSize: isMobile ? '13px' : '15px' }}>Capturing moments of innovation.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <motion.button 
                onClick={() => setIsPaused(!isPaused)}
                whileHover={{ scale: 1.1, background: isPaused ? '#B9FF66' : T.surface }} 
                whileTap={{ scale: 0.9 }}
                style={{ 
                  width: '42px', height: '42px', borderRadius: '12px', 
                  background: isPaused ? '#B9FF66' : T.surface, 
                  color: isPaused ? '#191A23' : T.text, 
                  border: `1px solid ${T.border}`, 
                  cursor: 'pointer', fontSize: '18px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  transition: 'all 0.3s', boxShadow: T.shadow 
                }}
                title={isPaused ? 'Resume Slideshow' : 'Pause Slideshow'}
              >
                {isPaused ? '▶' : '⏸'}
              </motion.button>
              {[{ label: '←', fn: () => { setCurrentGalleryIdx(p => (p - 1 + activeGallery.length) % activeGallery.length); setIsPaused(true); } },
                { label: '→', fn: () => { setCurrentGalleryIdx(p => (p + 1) % activeGallery.length); setIsPaused(true); } }].map(btn => (
                <motion.button key={btn.label} onClick={btn.fn}
                  whileHover={{ scale: 1.1, background: T.accent, color: '#FFFFFF' }} whileTap={{ scale: 0.9 }}
                  style={{ width: '42px', height: '42px', borderRadius: '12px', background: T.surface, color: T.text, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: T.shadow }}
                >{btn.label}</motion.button>
              ))}
            </div>
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div style={{ position: 'relative', borderRadius: '32px', overflow: 'hidden', height: isMobile ? '400px' : 'min(650px, 75vh)', border: `1px solid ${T.border}`, boxShadow: isDark ? 'none' : '0 12px 60px rgba(0,0,0,0.12)', background: '#000' }}>
            {activeGallery.map((photo, i) => (
              <motion.div 
                key={photo.id || i}
                initial={false}
                animate={{ 
                  opacity: i === currentGalleryIdx ? 1 : 0,
                  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                }}
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: i === currentGalleryIdx ? 'auto' : 'none' }}
              >
                {/* Blurred Background */}
                <img 
                  src={(photo as any)?.image_url || ''} 
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px) brightness(0.5) saturate(1.2)', opacity: 0.6 }} 
                  alt=""
                />
                
                {/* Sharp Foreground Image */}
                <img src={(photo as any)?.image_url || ''} alt="Gallery"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                
                {/* Gradient Overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 40%)', zIndex: 2 }} />
                
                <div style={{ position: 'absolute', bottom: isMobile ? '24px' : '40px', left: isMobile ? '24px' : '48px', right: isMobile ? '24px' : 'auto', zIndex: 3 }}>
                  <motion.div 
                    animate={{ opacity: i === currentGalleryIdx ? 1 : 0, y: i === currentGalleryIdx ? 0 : 20 }}
                    transition={{ delay: 0.2 }}
                    style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 900, color: '#FFFFFF', marginBottom: '8px', textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                    {(photo as any)?.title || 'Departmental Highlight'}
                  </motion.div>
                  <motion.div 
                    animate={{ opacity: i === currentGalleryIdx ? 1 : 0, y: i === currentGalleryIdx ? 0 : 20 }}
                    transition={{ delay: 0.3 }}
                    style={{ fontSize: isMobile ? '12px' : '14px', color: 'rgba(255,255,255,0.8)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: isMobile ? '16px' : '18px' }}>📍</span> {(photo as any)?.description || 'Civil Engineering, IGIT SARANG'}
                  </motion.div>
                </div>
              </motion.div>
            ))}
            
            <div style={{ position: 'absolute', bottom: isMobile ? '20px' : '44px', right: isMobile ? '50%' : '48px', transform: isMobile ? 'translateX(50%)' : 'none', display: 'flex', gap: '8px', zIndex: 10 }}>
              {activeGallery.map((_, i) => (
                <motion.div key={i} onClick={() => setCurrentGalleryIdx(i)}
                  animate={{ width: i === currentGalleryIdx ? (isMobile ? '24px' : '32px') : '8px', background: i === currentGalleryIdx ? '#B9FF66' : 'rgba(255,255,255,0.3)', opacity: i === currentGalleryIdx ? 1 : 0.6 }}
                  style={{ height: '8px', borderRadius: '50px', cursor: 'pointer', transition: 'all 0.3s' }}
                />
              ))}
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ──────────────── FEATURES ──────────────── */}
      <section id="features" style={{ padding: isMobile ? '0 5% 80px' : '0 8% 120px', position: 'relative', zIndex: 1 }}>
        <FadeUp>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', marginBottom: isMobile ? '32px' : '48px' }}>
            <div style={{ background: T.accent, color: '#FFFFFF', padding: '4px 16px', borderRadius: '10px', fontWeight: 900, fontSize: isMobile ? '20px' : '26px' }}>Features</div>
            <p style={{ color: T.muted, fontSize: isMobile ? '13px' : '15px' }}>Integrated academic tools.</p>
          </div>
        </FadeUp>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit,minmax(280px,1fr))', gap: '24px' }}>
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
        <section id="faculty" style={{ padding: isMobile ? '0 5% 80px' : '0 8% 120px', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', marginBottom: isMobile ? '32px' : '48px' }}>
              <div style={{ background: T.accent, color: '#FFFFFF', padding: '4px 16px', borderRadius: '10px', fontWeight: 900, fontSize: isMobile ? '20px' : '26px' }}>Faculty</div>
              <p style={{ color: T.muted, fontSize: isMobile ? '13px' : '15px' }}>Inspiring minds.</p>
            </div>
          </FadeUp>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(190px,1fr))', gap: isMobile ? '12px' : '20px' }}>
            {faculties.map(fac => <FacultyCard key={fac.id} prof={fac} isDark={isDark} T={T} />)}
          </div>
        </section>
      )}

      {/* ──────────────── NOTICES ──────────────── */}
      {notices.length > 0 && (
        <section style={{ padding: isMobile ? '0 5% 80px' : '0 8% 120px', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: isMobile ? '24px' : '36px' }}>
              <div style={{ background: '#6479FF', color: '#FFFFFF', padding: '4px 16px', borderRadius: '10px', fontWeight: 900, fontSize: isMobile ? '20px' : '24px' }}>Notices</div>
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
