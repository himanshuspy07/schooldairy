import Dexie, { type Table } from 'dexie';
import { StudentProfile, AttendanceRecord, FeePayment, ExamRecord, BackupData } from './types';

export class SchoolDiaryDatabase extends Dexie {
  profiles!: Table<StudentProfile, number>;
  attendance!: Table<AttendanceRecord, number>;
  fees!: Table<FeePayment, number>;
  exams!: Table<ExamRecord, number>;

  constructor() {
    super('SchoolDiaryDB');
    this.version(1).stores({
      profiles: '++id, name, school, createdAt',
      attendance: '++id, studentId, date, status, [studentId+date]',
      fees: '++id, studentId, date',
      exams: '++id, studentId, date',
    });
  }
}

export const db = new SchoolDiaryDatabase();

/**
 * Request persistent storage from the browser so offline data is not evicted
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch (e) {
      console.warn('Persistent storage request failed:', e);
      return false;
    }
  }
  return false;
}

/**
 * Check if storage is already persisted
 */
export async function isStoragePersisted(): Promise<boolean> {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persisted) {
    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Export complete backup of all profiles, attendance, fees, and exams
 */
export async function exportBackupData(): Promise<BackupData> {
  const [profiles, attendance, fees, exams] = await Promise.all([
    db.profiles.toArray(),
    db.attendance.toArray(),
    db.fees.toArray(),
    db.exams.toArray(),
  ]);

  return {
    app: 'School Diary',
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles,
    attendance,
    fees,
    exams,
  };
}

/**
 * Import backup data, replacing or restoring records safely
 */
export async function importBackupData(data: BackupData): Promise<{ success: boolean; message: string }> {
  if (!data || data.app !== 'School Diary' || !Array.isArray(data.profiles)) {
    throw new Error('Invalid School Diary backup file format.');
  }

  await db.transaction('rw', [db.profiles, db.attendance, db.fees, db.exams], async () => {
    // Clear existing or import
    await db.profiles.clear();
    await db.attendance.clear();
    await db.fees.clear();
    await db.exams.clear();

    if (data.profiles.length > 0) {
      await db.profiles.bulkAdd(data.profiles);
    }
    if (data.attendance?.length > 0) {
      await db.attendance.bulkAdd(data.attendance);
    }
    if (data.fees?.length > 0) {
      await db.fees.bulkAdd(data.fees);
    }
    if (data.exams?.length > 0) {
      await db.exams.bulkAdd(data.exams);
    }
  });

  return { success: true, message: `Successfully restored ${data.profiles.length} student profile(s).` };
}

/**
 * Get distinct subject names previously used by a student profile to suggest quickly
 */
export async function getRecentSubjectNames(studentId: number): Promise<string[]> {
  const exams = await db.exams.where('studentId').equals(studentId).reverse().sortBy('date');
  const subjectsSet = new Set<string>();
  
  // Default common subjects first if none exist yet
  const defaultSubjects = ['English', 'Mathematics', 'Science', 'Social Studies', 'Language 2'];
  for (const exam of exams) {
    for (const sub of exam.subjects) {
      if (sub.name.trim()) {
        subjectsSet.add(sub.name.trim());
      }
    }
  }

  if (subjectsSet.size === 0) {
    return defaultSubjects;
  }
  return Array.from(subjectsSet);
}
