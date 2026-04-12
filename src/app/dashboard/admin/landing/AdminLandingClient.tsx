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
  const [uploading, setUploading] = useState(false)
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
    logos: [] as string[],
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const toastId = toast.loading('Uploading logo...')

    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      const res = await fetch('/api/storage/b2/upload', { method: 'POST', body: uploadData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      const logoUrl = `/api/storage/b2/download?key=${encodeURIComponent(data.fileKey)}`
      setHeroSettings(prev => ({
        ...prev,
        logos: [...(prev.logos || []), logoUrl]
      }))
      toast.success('Logo uploaded!', { id: toastId })
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const removeLogo = (index: number) => {
    setHeroSettings(prev => ({
      ...prev,
      logos: prev.logos.filter((_, i) => i !== index)
    }))
  }

  const handleHodPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const toastId = toast.loading('Uploading HOD photo...')

    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      const res = await fetch('/api/storage/b2/upload', { method: 'POST', body: uploadData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      const photoUrl = `/api/storage/b2/download?key=${encodeURIComponent(data.fileKey)}`
      setHeroSettings(prev => ({
        ...prev,
        hod_photo_url: photoUrl
      }))
      toast.success('HOD photo updated!', { id: toastId })
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File

    setUploading(true)
    const toastId = toast.loading('Publishing event...')

    try {
      let fileUrl = null;
      if (file && file.size > 0) {
        toast.loading('Uploading attachment to B2 S3...', { id: toastId })
        const uploadData = new FormData()
        uploadData.append('file', file)
        const res = await fetch('/api/storage/b2/upload', { method: 'POST', body: uploadData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to upload attachment')
        fileUrl = `/api/storage/b2/download?key=${encodeURIComponent(data.fileKey)}`
      }

      const newEvent = {
          title: formData.get('title') as string,
          body: formData.get('body') as string,
          event_date: formData.get('date') as string,
          type: 'event',
          is_published: true,
          created_at: new Date().toISOString(),
          image_url: fileUrl, // Attach document/image
          dept_id: null,
          created_by: null,
      }
      
      const docRef = await addDoc(collection(db, 'news_events'), newEvent)
      setEvents(prev => [{ id: docRef.id, ...newEvent } as NewsEvent, ...prev])
      toast.success('Event published!', { id: toastId })
      e.currentTarget.reset()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add event', { id: toastId })
    } finally {
      setUploading(false)
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
    const file = formData.get('photo') as File

    if (!file || file.size === 0) {
      toast.error('Please select an image file to upload')
      return
    }

    setUploading(true)
    const toastId = toast.loading('Uploading image securely to B2...')
    
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      const res = await fetch('/api/storage/b2/upload', { method: 'POST', body: uploadData })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Failed to upload photo')
      
      const imageUrl = `/api/storage/b2/download?key=${encodeURIComponent(data.fileKey)}`
      
      const newItem = {
          title: formData.get('title') as string,
          description: formData.get('description') as string || null,
          image_url: imageUrl,
          album: 'Landing',
          created_at: new Date().toISOString(),
          dept_id: null,
          uploaded_by: null
      }
      
      const docRef = await addDoc(collection(db, 'gallery'), newItem)
      setGallery(prev => [{ id: docRef.id, ...newItem } as GalleryPhoto, ...prev])
      toast.success('Image added to gallery!', { id: toastId })
      e.currentTarget.reset()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add image', { id: toastId })
    } finally {
      setUploading(false)
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="card">
              <h3 className="section-heading" style={{ marginBottom: '20px' }}>Header Logos</h3>
              <p className="secondary-text" style={{ fontSize: '11px', marginBottom: '16px' }}>Manage multiple department/institution logos shown in the header.</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                {(heroSettings.logos || []).map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src={url} alt="Logo" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                    <button onClick={() => removeLogo(idx)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'white', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', padding: '2px', fontSize: '8px' }}>❌</button>
                  </div>
                ))}
                
                <label style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1.5px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '20px', color: 'var(--text-tertiary)' }}>
                  +
                  <input type="file" accept="image/*" hidden onChange={handleLogoUpload} disabled={uploading} />
                </label>
              </div>

              <h3 className="section-heading" style={{ marginBottom: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>Main Section Settings</h3>
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

          <div className="card">
              <h3 className="section-heading" style={{ marginBottom: '20px' }}>HOD Profile Settings</h3>
              <p className="secondary-text" style={{ fontSize: '11px', marginBottom: '20px' }}>Update the Head of Department information shown in the message section.</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border-color)', background: '#eee' }}>
                  <img src={heroSettings.hod_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(heroSettings.hod_name || 'H')}&background=6366F1&color=FFFFFF&size=200`} alt="HOD" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', border: '1px solid #ddd' }}>
                    Change HOD Photo
                    <input type="file" accept="image/*" hidden onChange={handleHodPhotoUpload} disabled={uploading} />
                  </label>
                  <p className="secondary-text" style={{ fontSize: '10px', marginTop: '6px' }}>Recommended: Square image, 400x400px.</p>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">HOD Name</label>
                  <input className="form-input" value={heroSettings.hod_name} onChange={e => setHeroSettings({...heroSettings, hod_name: e.target.value})} />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">HOD Quote / Message</label>
                  <textarea className="form-input" rows={5} value={heroSettings.hod_quote} onChange={e => setHeroSettings({...heroSettings, hod_quote: e.target.value})} />
              </div>

              <button className="btn btn-filled" onClick={saveHeroSettings} style={{ background: '#1A1A18', color: 'white' }}>Update HOD Info</button>
          </div>
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
                    <div className="form-group">
                        <label className="form-label">Attach File/Notice (Optional)</label>
                        <input name="file" type="file" className="form-input" style={{ padding: '8px' }} />
                        <p className="secondary-text" style={{ fontSize: '10px' }}>Upload a PDF document or image for this notice.</p>
                    </div>
                    <button type="submit" disabled={uploading} className="btn btn-filled" style={{ background: '#1A1A18', opacity: uploading ? 0.7 : 1 }}>
                      {uploading ? 'Processing...' : 'Publish Event'}
                    </button>
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
                        <label className="form-label">Location / Subtitle</label>
                        <input name="description" className="form-input" placeholder="e.g. Civil Engineering, IGIT SARANG" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Upload File</label>
                        <input name="photo" type="file" accept="image/*" required className="form-input" style={{ padding: '8px' }} />
                        <p className="secondary-text" style={{ fontSize: '10px' }}>Image will be encrypted and stored in Backblaze B2.</p>
                    </div>
                    <button type="submit" disabled={uploading} className="btn btn-filled" style={{ background: '#1A1A18', opacity: uploading ? 0.7 : 1 }}>
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                </form>
            </div>
            <div className="card">
                <h3 className="section-heading" style={{ marginBottom: '20px' }}>Current Photos</h3>
                <div className="gallery-grid-admin" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                    {gallery.map(p => (
                        <div key={p.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px' }}>
                            <img src={p.image_url} alt={p.title || ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
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
