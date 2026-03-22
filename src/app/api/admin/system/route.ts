import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AuditLog } from '@/models/Public';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();
    await connectDB();

    if (action === 'ping') {
      // HEARTBEAT for presence
      const { uid, fullName, page } = data;
      if (!uid) return NextResponse.json({ error: 'Missing UID' }, { status: 400 });

      const presenceCol = mongoose.connection.db?.collection('admin_presence');
      if (presenceCol) {
        await presenceCol.updateOne(
          { admin_id: uid },
          { 
            $set: { 
              admin_id: uid, 
              full_name: fullName || 'Admin', 
              last_seen: new Date(), 
              current_page: page
            }
          },
          { upsert: true }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'log') {
      // AUDIT LOG
      const log = new AuditLog({
        ...data,
        createdAt: new Date()
      });
      await log.save();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('System API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
