'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

export function Footer() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const T = {
    bg: isDark ? '#020617' : '#F8FAFC',
    text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B',
    border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    accent: '#6366F1',
    card: isDark ? 'rgba(15, 23, 42, 0.4)' : '#FFFFFF',
    shadow: isDark ? 'none' : '0 10px 30px rgba(0,0,0,0.03)',
  }

  return (
    <footer className="footer-elegant" style={{
      background: T.bg,
      color: T.text,
      borderTop: `1px solid ${T.border}`,
      padding: isMobile ? '60px 24px 40px' : '80px 8% 60px',
      position: 'relative',
      zIndex: 10,
      transition: 'all 0.4s ease'
    }}>
      <style jsx>{`
        .footer-elegant {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr 1fr 1.5fr;
          gap: 40px;
          margin-bottom: 60px;
        }
        @media (max-width: 1200px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
        }
        @media (max-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
        }

        .footer-col-title {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #6366F1;
          margin-bottom: 24px;
        }

        .footer-link {
          display: block;
          text-decoration: none;
          color: ${T.muted};
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 14px;
          transition: all 0.2s ease;
        }
        .footer-link:hover {
          color: #6366F1;
          transform: translateX(4px);
        }

        .contact-item {
          display: flex;
          gap: 12px;
          font-size: 14px;
          color: ${T.muted};
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .contact-icon {
          width: 20px;
          color: #6366F1;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .dev-container {
           display: flex;
           flex-direction: column;
           gap: 16px;
           padding: 24px;
           border-radius: 24px;
           background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
           border: 1px solid ${T.border};
           width: 100%;
           max-width: 400px;
        }

        .dev-pill {
           display: flex;
           align-items: center;
           justify-content: space-between;
           padding: 12px 18px;
           background: ${isDark ? 'rgba(99,102,241,0.06)' : '#fff'};
           border: 1px solid ${T.border};
           border-radius: 12px;
           text-decoration: none;
           transition: all 0.3s ease;
           box-shadow: 0 4px 12px rgba(0,0,0,x0.03);
        }
        .dev-pill:hover {
           border-color: #6366F1;
           transform: translateY(-2px);
           box-shadow: 0 8px 24px rgba(99, 102, 241, 0.1);
        }

        .qa-card {
           display: flex;
           align-items: center;
           gap: 12px;
           padding: 12px 16px;
           background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
           border: 1px solid ${T.border};
           border-radius: 12px;
           text-decoration: none;
           color: ${T.text};
           font-size: 14px;
           font-weight: 700;
           margin-bottom: 10px;
           transition: all 0.2s ease;
        }
        .qa-card:hover {
           background: #6366F1;
           color: #FFF;
           border-color: #6366F1;
           transform: translateY(-2px);
        }

        .bottom-bar {
          padding-top: 40px;
          border-top: 1px solid ${T.border};
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        .copyright {
          font-size: 13px;
          color: ${T.muted};
          font-weight: 500;
        }
      `}</style>

      <div className="footer-grid">
        {/* Column 1: Contact Us (Moved from Right) */}
        <div>
          <div className="footer-col-title">Contact Us</div>
          <div className="contact-item">
            <div className="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="12" r="3" /></svg>
            </div>
            <div>
              <strong>Campus Address</strong><br />
              IGIT Sarang, Dhenkanal<br />
              Odisha - 759146
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            </div>
            <div>
              <strong>Email Inquiries</strong><br />
              civil@igitsarang.ac.in
            </div>
          </div>
        </div>

        {/* Column 2: Navigation */}
        <div>
          <div className="footer-col-title">Navigation</div>
          <a href="#hod" className="footer-link">HOD's Message</a>
          <a href="#features" className="footer-link">Portal Features</a>
          <a href="#faculty" className="footer-link">Our Faculty</a>
          <a href="#gallery" className="footer-link">Image Gallery</a>
        </div>

        {/* Column 3: Resources */}
        <div>
          <div className="footer-col-title">Resources</div>
          <a href="https://igit.icrp.in" target="_blank" rel="noopener noreferrer" className="qa-card">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            ERP Login
          </a>
          <a href="https://igitsarang.ac.in/students/coursestructure" target="_blank" rel="noopener noreferrer" className="qa-card">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" /></svg>
            Syllabus
          </a>
          <a href="https://igitsarang.ac.in" target="_blank" rel="noopener noreferrer" className="qa-card">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
            Institute Website
          </a>
        </div>

        {/* Column 4: Developed By (Moved from Bottom) */}
        <div>
          <div className="footer-col-title">Developed By</div>
          <div className="dev-container">
            {/* CodexCrew Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#6366F1', letterSpacing: '-0.5px' }}>CodexCrew</div>
                <div style={{ fontSize: '10px', color: T.muted, fontWeight: 700, marginTop: '-2px' }}> THE CODING CLUB OF IGIT SARANG</div>
              </div>
              <div style={{ width: '1px', height: '24px', background: T.border }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href="https://www.linkedin.com/company/codexcrew-igit" target="_blank" rel="noopener noreferrer" style={{ color: T.muted, transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#0077B5'} onMouseOut={e => e.currentTarget.style.color = T.muted}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </a>
                <a href="https://www.instagram.com/codexcrew.igit/" target="_blank" rel="noopener noreferrer" style={{ color: T.muted, transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#E4405F'} onMouseOut={e => e.currentTarget.style.color = T.muted}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                </a>
                <a href="https://codexcrewlive.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: T.muted, transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#6366F1'} onMouseOut={e => e.currentTarget.style.color = T.muted}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                </a>
              </div>
            </div>

            {/* Personal Dev Pill */}
            <a href="https://www.linkedin.com/in/priyankar-padhy-06aa3137a" target="_blank" rel="noopener noreferrer" className="dev-pill">
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '9px', color: '#6366F1', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Lead Developer</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: T.text, marginTop: '2px' }}>Priyankar Padhy</div>
                <div style={{ fontSize: '10px', color: T.muted, fontWeight: 700, marginTop: '2px' }}>43rd Civil Engineering</div>
              </div>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#0077B5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <div className="copyright">
          © {new Date().getFullYear()} Dept. of Civil Engineering, IGIT Sarang. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
