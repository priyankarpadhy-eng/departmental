import mongoose, { Schema, model, models } from 'mongoose';

const ProfileSchema = new Schema({
  firebase_uid: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['admin', 'hod', 'faculty', 'student', 'alumni'],
    required: true 
  },
  full_name: String,
  email: String,
  phone: String,
  avatar_url: String,
  dept_id: String, // Reference to Department ID (String or ObjectId)
  batch_id: String, // Reference to Batch ID
  roll_no: String,
  graduation_year: Number,
  designation: String,
  verification_status: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected', null],
    default: 'pending'
  },
  rejection_reason: String,
  current_company: String,
  current_job_title: String,
  show_on_landing: { type: Boolean, default: false },
  landing_message: String,
  photo_url: String,
  must_change_password: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  last_login: Date,
}, { timestamps: true });

// Optimize for common dashboard queries
ProfileSchema.index({ role: 1 });
ProfileSchema.index({ createdAt: -1 });

export default models?.Profile || model('Profile', ProfileSchema);
