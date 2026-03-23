'use client'

import React from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

export function Footer() {
  const { theme } = useTheme()

  return (
    <footer className="footer-wrapper" data-theme={theme}>
      <style jsx>{`
        .footer-wrapper {
          background: #191A23;
          color: #FFFFFF;
          padding: 60px 8% 40px;
          border-radius: 35px 35px 0 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .footer-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
        }

        .footer-logo {
          display: flex;
          align-items: center; gap: 10px; font-size: 18px; font-weight: 800; color: #FFFFFF; text-transform: uppercase;
        }

        .footer-links { display: flex; gap: 24px; }
        .footer-link { color: #FFFFFF; text-decoration: underline; text-underline-offset: 4px; font-size: 13px; font-weight: 600; }

        .footer-content {
          display: grid;
          grid-template-columns: 1fr 1fr 1.5fr;
          gap: 40px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 40px;
          margin-bottom: 40px;
        }

        .contact-box { background: #B9FF66; color: #191A23; padding: 4px 10px; border-radius: 6px; display: inline-block; font-weight: 800; margin-bottom: 16px; font-size: 13px; }
        .contact-info p { margin-bottom: 8px; font-size: 13px; opacity: 0.8; }

        .dev-card {
           background: #2B2C39; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 16px; transition: 0.3s;
        }
        .dev-card:hover { border-color: #B9FF66; }
        .dev-top-label { font-size: 11px; font-weight: 800; opacity: 0.5; text-transform: uppercase; color: #FFFFFF; margin-bottom: -4px; }
        
        .cc-brand-wrap { display: flex; align-items: center; gap: 12px; }
        .cc-logo-img { width: 50px; height: 50px; border-radius: 10px; object-fit: cover; background: #FFF; padding: 2px; }
        .cc-text-stack { display: flex; flex-direction: column; justify-content: center; height: 50px; }
        .cc-brand-name { font-size: 18px; font-weight: 800; color: #FFFFFF; line-height: 1.2; }
        .cc-desc { font-size: 12px; font-weight: 600; color: #B9FF66; line-height: 1.2; }

        .social-btns { display: flex; gap: 10px; }
        .social-btn {
           width: 32px; height: 32px; border-radius: 7px; display: flex; align-items: center; justify-content: center; transition: 0.3s; color: #FFFFFF;
        }
        .social-btn:hover { transform: translateY(-3px); }
        .btn-web { background: #333333; }
        .btn-insta { background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%,#d6249f 60%,#285AEB 90%); }
        .btn-link { background: #0077b5; }

        .divider { height: 1px; background: rgba(255,255,255,0.1); margin: 2px 0; }

        .lead-dev-drawer {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          margin-top: -16px; /* Negate the dev-card flex gap */
          transform: translateY(10px);
          transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .dev-card:hover .lead-dev-drawer {
          max-height: 120px;
          opacity: 1;
          margin-top: 0;
          transform: translateY(0);
        }

        .lead-dev { display: flex; align-items: center; gap: 12px; }
        .lead-pfp { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #B9FF66; background: #FFF; }
        .lead-info h6 { font-size: 9px; text-transform: uppercase; opacity: 0.6; color: #B9FF66; margin-bottom: 1px; font-weight: 700; }
        .lead-name { font-weight: 700; font-size: 14px; color: #FFFFFF; }
        .lead-batch { font-size: 10px; opacity: 0.5; }

        .resources-box { background: #B9FF66; padding: 24px; border-radius: 20px; color: #191A23; display: flex; flex-direction: column; gap: 16px; }
        .resource-link { 
          display: flex; align-items: center; gap: 10px; text-decoration: none; color: #191A23; font-weight: 800; font-size: 14px; padding: 10px 14px; background: rgba(25, 26, 35, 0.08); border-radius: 10px; transition: 0.2s;
        }
        .resource-link:hover { background: rgba(25, 26, 35, 0.15); transform: translateX(5px); }

        @media (max-width: 1100px) {
          .footer-top { flex-direction: column; gap: 32px; text-align: center; }
          .footer-content { grid-template-columns: 1fr; text-align: center; }
          .cc-brand-wrap { justify-content: center; }
          .social-btns { justify-content: center; }
          .lead-dev { justify-content: center; }
        }
      `}</style>

      <div className="footer-top">
        <div className="footer-logo">
          Dept. of Civil Engineering
        </div>
        <div className="footer-links">
          <a href="#hod" className="footer-link">HOD</a>
          <a href="#services" className="footer-link">Features</a>
          <a href="#faculty" className="footer-link">Faculty</a>
          <a href="#gallery" className="footer-link">Gallery</a>
        </div>
      </div>

      <div className="footer-content">
        <div className="contact-info">
          <div className="contact-box">Contact us:</div>
          <p>Address: IGIT Sarang, Dhenkanal, Odisha - 759146</p>
        </div>

        <div className="dev-card">
            <span className="dev-top-label">Developed by</span>
            <div className="cc-brand-wrap">
                <img src="https://image2url.com/r2/default/images/1774187613387-267e089d-b2d8-426a-baeb-9886607c68a5.png" alt="CodexCrew" className="cc-logo-img" />
                <div className="cc-text-stack">
                    <div className="cc-brand-name">CodexCrew</div>
                    <div className="cc-desc">The Coding Club of IGIT</div>
                </div>
            </div>
            <div className="social-btns">
              <a href="https://codexcrewlive.vercel.app/" target="_blank" rel="noopener noreferrer" className="social-btn btn-web" title="Website">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </a>
              <a href="https://www.instagram.com/codexcrew.igit/" target="_blank" rel="noopener noreferrer" className="social-btn btn-insta" title="Instagram">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/codexcrew/" target="_blank" rel="noopener noreferrer" className="social-btn btn-link" title="LinkedIn">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>

            <div className="lead-dev-drawer">
              <div className="divider" style={{ marginBottom: '16px' }}></div>
              <div className="lead-dev">
                  <img src={`https://media.licdn.com/dms/image/v2/D5603AQGPFf2D9m5oRw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1732009292816?e=1748438400&v=beta&t=uU5_vW_uU5_vW_uU5_vW_uU5_vW_uU5_vW_uU5_vW`} className="lead-pfp" alt="Priyankar" />
                  <div className="lead-info">
                     <h6>Lead Developer</h6>
                     <div className="lead-name">Priyankar Padhy</div>
                     <div className="lead-batch">43rd Civil Engineering</div>
                  </div>
                  <a href="https://www.linkedin.com/in/priyankar-padhy-06aa3137a" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', color: '#B9FF66' }}>
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zM20.45 20.45h-3.56v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.15 1.46-2.15 2.96v5.7h-3.56V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z"/></svg>
                  </a>
              </div>
            </div>
        </div>

        <div className="resources-box">
           <p style={{ fontWeight: 900, fontSize: '18px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Access</p>
           <a href="https://igit.icrp.in" target="_blank" rel="noopener noreferrer" className="resource-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              ERP
           </a>
           <a href="https://igitsarang.ac.in/students/coursestructure" target="_blank" rel="noopener noreferrer" className="resource-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              Syllabus
           </a>
           <a href="https://igitsarang.ac.in" target="_blank" rel="noopener noreferrer" className="resource-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5"/></svg>
              Institute Website
           </a>
        </div>
      </div>

      <div className="bottom-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', opacity: 0.6, marginTop: '20px' }}>
        <p>© {new Date().getFullYear()} Dept. of Civil Engineering, IGIT Sarang.</p>
        <p>Managed by CodexCrew</p>
      </div>
    </footer>
  )
}
