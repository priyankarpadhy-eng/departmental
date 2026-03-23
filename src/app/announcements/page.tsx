'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import { Footer } from '@/components/landing/Footer'

export default function AnnouncementsPage() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
    <div className="landing-wrapper" data-theme={theme}>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        .landing-wrapper {
          --accent: #B9FF66;
          --dark: #191A23;
          --white: #FFFFFF;
          --bg: var(--white);
          --fg: var(--dark);
          background-color: var(--bg);
          color: var(--fg);
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.3s ease;
        }

        .landing-wrapper[data-theme='dark'] {
          --bg: #0C0C0E;
          --fg: #F3F3F3;
          --white: #0C0C0E;
        }

        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 8%;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          background: rgba(var(--bg-rgb, 255, 255, 255), 0.9);
          backdrop-filter: blur(14px);
        }
        .landing-wrapper[data-theme='dark'] .navbar { background: rgba(12,12,14,0.9); }

        .logo { display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 800; color: var(--dark); letter-spacing: -1px; text-decoration: none; }
        .landing-wrapper[data-theme='dark'] .logo { color: #FFFFFF; }
        .logo-box { width: 26px; height: 26px; background: var(--dark); color: var(--accent); display: flex; align-items: center; justify-content: center; border-radius: 6px; font-weight: 900; }
        .landing-wrapper[data-theme='dark'] .logo-box { background: var(--accent); color: var(--dark); }

        .container { padding: 140px 8% 80px; max-width: 1000px; margin: 0 auto; }
        .header-tag { background: var(--accent); color: #191A23; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 28px; line-height: 1; display: inline-block; margin-bottom: 24px; }
        
        .announcement-card {
            border: 1px solid var(--dark);
            border-bottom: 6px solid var(--dark);
            border-radius: 25px;
            padding: 32px;
            margin-bottom: 32px;
            background: var(--white);
            transition: all 0.3s ease;
        }
        .landing-wrapper[data-theme='dark'] .announcement-card { border-color: #333440; border-bottom-color: #333440; background: #1A1B24; }

        .announcement-date { font-weight: 700; color: var(--accent); margin-bottom: 8px; font-size: 13px; text-transform: uppercase; }
        .announcement-title { font-size: 24px; font-weight: 800; margin-bottom: 16px; line-height: 1.2; }
        .announcement-body { font-size: 16px; line-height: 1.6; opacity: 0.8; white-space: pre-wrap; }

        .loader { width: 40px; height: 40px; border: 4px solid var(--accent); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 80px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .back-btn { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; color: var(--fg); text-decoration: none; margin-bottom: 32px; transition: 0.2s; font-size: 14px; }
        .back-btn:hover { color: var(--accent); transform: translateX(-4px); }
      `}</style>

      <nav className="navbar">
        <Link href="/" className="logo">
          <div className="logo-box">X</div>
          Positivus
        </Link>
        <button onClick={toggle} style={{ background: 'none', border: '1px solid var(--fg)', color: 'var(--fg)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>
           {isDark ? 'Light' : 'Dark'}
        </button>
      </nav>

      <div className="container">
        <Link href="/" className="back-btn">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
           Back to Home
        </Link>

        <div>
           <span className="header-tag">Announcements</span>
           <p style={{ fontSize: '18px', opacity: 0.7, marginBottom: '40px' }}>Latest news and updates from the Civil Engineering Department.</p>
        </div>

        {loading ? (
          <div className="loader"></div>
        ) : (
          <div className="announcements-list">
            {announcements.length > 0 ? announcements.map(note => (
              <div key={note.id} className="announcement-card">
                <div className="announcement-date">
                   {note.created_at?.seconds ? new Date(note.created_at.seconds * 1000).toLocaleDateString() : 'Recent'}
                </div>
                <h2 className="announcement-title">{note.title}</h2>
                <div className="announcement-body">{note.body}</div>
              </div>
            )) : <p style={{ textAlign: 'center', fontSize: '18px', padding: '80px 0' }}>No announcements found.</p>}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
