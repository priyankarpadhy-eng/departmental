import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { StudyMaterial, Assignment, Quiz, Submission } from '@/models/Classroom';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const type = searchParams.get('type'); // 'materials', 'assignments', 'quizzes'
    const uid = searchParams.get('uid');

    if (!batchId) {
      return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
    }

    await connectDB();

    let data: any = {};
    if (type === 'materials') {
      data.items = await StudyMaterial.find({ batch_id: batchId }).sort({ createdAt: -1 }).lean();
    } else if (type === 'assignments') {
      const [assignments, submissions] = await Promise.all([
        Assignment.find({ batch_id: batchId }).sort({ due_date: 1 }).lean(),
        uid ? Submission.find({ student_id: uid }).lean() : Promise.resolve([])
      ]);
      data.items = assignments;
      data.submissions = submissions;
    } else if (type === 'quizzes') {
      data.items = await Quiz.find({ batch_id: batchId, is_active: true }).sort({ createdAt: -1 }).lean();
    } else {
        // Fetch abbreviated versions of all for the generic classroom view if needed
        const [m, a, q] = await Promise.all([
          StudyMaterial.find({ batch_id: batchId }).limit(5).lean(),
          Assignment.find({ batch_id: batchId }).limit(5).lean(),
          Quiz.find({ batch_id: batchId, is_active: true }).limit(5).lean()
        ]);
        data = { materials: m, assignments: a, quizzes: q };
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Classroom API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch classroom data' }, { status: 500 });
  }
}
