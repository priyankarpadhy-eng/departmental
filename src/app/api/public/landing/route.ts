import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { NewsEvent, GalleryPhoto } from '@/models/Public';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();

    const [faculties, events, gallery, settings, hod] = await Promise.all([
      Profile.find({ role: 'faculty' }).limit(8).lean(),
      NewsEvent.find({ is_published: true }).sort({ created_at: -1 }).limit(3).lean(),
      GalleryPhoto.find({}).sort({ created_at: -1 }).limit(6).lean(),
      mongoose.connection.db?.collection('settings').findOne({ _id: 'landing' as any }) || null,
      Profile.findOne({ role: 'hod' }).lean()
    ]);

    // Announcements might be in a separate collection, let's check
    const announcements = await mongoose.connection.db?.collection('announcements')
      .find({})
      .sort({ created_at: -1 })
      .limit(5)
      .toArray() || [];

    return NextResponse.json({
      faculties,
      events,
      gallery,
      settings,
      hod,
      announcements,
      ts: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Landing API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch landing data' }, { status: 500 });
  }
}
