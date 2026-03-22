import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { TimetableSlot } from '@/models/Logistics';
import { Assignment, Quiz } from '@/models/Classroom';
import { NewsEvent } from '@/models/Public';
import mongoose from 'mongoose';

// Unified handler for fetching student dashboard data in ONE trip
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    await connectDB();

    // 1. Fetch Profile first to get the batch_id
    const profile = await Profile.findOne({ firebase_uid: uid }).lean();
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { batch_id, dept_id } = profile;
    const dayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    // 2. Fetch all other data in parallel
    const [
      announcements,
      timetable,
      assignments,
      quizzes
    ] = await Promise.all([
      NewsEvent.find({ is_published: true }).sort({ createdAt: -1 }).limit(5).lean(),
      TimetableSlot.find({ batch_id, day_of_week: dayIndex }).sort('start_time').lean(),
      Assignment.find({
        due_date: { $gte: new Date().toISOString() }
      }).sort('due_date').limit(5).lean(),
      Quiz.find({ is_active: true }).limit(3).lean()
    ]);

    // Construct the combined response
    return NextResponse.json({
      profile,
      timetable,
      assignments,
      quizzes,
      attendanceSummary: profile.attendance_summary || [],
      ts: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Unified Dashboard API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
