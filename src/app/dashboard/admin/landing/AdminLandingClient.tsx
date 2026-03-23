'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  setDoc,
  getDoc
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { NewsEvent, GalleryPhoto } from '@/types'

export function AdminLandingClient() {
  const [activeTab, setActiveTab] = useState<'hero' | 'events' | 'gallery' | 'migration'>('hero')
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<any>(null)

  // Hero & Global State
  const [heroSettings, setHeroSettings] = useState({
    title: 'Civil Engineering Department, IGIT Sarang',
    subtitle: 'A unified platform for students, faculty, and alumni to collaborate, learn, and grow together.',
    hod_quote: 'Our department is dedicated to fostering an environment of technical excellence and creative innovation.',
    hod_name: 'Dr. John Smith',
    hod_photo_url: 'https://ui-avatars.com/api/?name=HOD&size=200',
    show_faculties: true,
    show_gallery: true,
  })

  // Events & Gallery State
  const [events, setEvents] = useState<NewsEvent[]>([])
  const [gallery, setGallery] = useState<GalleryPhoto[]>([])

  const triggerMigration = async () => {
    if (!confirm('This will sync ALL Firestore data to MongoDB Atlas. Existing data in MongoDB will be updated. Continue?')) return
    setMigrating(true)
    try {
      const res = await fetch('/api/admin/migrate-firestore-to-mongo', { method: 'POST' })
      const data = await res.json()
      setMigrationResult(data)
      toast.success('Migration successful!')
    } catch (err) {
      toast.error('Migration failed. check console.')
      console.error(err)
    } finally {
      setMigrating(false)
    }
  }

  useEffect(() => {
    async function fetchData() {
      // 1. Check cache for instant load
      const cached = sessionStorage.getItem('cache_admin_landing_data')
      if (cached) {
        const decoded = JSON.parse(cached)
        setHeroSettings(decoded.heroSettings || heroSettings)
        setEvents(decoded.events || [])
        setGallery(decoded.gallery || [])
        setLoading(false)
      }

      try {
        // Fetch Settings
        const settingsRef = doc(db, 'settings', 'landing')
        const settingsSnap = await getDoc(settingsRef)
        let freshSettings = heroSettings
        if (settingsSnap.exists()) {
          freshSettings = { ...heroSettings, ...settingsSnap.data() }
          setHeroSettings(freshSettings)
        }

        // Fetch Events
        const eventSnap = await getDocs(collection(db, 'news_events'))
        const freshEvents = eventSnap.docs.map(d => ({ id: d.id, ...d.data() } as NewsEvent))
        freshEvents.sort((a,b) => (b.created_at||'').localeCompare(a.created_at||''))
        setEvents(freshEvents)

        // Fetch Gallery
        const gallerySnap = await getDocs(collection(db, 'gallery'))
        const freshGallery = gallerySnap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryPhoto))
        freshGallery.sort((a,b) => b.created_at.localeCompare(a.created_at))
        setGallery(freshGallery)

        // 2. Update cache
        sessionStorage.setItem('cache_admin_landing_data', JSON.stringify({
          heroSettings: freshSettings,
          events: freshEvents,
          gallery: freshGallery,
          updatedAt: new Date().toISOString()
        }))
      } catch (err) {
        console.error('Error fetching landing data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const saveHeroSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'landing'), heroSettings)
      toast.success('Hero settings updated')
    } catch (err) {
      toast.error('Failed to update')
    }
  }

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newEvent = {
        title: formData.get('title') as string,
        body: formData.get('body') as string,
        event_date: formData.get('date') as string,
        type: 'event',
        is_published: true,
        created_at: new Date().toISOString(),
        dept_id: null,
        created_by: null,
        image_url: null
    }
    try {
      const docRef = await addDoc(collection(db, 'news_events'), newEvent)
      setEvents(prev => [{ id: docRef.id, ...newEvent } as NewsEvent, ...prev])
      toast.success('Event added')
      e.currentTarget.reset()
    } catch (err) {
      toast.error('Failed to add event')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if(!confirm('Delete this event?')) return
    try {
      await deleteDoc(doc(db, 'news_events', id))
      setEvents(prev => prev.filter(e => e.id !== id))
      toast.success('Deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const handleAddGallery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newItem = {
        title: formData.get('title') as string,
        image_url: formData.get('url') as string,
        album: 'Landing',
        created_at: new Date().toISOString(),
        dept_id: null,
        uploaded_by: null
    }
    try {
      const docRef = await addDoc(collection(db, 'gallery'), newItem)
      setGallery(prev => [{ id: docRef.id, ...newItem } as GalleryPhoto, ...prev])
      toast.success('Image added to gallery')
      e.currentTarget.reset()
    } catch (err) {
      toast.error('Failed to add image')
    }
  }

  const handleDeleteGallery = async (id: string) => {
    if(!confirm('Delete this photo?')) return
    try {
      await deleteDoc(doc(db, 'gallery', id))
      setGallery(prev => prev.filter(p => p.id !== id))
      toast.success('Deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Landing Manager...</div>

  return (
    <>
      <Topbar title="Landing Page Management" accentColor="#1A1A18" />
      <div className="content-container">
        <div className="tab-list">
          <div className={`tab-item ${activeTab === 'hero' ? 'active' : ''}`} onClick={() => setActiveTab('hero')}>Hero & HOD</div>
          <div className={`tab-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Events</div>
          <div className={`tab-item ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>Gallery</div>
          <div className={`tab-item ${activeTab === 'migration' ? 'active' : ''}`} onClick={() => setActiveTab('migration')}>DB Migration</div>
        </div>

        {activeTab === 'migration' && (
          <div className="card" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="section-heading" style={{ color: '#534AB7' }}>Firestore to MongoDB Sync</h3>
                <p className="secondary-text" style={{ fontSize: '13px', marginTop: '4px' }}>
                  Migrate all collections to MongoDB Atlas (Mumbai) for high-speed regional access.
                </p>
              </div>
              <button 
                className="btn btn-filled" 
                onClick={triggerMigration} 
                disabled={migrating}
                style={{ background: '#534AB7', borderColor: '#534AB7', minWidth: '160px' }}
              >
                {migrating ? 'Migrating...' : 'Start Full Sync'}
              </button>
            </div>

            {migrationResult && (
              <div style={{ background: 'var(--surface-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Migration Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {Object.entries(migrationResult.counts || {}).map(([key, val]) => (
                    <div key={key} style={{ padding: '10px', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{key.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F6E56' }}>{val as number}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', fontSize: '12px', color: '#0F6E56', fontWeight: 500 }}>
                  ✅ Sync completed successfully at {new Date().toLocaleTimeString()}
                </div>
              </div>
            )}

            {!migrationResult && !migrating && (
              <div style={{ padding: '40px', textAlign: 'center', background: 'var(--surface-secondary)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚀</div>
                <p className="secondary-text">Click the button above to start the data migration to MongoDB Atlas.</p>
              </div>
            )}
            
            {migrating && (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="loader" style={{ margin: '0 auto 20px auto' }}></div>
                <p style={{ fontWeight: 500 }}>Transferring data records from Firebase (USA) to MongoDB Atlas (Mumbai)...</p>
                <p className="secondary-text" style={{ fontSize: '12px', marginTop: '8px' }}>Please do not close this tab during migration.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'hero' && (
          <div className="card" style={{ maxWidth: '600px' }}>
            <h3 className="section-heading" style={{ marginBottom: '20px' }}>Main Section Settings</h3>
            <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Hero Title</label>
                <input className="form-input" value={heroSettings.title} onChange={e => setHeroSettings({...heroSettings, title: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Hero Subtitle</label>
                <textarea className="form-input" rows={3} value={heroSettings.subtitle} onChange={e => setHeroSettings({...heroSettings, subtitle: e.target.value})} />
            </div>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <input type="checkbox" checked={heroSettings.show_faculties} onChange={e => setHeroSettings({...heroSettings, show_faculties: e.target.checked})} />
                    Show Faculty Section
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <input type="checkbox" checked={heroSettings.show_gallery} onChange={e => setHeroSettings({...heroSettings, show_gallery: e.target.checked})} />
                    Show Gallery Section
                </label>
            </div>

            <button className="btn btn-filled" onClick={saveHeroSettings} style={{ background: '#1A1A18', color: 'white' }}>Save All Changes</button>
          </div>
        )}

        {activeTab === 'events' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <div className="card">
                <h3 className="section-heading" style={{ marginBottom: '20px' }}>Add New Event</h3>
                <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                        <label className="form-label">Event Title</label>
                        <input name="title" className="form-input" required placeholder="e.g. Annual Symposium" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <input name="date" type="date" className="form-input" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea name="body" className="form-input" rows={4} required placeholder="Details about the event..." />
                    </div>
                    <button type="submit" className="btn btn-filled" style={{ background: '#1A1A18' }}>Add Event</button>
                </form>
            </div>
            <div className="card">
                <h3 className="section-heading" style={{ marginBottom: '20px' }}>Upcoming Events</h3>
                <div className="data-table-container" style={{ margin: 0, padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(e => (
                                <tr key={e.id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{e.title}</div>
                                        <div className="secondary-text" style={{ fontSize: '11px' }}>{e.body?.substring(0, 50)}...</div>
                                    </td>
                                    <td className="secondary-text">{new Date(e.event_date || '').toLocaleDateString()}</td>
                                    <td>
                                        <button onClick={() => handleDeleteEvent(e.id)} className="btn btn-sm btn-ghost" style={{ color: 'var(--status-error)' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <div className="card">
                <h3 className="section-heading" style={{ marginBottom: '20px' }}>Upload Photo</h3>
                <form onSubmit={handleAddGallery} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                        <label className="form-label">Photo Caption</label>
                        <input name="title" className="form-input" required placeholder="e.g. Students in Lab" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Image URL</label>
                        <input name="url" className="form-input" required placeholder="https://..." />
                        <p className="secondary-text" style={{ fontSize: '10px' }}>You can use images from Unsplash or upload elsewhere and paste URL.</p>
                    </div>
                    <button type="submit" className="btn btn-filled" style={{ background: '#1A1A18' }}>Add Photo</button>
                </form>
            </div>
            <div className="card">
                <h3 className="section-heading" style={{ marginBottom: '20px' }}>Current Photos</h3>
                <div className="gallery-grid-admin" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                    {gallery.map(p => (
                        <div key={p.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <img src={p.image_url} alt={p.title || ''} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                            <button 
                                onClick={() => handleDeleteGallery(p.id)}
                                style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px' }}
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
