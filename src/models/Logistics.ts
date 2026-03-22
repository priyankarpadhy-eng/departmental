import mongoose, { Schema, model, models } from 'mongoose';

// --- ATTENDANCE ---
const AttendanceSessionSchema = new Schema({
  offering_id: String,
  faculty_id: String,
  session_date: { type: Date, default: Date.now },
  session_type: String, // Regular, Lab, Extra
  qr_token: String,
  expires_at: Date,
  is_open: { type: Boolean, default: true },
}, { timestamps: true });

const AttendanceRecordSchema = new Schema({
  session_id: String,
  student_id: String,
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
  method: { type: String, enum: ['face', 'qr', 'manual'], default: 'manual' },
  reason: String,
  marked_at: { type: Date, default: Date.now },
}, { timestamps: true });

const TimetableSlotSchema = new Schema({
  batch_id: { type: String, required: true },
  day_of_week: { type: Number, required: true }, // 0=Mon, 1=Tue...
  start_time: String, // "09:00"
  end_time: String, // "10:00"
  offering_id: String,
  room: String,
}, { timestamps: true });

export const AttendanceSession = models?.AttendanceSession || model('AttendanceSession', AttendanceSessionSchema);
export const AttendanceRecord = models?.AttendanceRecord || model('AttendanceRecord', AttendanceRecordSchema);
export const TimetableSlot = models?.TimetableSlot || model('TimetableSlot', TimetableSlotSchema);
