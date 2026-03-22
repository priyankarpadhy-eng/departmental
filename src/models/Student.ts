import mongoose, { Schema, model, models } from 'mongoose';

const StudentSchema = new Schema({
  firebase_uid: { type: String, required: true, unique: true }, // Links to Firebase Auth
  full_name: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  batch_id: { type: String, required: true },
  graduation_year: { type: Number, required: true },
  attendance_summary: [
    {
      course_id: String,
      course_name: String,
      attendance_pct: Number,
    }
  ],
  is_verified: { type: Boolean, default: false },
}, { timestamps: true });

// Avoid Re-registering the model on hot-reloads
const Student = models.Student || model('Student', StudentSchema);

export default Student;
