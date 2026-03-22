import mongoose, { Schema, model, models } from 'mongoose';

// --- STUDY MATERIALS ---
const StudyMaterialSchema = new Schema({
  offering_id: String,
  faculty_id: String,
  title: String,
  file_url: String,
  unit: Number,
  type: { type: String, enum: ['notes', 'slides', 'video'], default: 'notes' },
  description: String,
}, { timestamps: true });

// --- ASSIGNMENTS ---
const AssignmentSchema = new Schema({
  offering_id: String,
  title: String,
  description: String,
  due_date: Date,
  max_marks: Number,
  file_url: String,
}, { timestamps: true });

// --- SUBMISSIONS ---
const SubmissionSchema = new Schema({
  assignment_id: String,
  student_id: String,
  file_url: String,
  submitted_at: Date,
  marks: Number,
  feedback: String,
  status: { type: String, enum: ['pending', 'submitted', 'graded'], default: 'submitted' },
}, { timestamps: true });

// --- QUIZZES ---
const QuizSchema = new Schema({
  offering_id: String,
  course_name: String,
  batch_id: String,
  title: String,
  duration_mins: Number,
  is_active: { type: Boolean, default: true },
  starts_at: Date,
}, { timestamps: true });

// --- QUIZ QUESTIONS ---
const QuizQuestionSchema = new Schema({
  quiz_id: String,
  question: String,
  options: [{ label: String, text: String }],
  correct_answer: String,
  order_no: Number,
}, { timestamps: true });

export const StudyMaterial = models?.StudyMaterial || model('StudyMaterial', StudyMaterialSchema);
export const Assignment = models?.Assignment || model('Assignment', AssignmentSchema);
export const Submission = models?.Submission || model('Submission', SubmissionSchema);
export const Quiz = models?.Quiz || model('Quiz', QuizSchema);
export const QuizQuestion = models?.QuizQuestion || model('QuizQuestion', QuizQuestionSchema);
