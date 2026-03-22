import mongoose, { Schema, model, models } from 'mongoose';

// --- NEWS & EVENTS ---
const NewsEventSchema = new Schema({
  dept_id: String,
  title: { type: String, required: true },
  body: String,
  type: { type: String, enum: ['news', 'event'], default: 'news' },
  event_date: Date,
  image_url: String,
  is_published: { type: Boolean, default: true },
  created_by: String, // UID
}, { timestamps: true });

// --- GALLERY ---
const GalleryPhotoSchema = new Schema({
  dept_id: String,
  title: String,
  image_url: { type: String, required: true },
  album: String,
  uploaded_by: String, // UID
}, { timestamps: true });

// --- AUDIT LOGS ---
const AuditLogSchema = new Schema({
  admin_id: String,
  session_id: String,
  action: String,
  module: { type: String, index: true },
  description: String,
  target_table: String,
  target_id: String,
  old_value: Schema.Types.Mixed,
  new_value: Schema.Types.Mixed,
  ip_address: String,
}, { timestamps: true });

// Create a compound index for fast sorting and filtering
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ module: 1, createdAt: -1 });

export const NewsEvent = models?.NewsEvent || model('NewsEvent', NewsEventSchema);
export const GalleryPhoto = models?.GalleryPhoto || model('GalleryPhoto', GalleryPhotoSchema);
export const AuditLog = models?.AuditLog || model('AuditLog', AuditLogSchema);
