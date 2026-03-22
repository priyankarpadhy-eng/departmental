'use client'

import Link from 'next/link'
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc } from 'firebase/firestore'
import type { UserRole, Profile, NewsEvent, GalleryPhoto } from '@/types'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FluidCanvas } from '@/components/landing/FluidCanvas'
import { useTheme } from '@/context/ThemeContext'

gsap.registerPlugin(ScrollTrigger)

const ROLE_ROUTES: Record<UserRole, string> = {
  admin: '/dashboard/admin',
  hod: '/dashboard/hod',
  faculty: '/dashboard/faculty',
  student: '/dashboard/student',
  alumni: '/dashboard/alumni',
}

export default function LandingPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const [faculties, setFaculties] = useState<Profile[]>([])
  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<NewsEvent[]>([])
  const [gallery, setGallery] = useState<GalleryPhoto[]>([])
  const [hod, setHod] = useState<Profile | null>(null)
  
  const [settings, setSettings] = useState({
    title: 'Excellence in Engineering',
    subtitle: 'A unified platform for innovation, academics, and collaborative growth.',
    hod_quote: 'Our department is dedicated to fostering an environment of technical excellence and creative innovation.',
    hod_name: 'Head of Department',
    hod_photo_url: '',
    show_faculties: true,
    show_gallery: true,
  })
  
  const [loading, setLoading] = useState(true)
  
  // Refs for animations
  const heroRef = useRef<HTMLDivElement>(null)
  const hodRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const facultyRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Try High-Speed MongoDB Unified Public API
        const response = await fetch('/api/public/landing');
        if (response.ok) {
          const data = await response.json();
          setFaculties(data.faculties || []);
          setNotices(data.announcements || []);
          setEvents(data.events || []);
          setGallery(data.gallery || []);
          if (data.hod) setHod(data.hod);
          if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
          setLoading(false);
          return;
        }

        // 2. Fallback: Original Firestore
        const [facSnap, noticeSnap, hodSnap, eventSnap, gallerySnap, settingsSnap] = await Promise.all([
          getDocs(query(collection(db, 'profiles'), where('role', '==', 'faculty'), limit(8))),
          getDocs(query(collection(db, 'announcements'), orderBy('created_at', 'desc'), limit(5))),
          getDocs(query(collection(db, 'profiles'), where('role', '==', 'hod'), limit(1))),
          getDocs(query(collection(db, 'news_events'), orderBy('created_at', 'desc'), limit(3))),
          getDocs(query(collection(db, 'gallery'), orderBy('created_at', 'desc'), limit(6))),
          getDoc(doc(db, 'settings', 'landing'))
        ])

        setFaculties(facSnap.docs.map(d => ({ id: d.id, ...d.data() } as Profile)))
        setNotices(noticeSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setEvents(eventSnap.docs.map(d => ({ id: d.id, ...d.data() } as NewsEvent)))
        setGallery(gallerySnap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryPhoto)))
        if (!hodSnap.empty) setHod(hodSnap.docs[0].data() as Profile)
        
        if (settingsSnap.exists()) {
          const sd = settingsSnap.data()
          setSettings(prev => ({ ...prev, ...sd }))
        }
      } catch (err) {
        console.error('Error fetching landing data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (loading) return

    // Hero Animation
    if (heroRef.current) {
        const q = gsap.utils.selector(heroRef.current)
        gsap.fromTo(q('.hero-text'), 
            { y: 50, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 1.2, stagger: 0.2, ease: "power4.out" }
        )
    }

    // Scroll Animations
    const sections = [hodRef, featuresRef, facultyRef, galleryRef]
    sections.forEach(ref => {
        if (!ref.current) return
        gsap.fromTo(ref.current,
            { y: 60, opacity: 0 },
            { 
                y: 0, opacity: 1, 
                duration: 1.2, 
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ref.current,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        )
    })
    
    // Card Staggers
    if (featuresRef.current) {
        gsap.fromTo(gsap.utils.selector(featuresRef.current)('.notice-card'),
            { y: 40, opacity: 0 },
            { 
                y: 0, opacity: 1, 
                duration: 0.8, 
                stagger: 0.1,
                scrollTrigger: {
                    trigger: featuresRef.current,
                    start: "top 75%",
                }
            }
        )
    }

    return () => { ScrollTrigger.getAll().forEach((t: any) => t.kill()) }
  }, [loading])

  const handleDashboardRedirect = () => {
    if (profile?.role) {
      router.push(ROLE_ROUTES[profile.role as UserRole] || '/login')
    }
  }

  if (authLoading && !profile) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div className="loader"></div>
      </div>
    )
  }

  return (
    <div className="landing-wrapper" data-theme={theme}>
      <style jsx>{`
        /* Landing theme-aware variables */
        .landing-wrapper[data-theme='light'] {
          --lbg: #f8f7f4;
          --lfg: #1a1a18;
          --lcard: rgba(0,0,0,0.03);
          --lcard-border: rgba(0,0,0,0.07);
          --lcard-hover-bg: rgba(0,0,0,0.05);
          --lmuted: rgba(0,0,0,0.5);
          --lmuted2: rgba(0,0,0,0.7);
          --lnav: rgba(248,247,244,0.85);
          --lhero: linear-gradient(160deg, #f8f7f4 0%, #e8f0fb 100%);
          --hod-glow: rgba(26,115,232,0.06);
          --quote-glow: rgba(26,115,232,0.2);
        }
        .landing-wrapper[data-theme='dark'] {
          --lbg: #0a0a0a;
          --lfg: #ffffff;
          --lcard: rgba(255,255,255,0.03);
          --lcard-border: rgba(255,255,255,0.05);
          --lcard-hover-bg: rgba(255,255,255,0.05);
          --lmuted: rgba(255,255,255,0.5);
          --lmuted2: rgba(255,255,255,0.75);
          --lnav: rgba(10,10,10,0.6);
          --lhero: transparent;
          --hod-glow: rgba(26,115,232,0.08);
          --quote-glow: rgba(26,115,232,0.3);
        }
        .landing-wrapper {
          background-color: var(--lbg, #0a0a0a);
          color: var(--lfg, #ffffff);
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
          transition: background-color 0.4s ease, color 0.4s ease;
        }

        /* Navbar Glassmorphism */
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 5%;
          background: var(--lnav);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          border-bottom: 1px solid var(--lcard-border);
          transition: background 0.3s ease;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: var(--lfg);
        }
        
        .btn-glass {
            background: var(--lcard);
            backdrop-filter: blur(10px);
            border: 1px solid var(--lcard-border);
            color: var(--lfg);
            padding: 10px 24px;
            border-radius: 30px;
            font-weight: 500;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .btn-glass.primary {
            background: var(--lfg);
            color: var(--lbg);
            border: none;
        }
        .btn-glass:hover {
            transform: translateY(-2px);
            background: var(--lcard-hover-bg);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .btn-glass.primary:hover {
            opacity: 0.9;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        /* Interactive Hero Section */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 100px 5%;
          overflow: hidden;
          background: var(--lhero);
        }
        .hero-content {
            position: relative;
            z-index: 10;
            max-width: 900px;
        }
        .hero h1 {
          font-size: clamp(3rem, 6vw, 5.5rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -1px;
          margin-bottom: 24px;
          background: linear-gradient(180deg, var(--lfg) 0%, var(--lmuted) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero p {
          font-size: clamp(1.1rem, 2vw, 1.4rem);
          color: var(--lmuted);
          margin-bottom: 40px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        /* Generic Sections */
        section {
          padding: 120px 5%;
          position: relative;
          z-index: 2;
        }
        .section-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
          color: var(--lfg);
        }
        .section-subtitle {
          color: var(--lmuted);
          font-size: 1.1rem;
          margin-bottom: 60px;
        }

        /* Features (Notices & Events) */
        .features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
        }
        .notice-card {
            background: var(--lcard);
            border: 1px solid var(--lcard-border);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 16px;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
        }
        .notice-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(45deg, transparent, var(--lcard-hover-bg), transparent);
            transform: translateX(-100%);
            transition: 0.6s ease;
        }
        .notice-card:hover {
            transform: translateY(-8px) scale(1.02);
            background: var(--lcard-hover-bg);
            border-color: var(--lcard-border);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .notice-card:hover::before {
            transform: translateX(100%);
        }
        .n-meta {
            font-size: 12px;
            color: #1a73e8;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        .n-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--lfg);
        }
        .n-body {
            color: var(--lmuted);
            font-size: 14px;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        /* Faculty Cards */
        .fac-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 30px;
        }
        .fac-card {
            background: var(--lcard);
            border: 1px solid var(--lcard-border);
            border-radius: 24px;
            padding: 30px 24px;
            text-align: center;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .fac-card:hover {
            transform: translateY(-10px);
            background: var(--lcard-hover-bg);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .fac-card img {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
            margin-bottom: 20px;
            border: 2px solid var(--lcard-border);
            transition: transform 0.5s ease;
        }
        .fac-card:hover img {
            transform: scale(1.1);
        }
        .fac-name { font-weight: 600; font-size: 18px; margin-bottom: 4px; color: var(--lfg); }
        .fac-role { color: var(--lmuted); font-size: 13px; }

        /* Gallery 3D hover */
        .gal-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            perspective: 1000px;
        }
        .gal-item {
            position: relative;
            border-radius: 24px;
            overflow: hidden;
            aspect-ratio: 4/3;
            transform-style: preserve-3d;
            transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .gal-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.8s ease, filter 0.5s ease;
            filter: grayscale(40%) brightness(0.8);
        }
        .gal-item:hover {
            transform: translateZ(30px) scale(1.02);
            box-shadow: 0 30px 60px rgba(0,0,0,0.6);
            z-index: 10;
        }
        .gal-item:hover img {
            transform: scale(1.1);
            filter: grayscale(0%) brightness(1.1);
        }

        /* HOD Card */
        .hod-section {
            max-width: 900px;
            margin: 0 auto;
        }
        .hod-card {
            display: flex;
            gap: 48px;
            align-items: center;
            background: var(--lcard);
            border: 1px solid var(--lcard-border);
            border-radius: 32px;
            padding: 48px;
            position: relative;
            overflow: hidden;
            transition: all 0.5s ease;
        }
        .hod-card::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at top left, var(--hod-glow), transparent 60%);
            pointer-events: none;
        }
        .hod-card:hover {
            border-color: var(--lcard-border);
            box-shadow: 0 30px 60px rgba(0,0,0,0.15);
            transform: translateY(-4px);
        }
        .hod-photo {
            width: 180px;
            height: 180px;
            border-radius: 24px;
            object-fit: cover;
            flex-shrink: 0;
            border: 1px solid rgba(255,255,255,0.1);
            filter: grayscale(20%);
            transition: all 0.4s ease;
        }
        .hod-card:hover .hod-photo {
            filter: grayscale(0%);
            transform: scale(1.03);
        }
        .hod-quote {
            font-size: clamp(1.1rem, 2vw, 1.4rem);
            font-style: italic;
            line-height: 1.7;
            color: var(--lmuted2);
            margin-bottom: 24px;
            position: relative;
        }
        .hod-quote::before {
            content: '"';
            font-size: 5rem;
            color: var(--quote-glow);
            position: absolute;
            top: -30px;
            left: -20px;
            line-height: 1;
            font-style: normal;
        }
        .hod-name { font-size: 18px; font-weight: 700; margin-bottom: 4px; color: var(--lfg); }
        .hod-title { color: var(--lmuted); font-size: 13px; }
        .blue-dot { display: inline-block; width: 6px; height: 6px; background: #1a73e8; border-radius: 50%; margin-right: 8px; }

        @media (max-width: 768px) {
            .features-grid { grid-template-columns: 1fr; gap: 40px; }
            .gal-grid { grid-template-columns: 1fr; }
            .hod-card { flex-direction: column; text-align: center; padding: 32px 24px; }
            .hod-photo { width: 130px; height: 130px; }
        }

        /* Landing theme toggle */
        .landing-theme-btn {
            background: var(--lcard);
            border: 1px solid var(--lcard-border);
            color: var(--lfg);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }
        .landing-theme-btn:hover {
            background: var(--lcard-hover-bg);
            transform: rotate(15deg);
        }
      `}</style>

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Department of Civil Engineering
        </div>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={toggle} className="landing-theme-btn" title={isDark ? 'Switch to Light' : 'Switch to Dark'}>
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          {user ? (
            <button onClick={handleDashboardRedirect} className="btn-glass primary">
              Enter Platform
            </button>
          ) : (
            <>
              <Link href="/login" className="btn-glass" style={{ border: 'none', background: 'transparent' }}>Log In</Link>
              <Link href="/login?mode=signup" className="btn-glass primary">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero with Fluid 3js Background */}
      <section className="hero" ref={heroRef}>
        <FluidCanvas />
        <div className="hero-content">
            <h1 className="hero-text">{settings.title}</h1>
            <p className="hero-text">{settings.subtitle}</p>
            <div className="hero-text" style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                {!user && <Link href="/login" className="btn-glass primary">Join Portal</Link>}
                {user && <button onClick={handleDashboardRedirect} className="btn-glass primary">Enter Platform</button>}
            </div>
        </div>
      </section>

      {/* HOD Message */}
      <section id="hod" ref={hodRef}>
        <div className="hod-section">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="section-title">Message from the Head</h2>
            <p className="section-subtitle">Leadership that inspires excellence.</p>
          </div>
          <div className="hod-card">
            <img
              src={settings.hod_photo_url || hod?.photo_url || `https://ui-avatars.com/api/?name=${settings.hod_name || 'HOD'}&background=111827&color=ffffff&size=200`}
              alt="Head of Department"
              className="hod-photo"
              loading="lazy"
            />
            <div style={{ flex: 1 }}>
              <p className="hod-quote">
                {settings.hod_quote}
              </p>
              <div className="hod-name">
                <span className="blue-dot"></span>
                {settings.hod_name || hod?.full_name || 'Dr. Head of Department'}
              </div>
              <div className="hod-title">{hod?.designation || 'Head of Department'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Updates Section */}
      <section id="features" ref={featuresRef}>
        <div className="features-grid">
            <div>
                <h2 className="section-title">Latest Updates</h2>
                <p className="section-subtitle">Important announcements and notices.</p>
                <div>
                    {notices.map((n, i) => (
                        <div key={n.id || i} className="notice-card">
                            <div className="n-meta">{new Date(n.created_at).toLocaleDateString()}</div>
                            <div className="n-title">{n.title}</div>
                            <div className="n-body">{n.body}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h2 className="section-title">Upcoming Events</h2>
                <p className="section-subtitle">Workshops, symposiums, and cultural fests.</p>
                <div>
                    {events.map((e, i) => (
                        <div key={e.id || i} className="notice-card" style={{ borderColor: 'rgba(26, 115, 232, 0.2)' }}>
                            <div className="n-meta" style={{ color: '#4ade80' }}>
                                {new Date(e.event_date || e.created_at).toLocaleDateString()}
                            </div>
                            <div className="n-title">{e.title}</div>
                            <div className="n-body">{e.body}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* Faculty */}
      {settings.show_faculties && (
        <section id="faculty" ref={facultyRef}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 className="section-title">Academic Leaders</h2>
            <p className="section-subtitle">Guiding the next generation of pioneers.</p>
          </div>
          <div className="fac-grid">
            {faculties.map(f => (
              <div key={f.id} className="fac-card">
                <img src={f.photo_url || `https://ui-avatars.com/api/?name=${f.full_name}&background=111&color=fff`} alt={f.full_name || ''} loading="lazy" />
                <div className="fac-name">{f.full_name}</div>
                <div className="fac-role">{f.designation || 'Faculty Member'}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {settings.show_gallery && (
        <section id="gallery" ref={galleryRef}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 className="section-title">Moments & Memories</h2>
            <p className="section-subtitle">Life across the campus.</p>
          </div>
          <div className="gal-grid">
            {gallery.map(p => (
              <div key={p.id} className="gal-item">
                <img src={p.image_url} alt={p.title || 'Gallery'} loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Minimal Footer */}
      <footer style={{ padding: '60px 5%', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
        <p>© {new Date().getFullYear()} Institu Portal. Developed with precision.</p>
      </footer>
    </div>
  )
}
