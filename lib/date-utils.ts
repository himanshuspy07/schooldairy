/**
 * Local date utilities to prevent UTC off-by-one errors.
 * All dates are formatted strictly as 'YYYY-MM-DD'.
 */

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

export function getTodayLocalDateString(): string {
  return formatLocalDate(new Date());
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function getDayOfWeek(dateStr: string): number {
  return parseLocalDate(dateStr).getDay();
}

export function isBefore(dateA: string, dateB: string): boolean {
  return dateA < dateB;
}

export function isAfter(dateA: string, dateB: string): boolean {
  return dateA > dateB;
}

export function isSameOrBefore(dateA: string, dateB: string): boolean {
  return dateA <= dateB;
}

export function isSameOrAfter(dateA: string, dateB: string): boolean {
  return dateA >= dateB;
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatMonthYear(year: number, monthIndex: number): string {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const monthName = MONTH_ABBR[(m || 1) - 1] || '';
  return `${d} ${monthName} ${y}`;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-').map(Number);
  const monthName = MONTH_ABBR[(m || 1) - 1] || '';
  return `${d} ${monthName}`;
}

export function formatDayName(dateStr: string): string {
  if (!dateStr) return '';
  const dayIndex = getDayOfWeek(dateStr);
  return DAY_NAMES[dayIndex] || '';
}

export function getDayAbbr(dayIndex: number): string {
  return DAY_ABBR[dayIndex] || '';
}

/**
 * Returns all dates in 'YYYY-MM-DD' format between startDate and endDate (inclusive).
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  if (startDate > endDate) return dates;

  let current = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  while (current <= end) {
    dates.push(formatLocalDate(current));
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
  }
  return dates;
}
