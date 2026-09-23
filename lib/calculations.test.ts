import {
  calculateAttendanceForRange,
  calculateCumulativeAttendanceUpToDate,
  calculateExamPercentage,
  calculateFeeTotal,
  calculateOverallExamStats,
  validateSubjectMark,
} from './calculations';
import { AttendanceRecord, ExamRecord, FeePayment, SubjectMark } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('Running School Diary unit tests...');

// 1. Attendance Tests
const testRecords: AttendanceRecord[] = [
  { studentId: 1, date: '2026-09-01', status: 'present' },
  { studentId: 1, date: '2026-09-02', status: 'present' },
  { studentId: 1, date: '2026-09-03', status: 'absent' },
  { studentId: 1, date: '2026-09-04', status: 'holiday' },
];
const weeklyOffDays = [0]; // Sunday

// Range with 2 present, 1 absent -> 2 / 3 = 66.7%
const stats = calculateAttendanceForRange(
  testRecords,
  weeklyOffDays,
  '2026-09-01',
  '2026-09-04',
  '2026-09-10'
);

assert(stats.present === 2, `Expected 2 present, got ${stats.present}`);
assert(stats.absent === 1, `Expected 1 absent, got ${stats.absent}`);
assert(stats.holidays === 1, `Expected 1 holiday, got ${stats.holidays}`);
assert(stats.formattedPercentage === '66.7%', `Expected 66.7%, got ${stats.formattedPercentage}`);

// Division by zero edge case: 0 present, 0 absent -> "—"
const zeroStats = calculateAttendanceForRange(
  [],
  weeklyOffDays,
  '2026-09-01',
  '2026-09-01',
  '2026-09-10'
);
assert(zeroStats.percentage === null, 'Expected percentage to be null on zero working days');
assert(zeroStats.formattedPercentage === '—', `Expected '—', got ${zeroStats.formattedPercentage}`);

// 2. Exam Percentage Tests
const subjects: SubjectMark[] = [
  { name: 'Math', obtained: 95, maxMarks: 100 },
  { name: 'Science', obtained: 85, maxMarks: 100 },
];
const examResult = calculateExamPercentage(subjects);
assert(examResult.totalObtained === 180, 'Expected 180 total obtained');
assert(examResult.totalMax === 200, 'Expected 200 total max');
assert(examResult.formattedPercentage === '90%', `Expected 90%, got ${examResult.formattedPercentage}`);

// Exam zero division test
const zeroExam = calculateExamPercentage([]);
assert(zeroExam.formattedPercentage === '—', `Expected '—', got ${zeroExam.formattedPercentage}`);

// 3. Subject validation tests
const validCheck = validateSubjectMark(80, 100);
assert(validCheck.isValid === true, 'Expected valid');

const overMaxCheck = validateSubjectMark(105, 100);
assert(overMaxCheck.isValid === false, 'Obtained cannot exceed max');

const negativeCheck = validateSubjectMark(-5, 100);
assert(negativeCheck.isValid === false, 'Obtained cannot be negative');

const zeroMaxCheck = validateSubjectMark(0, 0);
assert(zeroMaxCheck.isValid === false, 'Max must be > 0');

// 4. Overall Exam stats
const exams: ExamRecord[] = [
  { studentId: 1, name: 'T1', date: '2026-08-01', subjects: [{ name: 'A', obtained: 40, maxMarks: 50 }] },
  { studentId: 1, name: 'T2', date: '2026-09-01', subjects: [{ name: 'A', obtained: 45, maxMarks: 50 }] },
];
const overall = calculateOverallExamStats(exams);
assert(overall.totalObtained === 85, 'Expected 85 sum obtained');
assert(overall.totalMax === 100, 'Expected 100 sum max');
assert(overall.formattedPercentage === '85%', `Expected 85%, got ${overall.formattedPercentage}`);

// 5. Fee calculation
const payments: FeePayment[] = [
  { studentId: 1, amount: 2500, date: '2026-05-10' },
  { studentId: 1, amount: 3500, date: '2026-08-15' },
  { studentId: 1, amount: 1000, date: '2025-01-01' }, // outside session
];
const feeTotal = calculateFeeTotal(payments, '2026-04-01', '2027-03-31');
assert(feeTotal.totalPaid === 6000, `Expected 6000, got ${feeTotal.totalPaid}`);
assert(feeTotal.count === 2, `Expected 2 receipts, got ${feeTotal.count}`);

console.log('All calculations unit tests passed with 100% success!');
