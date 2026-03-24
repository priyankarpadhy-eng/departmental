'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileText, Download, HardDrive, Loader2, Cloud, X, Eye, Image as ImageIcon } from 'lucide-react'
import { createPortal } from 'react-dom'

interface SharedFile {
  id: string
  name: string
  title?: string
  description?: string
  size: number
  fileKey: string
  uploaderName: string
  createdAt: any
}

// Red-based accent tokens
const RED_ACCENT = '#E24B4A'
const RED_ACCENT_SOFT = 'rgba(226, 75, 74, 0.1)'
const RED_ACCENT_BORDER = 'rgba(226, 75, 74, 0.35)'

export default function LandingStorageSearch({ isDark, T }: { isDark: boolean; T: any }) {
  const [files, setFiles] = useState<SharedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SharedFile[]>([])
  const [selectedPreview, setSelectedPreview] = useState<SharedFile | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    async function fetchFiles() {
      try {
        const q = query(collection(db, 'shared_drive'), orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SharedFile))
        setFiles(data)
      } catch (error) {
        console.error('Error fetching files for landing:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFiles()
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
    } else {
      const lower = searchQuery.toLowerCase()
      const filtered = files.filter(f => 
        (f.title || f.name).toLowerCase().includes(lower) || 
        f.description?.toLowerCase().includes(lower) ||
        f.uploaderName.toLowerCase().includes(lower)
      ).slice(0, 6)
      setResults(filtered)
    }
  }, [searchQuery, files])

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <>
      <section id="central-tank" style={{ padding: isMobile ? '0 5% 80px' : '0 8% 120px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '10px', 
              background: isDark ? 'rgba(226, 75, 74, 0.12)' : 'rgba(226, 75, 74, 0.08)', 
              border: `1px solid ${RED_ACCENT_BORDER}`, 
              color: RED_ACCENT, padding: '6px 20px', borderRadius: '99px', fontSize: isMobile ? '12px' : '14px', 
              fontWeight: 800, marginBottom: '24px' 
            }}>
              <HardDrive size={18} /> Central Storage
            </div>
            <h2 style={{ fontSize: isMobile ? '28px' : 'clamp(32px, 4vw, 44px)', fontWeight: 900, marginBottom: '16px', color: T.text, transition: 'color 0.4s' }}>
              Instant Resource Access
            </h2>
            <p style={{ color: T.muted, fontSize: isMobile ? '14px' : '17px', marginBottom: isMobile ? '32px' : '48px', maxWidth: '600px', margin: '0 auto 48px', transition: 'color 0.4s' }}>
              Browse and download course materials, department archives, and research papers shared by the community.
            </p>
          </motion.div>

          {/* Search Bar Wrapper with Dynamic Border */}
          <motion.div 
            layout
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            style={{ 
              position: 'relative', 
              maxWidth: '700px', 
              margin: '0 auto',
              padding: isMobile ? '6px' : '8px',
              borderRadius: '32px',
              background: searchQuery ? (isDark ? 'rgba(226, 75, 74, 0.15)' : 'rgba(226, 75, 74, 0.1)') : 'transparent',
              border: `1.5px solid ${searchQuery ? RED_ACCENT : 'transparent'}`,
              boxShadow: searchQuery ? (isDark ? `0 0 50px ${RED_ACCENT}22` : `0 15px 40px ${RED_ACCENT}15`) : 'none',
              transition: 'background 0.4s, border 0.4s, box-shadow 0.4s'
            }}
          >
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', 
              background: isDark ? 'rgba(15,15,22,0.9)' : '#FFFFFF', 
              border: `1.5px solid ${searchQuery ? RED_ACCENT : T.border}`, 
              borderRadius: '24px', padding: isMobile ? '12px 20px' : '16px 28px', 
              backdropFilter: 'blur(20px)',
              transition: 'all 0.3s ease',
              boxShadow: searchQuery ? 'inset 0 0 15px rgba(226, 75, 74, 0.05)' : 'none'
            }}>
              <Search size={isMobile ? 18 : 22} style={{ color: searchQuery ? RED_ACCENT : T.muted }} />
              <input 
                type="text" 
                placeholder={isMobile ? "Search materials..." : "Search resource name, topic or keywords..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: isMobile ? '15px' : '18px', fontWeight: 600, color: T.text, transition: 'color 0.4s' }}
              />
              {loading && <Loader2 size={20} className="spin" style={{ color: T.muted, animation: 'spin 1.5s linear infinite' }} />}
            </div>

            {/* Results Overlay */}
            <AnimatePresence>
              {searchQuery && (
                <motion.div
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ 
                    zIndex: 10,
                    marginTop: '12px',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ 
                    background: isDark ? 'rgba(15,15,22,0.85)' : '#FFFFFF', 
                    border: `1.5px solid ${T.border}`, borderRadius: '24px', 
                    padding: '8px', backdropFilter: 'blur(24px)'
                  }}>
                    {results.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {results.map(file => (
                          <motion.div 
                            layout
                            key={file.id} 
                            whileHover={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(226, 75, 74, 0.03)' }}
                            style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px', padding: isMobile ? '10px 12px' : '14px 20px', borderRadius: '16px', cursor: 'default', textAlign: 'left' }}
                          >
                            <div style={{ 
                              width: isMobile ? '36px' : '44px', height: isMobile ? '36px' : '44px', borderRadius: '10px', 
                              background: RED_ACCENT_SOFT, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              <FileText size={isMobile ? 18 : 20} style={{ color: RED_ACCENT }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setSelectedPreview(file)}>
                              <div style={{ fontWeight: 800, color: T.text, fontSize: isMobile ? '14px' : '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.title || file.name}</div>
                              <div style={{ fontSize: '11px', color: T.muted }}>{formatBytes(file.size)} • {file.uploaderName}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <motion.button 
                                onClick={() => setSelectedPreview(file)}
                                whileHover={{ scale: 1.1, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} 
                                whileTap={{ scale: 0.9 }} 
                                style={{ 
                                  width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text,
                                  transition: 'all 0.2s ease'
                                }}
                                title="Preview"
                              >
                                <Eye size={16} />
                              </motion.button>
                              <a href={`/api/storage/b2/download?key=${encodeURIComponent(file.fileKey)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                <motion.div 
                                  whileHover={{ scale: 1.1, background: RED_ACCENT, color: '#fff' }} 
                                  whileTap={{ scale: 0.9 }} 
                                  style={{ 
                                    width: '36px', height: '36px', borderRadius: '50%', 
                                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text,
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  <Download size={16} />
                                </motion.div>
                              </a>
                            </div>
                          </motion.div>
                        ))}
                        <div style={{ padding: '12px', textAlign: 'center', borderTop: `1px solid ${T.border}`, marginTop: '4px' }}>
                          <p style={{ fontSize: '11px', color: T.muted }}>Top matching resources shown.</p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                        <Cloud size={32} style={{ color: T.muted, marginBottom: '8px', opacity: 0.5 }} />
                        <p style={{ fontWeight: 700, color: T.text, fontSize: '14px' }}>No matches found.</p>
                        <p style={{ fontSize: '12px', color: T.muted }}>Try generic terms.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}} />
      </section>

      {/* Modern Black/Blur File Previewer Modal - Portal for z-index safety */}
      {mounted && createPortal(
        <AnimatePresence>
          {selectedPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPreview(null)}
              style={{
                position: 'fixed', inset: 0, zIndex: 999999,
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(24px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0' : '20px'
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%', maxWidth: '1100px', height: isMobile ? '100vh' : '90vh',
                  background: isDark ? '#0A0A0F' : '#FFFFFF',
                  borderRadius: isMobile ? '0' : '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  border: isMobile ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  boxShadow: '0 40px 100px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ 
                  padding: isMobile ? '16px 20px' : '20px 30px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', minWidth: 0 }}>
                    <div style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: '10px', background: RED_ACCENT_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={isMobile ? 20 : 24} style={{ color: RED_ACCENT }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 800, color: T.text, margin: 0, padding: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedPreview.title || selectedPreview.name}</h3>
                      <p style={{ fontSize: '12px', color: T.muted, margin: 0, marginTop: '2px' }}>{formatBytes(selectedPreview.size)}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={`/api/storage/b2/download?key=${encodeURIComponent(selectedPreview.fileKey)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        style={{ 
                          background: RED_ACCENT, color: '#fff', border: 'none', 
                          padding: isMobile ? '10px 14px' : '10px 24px', borderRadius: '12px', fontWeight: 700, 
                          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: isMobile ? '12px' : '14px'
                        }}>
                        <Download size={16} /> {!isMobile && 'Download'}
                      </motion.button>
                    </a>
                    <motion.button onClick={() => setSelectedPreview(null)}
                      whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.95 }}
                      style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', border: `1px solid ${T.border}`, 
                        background: 'transparent', color: T.text, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                      <X size={20} />
                    </motion.button>
                  </div>
                </div>
                
                <div style={{ flex: 1, position: 'relative', background: '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {(() => {
                      const ext = selectedPreview.name.split('.').pop()?.toLowerCase();
                      const url = `/api/storage/b2/download?key=${encodeURIComponent(selectedPreview.fileKey)}`;
                      
                      if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) {
                        return <img src={url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      }
                      
                      if (ext === 'pdf') {
                         return <iframe src={url} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Previewer" />
                      }

                      return (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                           <FileText size={isMobile ? 48 : 64} style={{ color: 'rgba(0,0,0,0.2)', marginBottom: '16px' }} />
                           <h4 style={{ color: '#333', fontSize: isMobile ? '18px' : '20px', fontWeight: 600 }}>No Preview</h4>
                           <p style={{ color: '#666', marginTop: '8px', maxWidth: '300px', margin: '8px auto', fontSize: '13px' }}>
                             This file type ({ext?.toUpperCase()}) cannot be previewed. Please download to view.
                           </p>
                        </div>
                      )
                    })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
