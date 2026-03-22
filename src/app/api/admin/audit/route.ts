import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/mongodb';
import { AuditLog } from '@/models/Public';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    await connectDB();

    const [logs, onlineAdmins, loginSessions] = await Promise.all([
      AuditLog.find({}).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      mongoose.connection.db?.collection('admin_presence').find({ 
        last_seen: { $gte: new Date(Date.now() - 2 * 60 * 1000) } 
      }).toArray() || [],
      mongoose.connection.db?.collection('admin_sessions').find({}).sort({ login_at: -1 }).limit(50).toArray() || []
    ]);

    return NextResponse.json({
      logs,
      onlineAdmins,
      loginSessions,
      ts: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Audit API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit data' }, { status: 500 });
  }
}
