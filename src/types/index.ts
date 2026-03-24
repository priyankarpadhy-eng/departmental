// Database types for the college department portal

export type UserRole = 'admin' | 'hod' | 'faculty' | 'student' | 'alumni'
export type AttendanceStatus = 'present' | 'absent' | 'late'
export type AttendanceMethod = 'face' | 'qr' | 'manual'
export type SubmissionStatus = 'pending' | 'submitted' | 'graded'
export type RequestStatus = 'pending' | 'approved' | 'rejected'
export type MentorshipStatus = 'pending' | 'accepted' | 'declined'
export type AuditAction = 'created' | 'updated' | 'deleted' | 'login' | 'logout' | 'exported' | 'viewed'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  dept_id: string | null
  batch_id: string | null
  roll_no: string | null
  registration_no: string | null
  graduation_year: number | null
  designation: string | null
  expertise: string | null
  verification_status: 'pending' | 'verified' | 'rejected' | null
  rejection_reason?: string | null
  current_company: string | null
  current_job_title: string | null
  show_on_landing?: boolean
  landing_message?: string | null
  photo_url: string | null
  must_change_password: boolean
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
  // joined
  department?: Department
  batch?: Batch
}

export interface Department {
  id: string
  name: string
  code: string
  description: string | null
  hod_id: string | null
  established_year: number | null
  created_at: string
  updated_at: string
}

export interface Batch {
  id: string
  dept_id: string
  graduation_year: number
  section: string
  created_at: string
}

export interface Semester {
  id: string
  dept_id: string
  name: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
  academic_year: string
  created_at: string
}

export interface Course {
  id: string
  dept_id: string
  code: string
  name: string
  credits: number
  description: string | null
  created_at: string
}

export interface CourseOffering {
  id: string
  semester_id: string
  course_id: string
  faculty_id: string
  batch_id: string
  room: string | null
  created_at: string
  // joined
  course?: Course
  faculty?: Profile
  batch?: Batch
  semester?: Semester
}

export interface Enrollment {
  id: string
  student_id: string
  offering_id: string
  grade: string | null
  status: string
  enrolled_at: string
  // joined
  offering?: CourseOffering
  student?: Profile
}

export interface AttendanceSession {
  id: string
  offering_id: string
  faculty_id: string
  session_date: string
  session_type: string
  qr_token: string
  expires_at: string
  is_open: boolean
  created_at: string
  // joined
  offering?: CourseOffering
}

export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  status: AttendanceStatus
  method: AttendanceMethod
  reason: string | null
  marked_at: string
  // joined
  student?: Profile
  session?: AttendanceSession
}

export interface AttendanceSummary {
  student_id: string
  offering_id: string
  total_sessions: number
  present_count: number
  absent_count: number
  attendance_pct: number
}

export interface StudyMaterial {
  id: string
  offering_id: string
  faculty_id: string
  title: string
  file_url: string
  unit: number | null
  type: 'notes' | 'slides' | 'video'
  description: string | null
  created_at: string
}

export interface Assignment {
  id: string
  offering_id: string
  title: string
  description: string | null
  due_date: string
  max_marks: number
  file_url: string | null
  created_at: string
  // joined
  offering?: CourseOffering
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string | null
  submitted_at: string
  marks: number | null
  feedback: string | null
  status: SubmissionStatus
  // joined
  student?: Profile
  assignment?: Assignment
}

export interface Result {
  id: string
  offering_id: string
  student_id: string
  internal_marks: number | null
  external_marks: number | null
  total: number | null
  grade: string | null
  is_locked: boolean
  created_at: string
  updated_at: string
  // joined
  offering?: CourseOffering
  student?: Profile
}

export interface SyllabusTopic {
  id: string
  offering_id: string
  unit: number
  topic: string
  is_covered: boolean
  covered_at: string | null
  created_at: string
}

export interface Quiz {
  id: string
  offering_id: string
  course_name: string
  batch_id: string
  title: string
  duration_mins: number
  is_active: boolean
  starts_at: string | null
  created_at: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question: string
  options: { label: string; text: string }[]
  correct_answer: string
  order_no: number
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  student_id: string
  score: number | null
  answers: Record<string, string> | null
  submitted_at: string
}

export interface Announcement {
  id: string
  author_id: string
  title: string
  body: string
  target_role: UserRole | null
  target_batch_id: string | null
  target_offering_id: string | null
  is_pinned: boolean
  created_at: string
  updated_at: string
  // joined
  author?: Profile
}

export interface TimetableSlot {
  id: string
  batch_id: string
  day_of_week: number
  start_time: string
  end_time: string
  offering_id: string
  room: string | null
  created_at: string
  // joined
  offering?: CourseOffering
  batch?: Batch
}

export interface StudentRequest {
  id: string
  student_id: string
  type: string
  description: string | null
  status: RequestStatus
  reviewed_by: string | null
  review_note: string | null
  document_url: string | null
  created_at: string
  updated_at: string
  // joined
  student?: Profile
}

export interface LeaveRequest {
  id: string
  faculty_id: string
  leave_from: string
  leave_to: string
  reason: string
  status: RequestStatus
  reviewed_by: string | null
  review_note: string | null
  created_at: string
  updated_at: string
  // joined
  faculty?: Profile
}

export interface AdminSession {
  id: string
  admin_id: string
  ip_address: string | null
  device: string | null
  login_at: string
  logout_at: string | null
  is_online: boolean
}

export interface AdminPresence {
  admin_id: string
  last_seen: string
  current_page: string
  // joined
  admin?: Profile
}

export interface AuditLog {
  id: string
  admin_id: string
  session_id: string | null
  action: AuditAction
  module: string
  description: string
  target_table: string | null
  target_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  // joined
  admin?: Profile
}

export interface AlumniProfile {
  id: string
  profile_id: string
  current_company: string | null
  job_title: string | null
  city: string | null
  linkedin_url: string | null
  graduation_year: number | null
  is_mentor: boolean
  created_at: string
  updated_at: string
  // joined
  profile?: Profile
}

export interface JobPosting {
  id: string
  alumni_id: string
  title: string
  company: string
  description: string
  apply_url: string | null
  expires_at: string | null
  created_at: string
  // joined
  alumni?: Profile
}

export interface MentorshipRequest {
  id: string
  student_id: string
  alumni_id: string
  message: string
  status: MentorshipStatus
  created_at: string
  updated_at: string
  // joined
  student?: Profile
  alumni?: Profile
}

export interface LiveSession {
  id: string
  offering_id: string
  faculty_id: string
  room_id: string
  is_active: boolean
  started_at: string
  ended_at: string | null
}

export interface NewsEvent {
  id: string
  dept_id: string | null
  title: string
  body: string | null
  type: 'news' | 'event'
  event_date: string | null
  image_url: string | null
  is_published: boolean
  created_by: string | null
  created_at: string
}

export interface GalleryPhoto {
  id: string
  dept_id: string | null
  title: string | null
  description?: string | null
  image_url: string
  album: string
  uploaded_by: string | null
  created_at: string
}
