'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import { Footer } from '@/components/landing/Footer'

export default function EventsPage() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
          padding: 32px 8%;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          background: rgba(var(--bg-rgb, 255, 255, 255), 0.9);
          backdrop-filter: blur(14px);
        }
        .landing-wrapper[data-theme='dark'] .navbar { background: rgba(12,12,14,0.9); }

        .logo { display: flex; align-items: center; gap: 12px; font-size: 28px; font-weight: 800; color: var(--dark); letter-spacing: -1.5px; text-decoration: none; }
        .landing-wrapper[data-theme='dark'] .logo { color: #FFFFFF; }
        .logo-box { width: 32px; height: 32px; background: var(--dark); color: var(--accent); display: flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: 900; }
        .landing-wrapper[data-theme='dark'] .logo-box { background: var(--accent); color: var(--dark); }

        .container { padding: 180px 8% 120px; max-width: 1200px; margin: 0 auto; }
        .header-tag { background: var(--accent); color: #191A23; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 38px; line-height: 1; display: inline-block; margin-bottom: 30px; }
        
        .event-card {
            border: 1px solid var(--dark);
            border-bottom: 8px solid var(--dark);
            border-radius: 30px;
            padding: 40px;
            margin-bottom: 40px;
            background: var(--white);
            display: grid;
            grid-template-columns: 1fr 240px;
            gap: 40px;
            transition: all 0.3s ease;
        }
        .landing-wrapper[data-theme='dark'] .event-card { border-color: #333440; border-bottom-color: #333440; background: #1A1B24; }

        .event-details { display: flex; flex-direction: column; gap: 10px; }
        .event-tag { color: var(--accent); font-weight: 800; font-size: 14px; text-transform: uppercase; }
        .event-title { font-size: 28px; font-weight: 800; margin-bottom: 15px; }
        .event-description { font-size: 16px; opacity: 0.8; line-height: 1.6; }
        .event-meta { margin-top: 20px; font-weight: 700; font-size: 16px; opacity: 0.9; }

        .image-box { border-radius: 20px; overflow: hidden; border: 1px solid rgba(0,0,0,0.1); }
        .image-box img { width: 100%; height: 100%; object-fit: cover; }

        .loader { width: 50px; height: 50px; border: 5px solid var(--accent); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 100px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .back-btn { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; color: var(--fg); text-decoration: none; margin-bottom: 40px; transition: 0.2s; }
        .back-btn:hover { color: var(--accent); transform: translateX(-5px); }

        @media (max-width: 900px) {
            .event-card { grid-template-columns: 1fr; }
        }
      `}</style>

      <nav className="navbar">
        <Link href="/" className="logo">
          <div className="logo-box">X</div>
          Positivus
        </Link>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button onClick={toggle} style={{ background: 'none', border: '1px solid var(--fg)', color: 'var(--fg)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
             {isDark ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </nav>

      <div className="container">
        <Link href="/" className="back-btn">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
           Back to Home
        </Link>

        <div>
           <span className="header-tag">Upcoming Events</span>
           <p style={{ fontSize: '20px', opacity: 0.7, marginBottom: '60px' }}>Join us for workshops, seminars, and other department events.</p>
        </div>

        {loading ? (
          <div className="loader"></div>
        ) : (
          <div className="events-list">
            {events.length > 0 ? events.map(ev => (
              <div key={ev.id} className="event-card">
                <div className="event-details">
                   <div className="event-tag">Event Date: {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'TBA'}</div>
                   <h2 className="event-title">{ev.title}</h2>
                   <p className="event-description">{ev.description || ev.content}</p>
                   {ev.venue && <div className="event-meta">Venue: {ev.venue}</div>}
                </div>
                {ev.image_url && (
                    <div className="image-box">
                       <img src={ev.image_url} alt="Event" />
                    </div>
                )}
              </div>
            )) : <p style={{ textAlign: 'center', fontSize: '20px', padding: '100px 0' }}>No upcoming events currently scheduled.</p>}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
