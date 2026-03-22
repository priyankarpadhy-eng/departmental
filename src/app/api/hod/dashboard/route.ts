import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { Semester } from '@/models/Academic';
// Using generic models for requests since they might be in different collections
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    await connectDB();

    const profile = await Profile.findOne({ firebase_uid: uid }).lean();
    if (!profile || profile.role !== 'hod') {
      return NextResponse.json({ error: 'HOD Profile not found' }, { status: 404 });
    }

    const { dept_id } = profile;

    const [
      studentCount,
      facultyCount,
      activeSemesters,
      defaulters,
      // We'll use counts from specialized collections if they exist
      pendingLeaveCount,
      pendingStudentReqCount
    ] = await Promise.all([
      Profile.countDocuments({ role: 'student', dept_id }),
      Profile.countDocuments({ role: 'faculty', dept_id }),
      Semester.find({ dept_id, is_active: true }).lean(),
      // In a real migration, attendance_summary would be its own collection or part of Enrollment
      // For now, we fetch from the Profile or a placeholder
      mongoose.connection.db?.collection('attendance_summary').find({ attendance_pct: { $lt: 75 } }).limit(5).toArray() || [],
      mongoose.connection.db?.collection('leave_requests').countDocuments({ status: 'pending' }) || 0,
      mongoose.connection.db?.collection('student_requests').countDocuments({ status: 'pending' }) || 0
    ]);

    return NextResponse.json({
      profile,
      studentCount,
      facultyCount,
      activeSemesters,
      defaulters: defaulters || [],
      pendingApprovals: (Number(pendingLeaveCount) || 0) + (Number(pendingStudentReqCount) || 0),
      ts: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('HOD Dashboard API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch HOD dashboard data' }, { status: 500 });
  }
}
