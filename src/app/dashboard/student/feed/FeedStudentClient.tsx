'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  increment,
  limit
} from 'firebase/firestore'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export function FeedStudentClient() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState('')
  const [mood, setMood] = useState('😊')

  const moods = ['😊', '😴', '📝', '🔥', '☕', '🧠']

  // 1. Initial High-Speed MongoDB Fetch
  useEffect(() => {
    async function loadInitialFeed() {
      try {
        const response = await fetch('/api/student/feed?limit=50');
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error('MongoDB Feed Fetch Error:', err);
      }
    }
    loadInitialFeed();
  }, []);

  // 2. Real-time Listeners (Hybrid approach)
  useEffect(() => {
    const q = query(collection(db, 'student_posts'), orderBy('created_at', 'desc'), limit(50))
    const unsubscribe = onSnapshot(q, (snap) => {
      const livePosts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setPosts(prev => {
        // Merge & De-duplicate by ID
        const combined = [...livePosts, ...prev]
        const unique = Array.from(new Map(combined.map(p => [p.id, p])).values())
        return unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      })
    })
    return () => unsubscribe()
  }, [])

  async function handlePost() {
    if (!newPost.trim() || !user) return
    try {
      await addDoc(collection(db, 'student_posts'), {
        author_id: user.uid,
        author_name: profile?.full_name,
        author_photo: profile?.photo_url,
        content: newPost,
        mood: mood,
        likes: 0,
        created_at: new Date().toISOString()
      })
      setNewPost('')
      toast.success('Thought shared!')
    } catch (err) {
      toast.error('Failed to post')
    }
  }

  async function handleLike(postId: string) {
    try {
      await updateDoc(doc(db, 'student_posts', postId), {
        likes: increment(1)
      })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <Topbar title="Student Social Feed" accentColor="#FF6B6B" />
      <div className="content-container" style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        {/* Mood Selector & New Post */}
        <div className="card" style={{ marginBottom: '24px', border: '1px solid #FF6B6B' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {moods.map(m => (
              <button 
                key={m} 
                className={`btn btn-sm ${mood === m ? 'btn-filled' : 'btn-ghost'}`}
                style={{ fontSize: '20px', padding: '10px', width: '45px', height: '45px' }}
                onClick={() => setMood(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <textarea 
            className="form-input" 
            placeholder="What's on your mind?" 
            rows={3}
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            style={{ border: 'none', background: 'var(--surface-secondary)', borderRadius: '12px', resize: 'none' }}
          ></textarea>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button className="btn btn-filled" style={{ background: '#FF6B6B', borderColor: '#FF6B6B' }} onClick={handlePost}>
              Share Thought
            </button>
          </div>
        </div>

        {/* Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {posts.map(post => (
            <div key={post.id} className="card" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '24px' }}>
                {post.mood}
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eee', overflow: 'hidden' }}>
                    <img src={post.author_photo || `https://ui-avatars.com/api/?name=${post.author_name}`} alt={post.author_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{post.author_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{new Date(post.created_at).toLocaleString()}</div>
                </div>
              </div>
              <p style={{ fontSize: '15px', lineHeight: '1.5', color: 'var(--text-primary)' }}>{post.content}</p>
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '12px', display: 'flex', gap: '20px' }}>
                <button 
                  onClick={() => handleLike(post.id)}
                  style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                  {post.likes} Likes
                </button>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  Comments
                </div>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="empty-state">
              <p className="secondary-text">No posts yet. Be the first to share something!</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
