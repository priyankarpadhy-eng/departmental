import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { TimetableSlot } from '@/models/Logistics';
import { Offering } from '@/models/Academic';
import { Submission } from '@/models/Classroom';
import { NewsEvent } from '@/models/Public';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    await connectDB();

    const profile = await Profile.findOne({ firebase_uid: uid }).lean();
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const dayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    const [
      slots,
      pendingGradesCount,
      offerings,
      announcements
    ] = await Promise.all([
      TimetableSlot.find({ faculty_id: uid, day_of_week: dayIndex }).sort('start_time').lean(),
      Submission.countDocuments({ faculty_id: uid, marks: null }),
      Offering.find({ faculty_id: uid }).limit(6).lean(),
      NewsEvent.find({ is_published: true }).sort({ is_pinned: -1, createdAt: -1 }).limit(5).lean()
    ]);

    return NextResponse.json({
      profile,
      slots,
      pendingGradesCount,
      offerings,
      announcements,
      ts: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Faculty Dashboard API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch faculty dashboard data' }, { status: 500 });
  }
}
