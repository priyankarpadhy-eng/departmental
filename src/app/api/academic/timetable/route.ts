import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { TimetableSlot } from '@/models/Logistics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const facultyId = searchParams.get('facultyId');

    if (!batchId && !facultyId) {
      return NextResponse.json({ error: 'batchId or facultyId is required' }, { status: 400 });
    }

    await connectDB();

    const query: any = {};
    if (batchId) query.batch_id = batchId;
    if (facultyId) query.faculty_id = facultyId;

    const slots = await TimetableSlot.find(query).sort({ day_of_week: 1, start_time: 1 }).lean();

    return NextResponse.json({ slots });
  } catch (error: any) {
    console.error('Timetable API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
  }
}
