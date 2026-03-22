import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { Semester } from '@/models/Academic';
import { AuditLog } from '@/models/Public';
import { StudentPost } from '@/models/Interactions';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    await connectDB();

    // 1. Fetch statistics from MongoDB
    const [
      usersCount,
      studentsCount,
      facultyCount,
      activeSemesters,
      recentLogs,
      moodPosts
    ] = await Promise.all([
      Profile.countDocuments(),
      Profile.countDocuments({ role: 'student' }),
      Profile.countDocuments({ role: 'faculty' }),
      Semester.find({ is_active: true }).lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
      StudentPost.find().sort({ createdAt: -1 }).limit(50).lean()
    ]);

    // 2. Fetch legacy online admins (or from MongoDB if already presence-indexed)
    // For now, we fetch from a raw collection or fallback
    const onlineThreshold = new Date(Date.now() - 2 * 60 * 1000);
    const onlineAdmins = await mongoose.connection.db?.collection('admin_presence')
        .find({ last_seen: { $gte: onlineThreshold } })
        .toArray() || [];

    // 3. Process mood counts
    const moodCounts: Record<string, number> = {};
    moodPosts.forEach((post: any) => {
      const mood = post.mood || '😊';
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    const semesterDisplay = activeSemesters.length === 0 ? 'None' : 
                            activeSemesters.length === 1 ? (activeSemesters[0] as any).name : 
                            `${activeSemesters.length} Active`;

    return NextResponse.json({
      success: true,
      stats: {
        usersCount,
        studentsCount,
        facultyCount,
        semesterDisplay
      },
      moodCounts,
      recentLogs,
      onlineAdmins: onlineAdmins.map(a => ({ ...a, id: a._id })),
    });

  } catch (error: any) {
    console.error('Admin Dashboard API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
