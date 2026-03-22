import mongoose, { Schema, model, models } from 'mongoose';

// --- DEPARTMENTS & BATCHES ---
const DepartmentSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: String,
  hod_id: String, // UID
  established_year: Number,
}, { timestamps: true });

// --- BATCHES ---
const BatchSchema = new Schema({
  dept_id: { type: String, required: true },
  graduation_year: { type: Number, required: true },
  section: String,
}, { timestamps: true });

// --- COURSES ---
const CourseSchema = new Schema({
  dept_id: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  credits: { type: Number, default: 0 },
  description: String,
}, { timestamps: true });

// --- OFFERINGS ---
const OfferingSchema = new Schema({
  semester_id: String,
  course_id: { type: String, required: true },
  faculty_id: { type: String, required: true },
  batch_id: { type: String, required: true },
  room: String,
}, { timestamps: true });

// --- SEMESTERS ---
const SemesterSchema = new Schema({
  name: { type: String, required: true },
  start_date: String,
  end_date: String,
  is_active: { type: Boolean, default: false },
}, { timestamps: true });

export const Department = models?.Department || model('Department', DepartmentSchema);
export const Batch = models?.Batch || model('Batch', BatchSchema);
export const Course = models?.Course || model('Course', CourseSchema);
export const Offering = models?.Offering || model('Offering', OfferingSchema);
export const Semester = models?.Semester || model('Semester', SemesterSchema);
