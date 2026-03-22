import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { Batch, Offering } from '@/models/Academic';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deptId = searchParams.get('deptId');
    const offeringId = searchParams.get('offeringId');

    if (!deptId) {
      return NextResponse.json({ error: 'deptId is required' }, { status: 400 });
    }

    await connectDB();

    // If no offeringId, just fetch batches and offerings for filters
    if (!offeringId) {
      const [batches, offerings] = await Promise.all([
        Batch.find({ dept_id: deptId }).lean(),
        Offering.find({ dept_id: deptId }).lean()
      ]);
      return NextResponse.json({ batches, offerings });
    }

    // If offeringId is provided, fetch results and JOIN with students (profiles)
    // We use aggregation for maximum performance
    const results = await mongoose.connection.db?.collection('results').aggregate([
      { $match: { offering_id: offeringId } },
      {
        $lookup: {
          from: 'profiles',
          localField: 'student_id',
          foreignField: 'firebase_uid',
          as: 'student'
        }
      },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } }
    ]).toArray();

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Gradebook API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch gradebook data' }, { status: 500 });
  }
}
