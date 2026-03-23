import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

function formatDoc(doc: any) {
  const data = doc.data()
  // Recursively convert Firestore timestamps to ISO strings
  const formatted = { ...data, id: doc.id }
  
  Object.keys(formatted).forEach(key => {
    const val = formatted[key]
    if (val && typeof val === 'object' && '_seconds' in val) {
      formatted[key] = new Date(val._seconds * 1000).toISOString()
    } else if (val && typeof val.toDate === 'function') {
      formatted[key] = val.toDate().toISOString()
    }
  })
  return formatted
}

export async function GET() {
  try {
    const [facSnap, noticeSnap, hodSnap, eventSnap, gallerySnap, settingsSnap] = await Promise.all([
      adminDb.collection('profiles').where('role', '==', 'faculty').limit(8).get(),
      adminDb.collection('announcements').orderBy('created_at', 'desc').limit(5).get(),
      adminDb.collection('profiles').where('role', '==', 'hod').limit(1).get(),
      adminDb.collection('news_events').orderBy('created_at', 'desc').limit(3).get(),
      adminDb.collection('gallery').orderBy('created_at', 'desc').limit(6).get(),
      adminDb.collection('settings').doc('landing').get()
    ])

    const faculties = facSnap.docs.map(formatDoc)
    const announcements = noticeSnap.docs.map(formatDoc)
    const hod = !hodSnap.empty ? formatDoc(hodSnap.docs[0]) : null
    const events = eventSnap.docs.map(formatDoc)
    const gallery = gallerySnap.docs.map(formatDoc)
    const settings = settingsSnap.exists ? settingsSnap.data() : null

    return NextResponse.json({
      faculties,
      announcements,
      hod,
      events,
      gallery,
      settings
    })
  } catch (error: any) {
    console.error('Landing API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch', 
      details: error?.message || 'Unknown'
    }, { status: 500 })
  }
}
