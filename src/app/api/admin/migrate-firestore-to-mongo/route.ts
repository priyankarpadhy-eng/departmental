import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb } from '@/lib/firebase/admin';
import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { Batch, Department, Course, Offering, Semester } from '@/models/Academic';
import { TimetableSlot, AttendanceSession, AttendanceRecord } from '@/models/Logistics';
import { Assignment, Submission, Quiz, QuizQuestion, StudyMaterial } from '@/models/Classroom';
import { NewsEvent, GalleryPhoto, AuditLog } from '@/models/Public';
import { Result, StudentPost, StudentRequest, LeaveRequest } from '@/models/Interactions';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    await connectDB();
    console.log('--- STARTING SEQUENTIAL DATA MIGRATION ---');

    const transformTimestamps = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      if (obj.toDate && typeof obj.toDate === 'function') return obj.toDate();
      if (obj._seconds !== undefined) return new Date(obj._seconds * 1000); 
      
      const newObj: any = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        newObj[key] = transformTimestamps(obj[key]);
      }
      return newObj;
    };

    const migrateCollection = async (firestoreName: string, Model: any, transform?: (data: any, id: string) => any) => {
      if (!Model) {
        console.warn(`Skipping ${firestoreName}: Model is undefined.`);
        return 0;
      }
      console.log(`Migrating ${firestoreName}...`);
      const snap = await adminDb.collection(firestoreName).get();
      if (snap.empty) return 0;

      let count = 0;
      for (const doc of snap.docs) {
        try {
          let data = transformTimestamps(doc.data());
          // Standardize created_at to createdAt for better Mongoose compatibility
          if (data.created_at) {
             data.createdAt = data.created_at;
          }
          const transformedData = transform ? transform(data, doc.id) : { ...data, id: doc.id };
          
          if (firestoreName === 'profiles' && Model.findOneAndUpdate) {
             await Model.findOneAndUpdate({ firebase_uid: doc.id }, transformedData, { upsert: true });
          } else if ((firestoreName === 'departments' || firestoreName === 'courses') && Model.findOneAndUpdate) {
             await Model.findOneAndUpdate({ code: data.code }, transformedData, { upsert: true });
          } else if (typeof Model.findOneAndUpdate === 'function') {
            const query = data.id || data.uid || data.code ? { id: data.id || data.uid || data.code } : transformedData;
            await Model.findOneAndUpdate(query, transformedData, { upsert: true });
          } else if (typeof Model.create === 'function') {
            await Model.create(transformedData);
          }
          count++;
        } catch (itemErr) {
          // ignore error and continue
        }
      }
      return count;
    };

    const counts: Record<string, number> = {
      profiles: await migrateCollection('profiles', Profile, (d, id) => ({ ...d, firebase_uid: id })),
      departments: await migrateCollection('departments', Department),
      batches: await migrateCollection('batches', Batch),
      courses: await migrateCollection('courses', Course),
      semesters: await migrateCollection('semesters', Semester),
      offerings: await migrateCollection('offerings', Offering),
      timetable_slots: await migrateCollection('timetable_slots', TimetableSlot),
      attendance_sessions: await migrateCollection('attendance_sessions', AttendanceSession),
      attendance_records: await migrateCollection('attendance_records', AttendanceRecord),
      study_materials: await migrateCollection('study_materials', StudyMaterial),
      assignments: await migrateCollection('assignments', Assignment),
      submissions: await migrateCollection('submissions', Submission),
      quizzes: await migrateCollection('quizzes', Quiz),
      quiz_questions: await migrateCollection('quiz_questions', QuizQuestion),
      news_events: await migrateCollection('news_events', NewsEvent),
      gallery: await migrateCollection('gallery', GalleryPhoto),
      audit_logs: await migrateCollection('audit_logs', AuditLog),
      results: await migrateCollection('results', Result),
      student_posts: await migrateCollection('student_posts', StudentPost),
      student_requests: await migrateCollection('student_requests', StudentRequest),
      leave_requests: await migrateCollection('leave_requests', LeaveRequest),
    };

    console.log('--- MIGRATION FINISHED SUCCESS ---');
    return NextResponse.json({ success: true, counts });
  } catch (error: any) {
    console.error('Migration API ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown migration error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
