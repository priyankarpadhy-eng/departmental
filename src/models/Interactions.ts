import mongoose, { Schema, model, models } from 'mongoose';

// Flexible schemas to allow for easy migration from Firestore
const ResultSchema = new Schema({}, { timestamps: true, strict: false });
const LeaveRequestSchema = new Schema({}, { timestamps: true, strict: false });
const StudentRequestSchema = new Schema({}, { timestamps: true, strict: false });
const StudentPostSchema = new Schema({}, { timestamps: true, strict: false });

export const Result = models?.Result || model('Result', ResultSchema);
export const LeaveRequest = models?.LeaveRequest || model('LeaveRequest', LeaveRequestSchema);
export const StudentRequest = models?.StudentRequest || model('StudentRequest', StudentRequestSchema);
export const StudentPost = models?.StudentPost || model('StudentPost', StudentPostSchema);
