export type AttendanceStatus = 'present' | 'absent' | 'holiday';

export interface StudentProfile {
  id?: number;
  name: string;
  grade: string;
  section?: string;
  rollNo?: string;
  school: string;
  sessionStart: string; // YYYY-MM-DD
  sessionEnd: string;   // YYYY-MM-DD
  weeklyOffDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday (default: [0])
  photoUrl?: string;    // Base64 data URL
  currency: string;    // default "₹"
  createdAt: number;
  updatedAt: number;
}

export interface AttendanceRecord {
  id?: number;
  studentId: number;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
  createdAt?: number;
}

export interface FeePayment {
  id?: number;
  studentId: number;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt?: number;
}

export interface SubjectMark {
  name: string;
  obtained: number;
  maxMarks: number;
}

export interface ExamRecord {
  id?: number;
  studentId: number;
  name: string;
  date: string; // YYYY-MM-DD
  subjects: SubjectMark[];
  createdAt?: number;
}

export interface BackupData {
  app: 'School Diary';
  version: 1;
  exportedAt: string;
  profiles: StudentProfile[];
  attendance: AttendanceRecord[];
  fees: FeePayment[];
  exams: ExamRecord[];
}

export type TabType = 'attendance' | 'fees' | 'marks' | 'profile';
