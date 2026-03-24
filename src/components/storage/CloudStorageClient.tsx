'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { logAction } from '@/lib/logAction'
import toast from 'react-hot-toast'
import { HardDrive, Plus, Loader2, Download, Trash2, FileText, Search, Cloud, X, Info } from 'lucide-react'

interface SharedFile {
  id: string
  name: string
  title?: string
  description?: string
  size: number
  fileKey: string // The secure B2 key
  uploadedBy: string
  uploaderName: string
  createdAt: any
}

const STORAGE_LIMIT_GB = 10
const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_GB * 1024 * 1024 * 1024

export default function CloudStorageClient() {
  const { profile } = useAuth()
  const [files, setFiles] = useState<SharedFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<SharedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: ''
  })

  useEffect(() => {
    if (profile?.id) {
      fetchFiles()
    }
  }, [profile])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFiles(files)
    } else {
      const lower = searchQuery.toLowerCase()
      setFilteredFiles(files.filter(f => 
        f.name.toLowerCase().includes(lower) || 
        f.title?.toLowerCase().includes(lower) ||
        f.description?.toLowerCase().includes(lower) ||
        f.uploaderName.toLowerCase().includes(lower)
      ))
    }
  }, [searchQuery, files])

  async function fetchFiles() {
    try {
      setLoading(true)
      const q = query(collection(db, 'shared_drive'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SharedFile))
      setFiles(data)
    } catch (error) {
      console.error('Error fetching files:', error)
      toast.error('Failed to load shared files.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadForm({
        title: file.name.split('.').slice(0, -1).join('.'), // Default title to filename without extension
        description: ''
      })
      setShowUploadModal(true)
    }
  }

  async function handleFinalUpload() {
    if (!selectedFile || !profile?.id) return

    setUploading(true)
    const toastId = toast.loading('Uploading to Central Storage (B2)...')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('folder', 'Department_Shared_Tank')

      const response = await fetch('/api/storage/b2/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      // Save metadata to Firestore
      const newDoc = {
        name: selectedFile.name,
        title: uploadForm.title || selectedFile.name,
        description: uploadForm.description,
        size: selectedFile.size,
        fileKey: data.fileKey, // Store the private B2 key
        uploadedBy: profile.id,
        uploaderName: profile.full_name || 'Anonymous',
        createdAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'shared_drive'), newDoc)
      
      await logAction({
        action: 'CREATE' as any,
        module: 'Central Storage',
        description: `Uploaded file: ${uploadForm.title} (${selectedFile.name}) to central storage`,
        targetTable: 'shared_drive',
        targetId: docRef.id
      })
      
      toast.success('File added to Central Storage!', { id: toastId })
      
      // Optimitistically update UI
      setFiles(prev => [{ id: docRef.id, ...newDoc, createdAt: { toDate: () => new Date() } }, ...prev])
      setShowUploadModal(false)
      setSelectedFile(null)
    } catch (error: any) {
      toast.error(error.message || 'Upload failed', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string, fileName: string) {
    if (!confirm('Are you sure you want to remove this file?')) return
    try {
      await deleteDoc(doc(db, 'shared_drive', id))
      toast.success('File removed')
      setFiles(files.filter(f => f.id !== id))
      
      await logAction({
        action: 'DELETE' as any,
        module: 'Central Storage',
        description: `Deleted file: ${fileName} from central storage`,
        targetTable: 'shared_drive',
        targetId: id
      })
    } catch (error) {
      toast.error('Failed to delete file')
    }
  }

  const totalUsedBytes = files.reduce((acc, f) => acc + f.size, 0)
  const percentUsed = Math.min((totalUsedBytes / STORAGE_LIMIT_BYTES) * 100, 100)

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const canDelete = (file: SharedFile) => {
    return profile?.role === 'admin' || profile?.role === 'hod' || profile?.role === 'faculty' || file.uploadedBy === profile?.id
  }

  return (
    <>
      <div className="content-container">
        
        {/* Header Section */}
        <div className="section-row" style={{ marginBottom: '24px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <HardDrive size={28} style={{ color: 'var(--role-accent)' }} /> 
              Central Storage
            </h1>
            <p className="body-text" style={{ color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '16px' }}>
              Collaborative cloud storage for the department. Access materials anytime, anywhere.
            </p>
            
            {/* Storage Progress Bar */}
            <div style={{ maxWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="secondary-text" style={{ fontWeight: 500 }}>Global Storage Status</span>
                <span className="secondary-text">{formatBytes(totalUsedBytes)} / {STORAGE_LIMIT_GB}GB</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${percentUsed}%`, background: percentUsed > 90 ? 'var(--status-error)' : 'var(--role-accent)' }}></div>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
             <label className="btn btn-filled" style={{ cursor: 'pointer', padding: '10px 24px', height: '44px' }}>
              <Plus size={20} />
              Upload File
              <input type="file" hidden onChange={handleFileSelect} />
            </label>
            <div className="secondary-text" style={{ fontWeight: 500 }}>
              {files.length} documents shared
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="card" style={{ padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface-secondary)' }}>
          <div className="search-input" style={{ flex: 1, maxWidth: '400px', background: 'var(--surface-primary)' }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input 
              type="text" 
              placeholder="Search by title, desc or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Files Grid */}
        {loading ? (
           <div className="empty-state">
              <Loader2 size={32} className="spin" style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
              <p className="body-text">Loading...</p>
           </div>
        ) : filteredFiles.length === 0 ? (
          <div className="empty-state card" style={{ padding: '80px 20px', background: 'var(--surface-primary)' }}>
             <Cloud size={64} style={{ color: 'var(--text-tertiary)', marginBottom: '20px', opacity: 0.3 }} />
             <h3 className="section-heading" style={{ fontSize: '18px' }}>{searchQuery ? "No matching files" : "Storage is empty"}</h3>
             <p className="secondary-text" style={{ maxWidth: '320px', margin: '0 auto' }}>
               {searchQuery ? "Adjust your search to find what you're looking for." : "Start by uploading department resources, notes, or media."}
             </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredFiles.map(file => (
              <div key={file.id} className="card" style={{ display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                   <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                     <FileText size={26} style={{ color: 'var(--role-accent)' }} />
                   </div>
                   <div style={{ flex: 1, minWidth: 0 }}>
                     <h4 className="section-heading" style={{ marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.title || file.name}>
                       {file.title || file.name}
                     </h4>
                     <p className="secondary-text" style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                       {file.name}
                     </p>
                     <p className="body-text" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '38px' }}>
                       {file.description || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No description provided.</span>}
                     </p>
                   </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="avatar avatar-sm" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                      {file.uploaderName[0] || 'U'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="secondary-text" style={{ fontWeight: 600, lineHeight: 1 }}>{file.uploaderName.split(' ')[0]}</span>
                      <span className="secondary-text" style={{ fontSize: '10px' }}>{file.createdAt?.toDate ? new Date(file.createdAt.toDate()).toLocaleDateString() : 'New'}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{formatBytes(file.size)}</span>
                    <a href={`/api/storage/b2/download?key=${encodeURIComponent(file.fileKey)}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outlined" style={{ padding: '6px' }} title="Download File">
                      <Download size={14} /> 
                    </a>
                    {canDelete(file) && (
                      <button onClick={() => handleDelete(file.id, file.title || file.name)} className="btn btn-sm btn-ghost" style={{ color: 'var(--status-error)', padding: '6px' }} title="Remove File">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="card modal-content border-role-accent" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', padding: 0 }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h2 className="section-heading" style={{ fontSize: '18px' }}>Upload to Central Storage</h2>
               <button onClick={() => setShowUploadModal(false)} disabled={uploading} className="btn btn-ghost" style={{ padding: '4px' }}><X size={20}/></button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--surface-secondary)', borderRadius: '10px' }}>
                  <FileText size={24} style={{ color: 'var(--role-accent)' }} />
                  <div style={{ minWidth: 0 }}>
                    <p className="body-text" style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedFile?.name}</p>
                    <p className="secondary-text">{formatBytes(selectedFile?.size || 0)}</p>
                  </div>
               </div>

               <div className="form-group">
                  <label className="form-label">Display Title</label>
                  <input 
                    className="form-input" 
                    placeholder="Enter a descriptive title..."
                    value={uploadForm.title}
                    onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                    disabled={uploading}
                  />
               </div>

               <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea 
                    className="form-input" 
                    rows={3}
                    placeholder="Provide details about this file..."
                    style={{ resize: 'none' }}
                    value={uploadForm.description}
                    onChange={e => setUploadForm({...uploadForm, description: e.target.value})}
                    disabled={uploading}
                  />
               </div>

               <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'var(--status-info-bg)', borderRadius: '8px', color: 'var(--status-info)' }}>
                  <Info size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p className="secondary-text" style={{ color: 'inherit' }}>
                    This file will be visible to all students, faculty, and administrative staff immediately.
                  </p>
               </div>
            </div>

            <div style={{ padding: '20px', background: 'var(--surface-secondary)', display: 'flex', gap: '12px' }}>
               <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowUploadModal(false)} disabled={uploading}>Cancel</button>
               <button className="btn btn-filled" style={{ flex: 2 }} onClick={handleFinalUpload} disabled={uploading}>
                  {uploading ? (
                    <><Loader2 size={18} className="spin" style={{ animation: 'spin 1.1s linear infinite' }} /> Uploading...</>
                  ) : 'Finish Upload'}
               </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .border-role-accent { border-top: 4px solid var(--role-accent) !important; }
      `}} />
    </>
  )
}
