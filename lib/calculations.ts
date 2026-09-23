import { AttendanceRecord, ExamRecord, FeePayment, SubjectMark } from './types';
import { getDayOfWeek, getDaysInMonth, pad2, isBefore, isSameOrBefore, isSameOrAfter } from './date-utils';

export interface AttendanceStats {
  present: number;
  absent: number;
  holidays: number;
  unmarked: number;
  percentage: number | null;
  formattedPercentage: string;
}

/**
 * Pure calculation for attendance statistics in a given date range.
 * Holidays and unmarked days are excluded from the percentage calculation.
 * If (present + absent) === 0, percentage is null and formattedPercentage is "—".
 */
export function calculateAttendanceForRange(
  records: AttendanceRecord[],
  weeklyOffDays: number[],
  startDate: string,
  endDate: string,
  todayDate: string
): AttendanceStats {
  if (!startDate || !endDate || isBefore(endDate, startDate)) {
    return {
      present: 0,
      absent: 0,
      holidays: 0,
      unmarked: 0,
      percentage: null,
      formattedPercentage: '—',
    };
  }

  // Create lookup map for fast O(1) checks: date -> status
  const recordsMap = new Map<string, AttendanceRecord>();
  for (const r of records) {
    recordsMap.set(r.date, r);
  }

  // Only consider days up to today (past and today), or up to endDate if endDate <= today
  const effectiveEnd = isBefore(endDate, todayDate) ? endDate : todayDate;

  let present = 0;
  let absent = 0;
  let holidays = 0;
  let unmarked = 0;

  // Iterate days
  const [startY, startM, startD] = startDate.split('-').map(Number);
  const [endY, endM, endD] = effectiveEnd.split('-').map(Number);

  const cur = new Date(startY, (startM || 1) - 1, startD || 1);
  const end = new Date(endY, (endM || 1) - 1, endD || 1);

  while (cur <= end) {
    const y = cur.getFullYear();
    const m = pad2(cur.getMonth() + 1);
    const d = pad2(cur.getDate());
    const dateStr = `${y}-${m}-${d}`;

    const rec = recordsMap.get(dateStr);
    if (rec) {
      if (rec.status === 'present') present++;
      else if (rec.status === 'absent') absent++;
      else if (rec.status === 'holiday') holidays++;
    } else {
      const dayOfWeek = cur.getDay();
      if (weeklyOffDays.includes(dayOfWeek)) {
        holidays++;
      } else {
        unmarked++;
      }
    }

    cur.setDate(cur.getDate() + 1);
  }

  const denominator = present + absent;
  const percentage = denominator > 0 ? (present / denominator) * 100 : null;
  const formattedPercentage = percentage !== null ? `${Math.round(percentage * 10) / 10}%` : '—';

  return {
    present,
    absent,
    holidays,
    unmarked,
    percentage,
    formattedPercentage,
  };
}

/**
 * Calculates cumulative attendance from session start date up to a specific target date.
 */
export function calculateCumulativeAttendanceUpToDate(
  records: AttendanceRecord[],
  weeklyOffDays: number[],
  sessionStartDate: string,
  targetDate: string,
  todayDate: string
): AttendanceStats {
  const effectiveEnd = isBefore(targetDate, todayDate) ? targetDate : todayDate;
  return calculateAttendanceForRange(
    records,
    weeklyOffDays,
    sessionStartDate,
    effectiveEnd,
    todayDate
  );
}

/**
 * Calculates attendance for a specific calendar month.
 */
export function calculateMonthAttendance(
  records: AttendanceRecord[],
  weeklyOffDays: number[],
  year: number,
  monthIndex: number,
  todayDate: string
): AttendanceStats {
  const totalDays = getDaysInMonth(year, monthIndex);
  const startDate = `${year}-${pad2(monthIndex + 1)}-01`;
  const endDate = `${year}-${pad2(monthIndex + 1)}-${pad2(totalDays)}`;

  return calculateAttendanceForRange(
    records,
    weeklyOffDays,
    startDate,
    endDate,
    todayDate
  );
}

/**
 * Pure calculation of fee payment totals in the academic session.
 */
export function calculateFeeTotal(
  payments: FeePayment[],
  sessionStart?: string,
  sessionEnd?: string
): { totalPaid: number; count: number } {
  let totalPaid = 0;
  let count = 0;

  for (const p of payments) {
    if (sessionStart && sessionEnd) {
      if (isSameOrAfter(p.date, sessionStart) && isSameOrBefore(p.date, sessionEnd)) {
        totalPaid += p.amount;
        count++;
      }
    } else {
      totalPaid += p.amount;
      count++;
    }
  }

  return { totalPaid, count };
}

/**
 * Pure calculation for an individual exam.
 */
export function calculateExamPercentage(subjects: SubjectMark[]): {
  totalObtained: number;
  totalMax: number;
  percentage: number | null;
  formattedPercentage: string;
} {
  if (!subjects || subjects.length === 0) {
    return {
      totalObtained: 0,
      totalMax: 0,
      percentage: null,
      formattedPercentage: '—',
    };
  }

  let totalObtained = 0;
  let totalMax = 0;

  for (const s of subjects) {
    totalObtained += Number(s.obtained) || 0;
    totalMax += Number(s.maxMarks) || 0;
  }

  if (totalMax <= 0) {
    return {
      totalObtained,
      totalMax,
      percentage: null,
      formattedPercentage: '—',
    };
  }

  const percentage = (totalObtained / totalMax) * 100;
  return {
    totalObtained,
    totalMax,
    percentage,
    formattedPercentage: `${Math.round(percentage * 10) / 10}%`,
  };
}

/**
 * Pure calculation for overall percentage across all exams.
 */
export function calculateOverallExamStats(exams: ExamRecord[]): {
  totalObtained: number;
  totalMax: number;
  percentage: number | null;
  formattedPercentage: string;
  examCount: number;
} {
  if (!exams || exams.length === 0) {
    return {
      totalObtained: 0,
      totalMax: 0,
      percentage: null,
      formattedPercentage: '—',
      examCount: 0,
    };
  }

  let totalObtained = 0;
  let totalMax = 0;

  for (const exam of exams) {
    for (const s of exam.subjects) {
      totalObtained += Number(s.obtained) || 0;
      totalMax += Number(s.maxMarks) || 0;
    }
  }

  if (totalMax <= 0) {
    return {
      totalObtained,
      totalMax,
      percentage: null,
      formattedPercentage: '—',
      examCount: exams.length,
    };
  }

  const percentage = (totalObtained / totalMax) * 100;
  return {
    totalObtained,
    totalMax,
    percentage,
    formattedPercentage: `${Math.round(percentage * 10) / 10}%`,
    examCount: exams.length,
  };
}

/**
 * Validate a subject mark entry:
 * - maxMarks > 0
 * - obtained >= 0
 * - obtained <= maxMarks
 */
export function validateSubjectMark(obtained: number, maxMarks: number): {
  isValid: boolean;
  error?: string;
} {
  if (isNaN(maxMarks) || maxMarks <= 0) {
    return { isValid: false, error: 'Max marks must be greater than 0' };
  }
  if (isNaN(obtained) || obtained < 0) {
    return { isValid: false, error: 'Obtained marks cannot be negative' };
  }
  if (obtained > maxMarks) {
    return { isValid: false, error: `Obtained marks (${obtained}) cannot exceed max marks (${maxMarks})` };
  }
  return { isValid: true };
}
