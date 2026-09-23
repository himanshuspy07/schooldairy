'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Coffee, Calendar as CalendarIcon, Info } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, StudentProfile } from '@/lib/types';
import {
  formatDisplayDate,
  formatMonthYear,
  getDaysInMonth,
  getFirstDayOfMonth,
  getTodayLocalDateString,
  pad2,
  isBefore,
  isAfter,
} from '@/lib/date-utils';
import {
  calculateAttendanceForRange,
  calculateCumulativeAttendanceUpToDate,
  calculateMonthAttendance,
} from '@/lib/calculations';
import { AttendanceSheet } from './AttendanceSheet';

interface AttendanceTabProps {
  profile: StudentProfile;
  records: AttendanceRecord[];
  onMarkAttendance: (date: string, status: AttendanceStatus) => Promise<void>;
  onClearAttendance: (date: string) => Promise<void>;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  profile,
  records,
  onMarkAttendance,
  onClearAttendance,
}) => {
  const today = getTodayLocalDateString();
  const [todayYear, todayMonth] = today.split('-').map(Number);

  // Active month navigation state
  const [currentYear, setCurrentYear] = useState(todayYear);
  const [currentMonth, setCurrentMonth] = useState((todayMonth || 1) - 1);

  // Active date tapped for bottom sheet
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fast map lookup: date -> record
  const recordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of records) {
      map.set(r.date, r);
    }
    return map;
  }, [records]);

  // Today's attendance state
  const todayRecord = recordsMap.get(today);
  const isTodayWeeklyOff = profile.weeklyOffDays.includes(new Date().getDay());
  const isTodayMarked = !!todayRecord;

  // Month stats calculation
  const monthStats = useMemo(() => {
    return calculateMonthAttendance(
      records,
      profile.weeklyOffDays,
      currentYear,
      currentMonth,
      today
    );
  }, [records, profile.weeklyOffDays, currentYear, currentMonth, today]);

  // Whole session stats calculation (session start up to today)
  const sessionStats = useMemo(() => {
    return calculateAttendanceForRange(
      records,
      profile.weeklyOffDays,
      profile.sessionStart,
      profile.sessionEnd,
      today
    );
  }, [records, profile.weeklyOffDays, profile.sessionStart, profile.sessionEnd, today]);

  // Selected date cumulative stats
  const selectedDateCumulativeStats = useMemo(() => {
    if (!selectedDate) return null;
    return calculateCumulativeAttendanceUpToDate(
      records,
      profile.weeklyOffDays,
      profile.sessionStart,
      selectedDate,
      today
    );
  }, [selectedDate, records, profile.weeklyOffDays, profile.sessionStart, today]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Prominent "Mark Today's Attendance" card if unmarked today */}
      {!isTodayMarked && (
        <div className="rounded-2xl bg-gradient-to-br from-[#E8F5E9] to-[#FAF7F2] border border-[#2E7D4F]/25 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#2E7D4F]">Today&apos;s Attendance</p>
              <h3 className="text-base font-bold text-stone-900">{formatDisplayDate(today)}</h3>
            </div>
            {isTodayWeeklyOff && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309]">
                Scheduled Weekly Off
              </span>
            )}
          </div>

          <p className="text-xs text-stone-600 mb-3">
            Mark your attendance for today with one tap:
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onMarkAttendance(today, 'present')}
              className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-[#2E7D4F] text-white text-xs font-bold shadow-sm shadow-[#2E7D4F]/30 hover:bg-[#225C3A] active:scale-[0.98] transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Present</span>
            </button>

            <button
              type="button"
              onClick={() => onMarkAttendance(today, 'absent')}
              className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-[#DC2626] text-white text-xs font-bold shadow-sm shadow-[#DC2626]/30 hover:bg-[#B91C1C] active:scale-[0.98] transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Absent</span>
            </button>

            <button
              type="button"
              onClick={() => onMarkAttendance(today, 'holiday')}
              className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-[#D97706] text-white text-xs font-bold shadow-sm shadow-[#D97706]/30 hover:bg-[#B45309] active:scale-[0.98] transition-all"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Holiday</span>
            </button>
          </div>
        </div>
      )}

      {/* Summary card above calendar */}
      <div className="rounded-2xl bg-white border border-stone-200/90 p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-stone-100">
          {/* Month % */}
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              {formatMonthYear(currentYear, currentMonth).split(' ')[0]} Attendance
            </span>
            <span className="text-2xl font-black text-[#2E7D4F] mt-0.5">
              {monthStats.formattedPercentage}
            </span>
            <span className="text-[11px] text-stone-500">
              {monthStats.present} present of {monthStats.present + monthStats.absent} working days
            </span>
          </div>

          {/* Session % */}
          <div className="flex flex-col border-l border-stone-100 pl-3">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Full Session
            </span>
            <span className="text-2xl font-black text-stone-900 mt-0.5">
              {sessionStats.formattedPercentage}
            </span>
            <span className="text-[11px] text-stone-500">
              Session start to today
            </span>
          </div>
        </div>

        {/* Breakdown Counts */}
        <div className="grid grid-cols-4 gap-1 pt-3 text-center">
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-[#2E7D4F]">{monthStats.present}</span>
            <span className="text-[10px] font-medium text-stone-500">Present</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-[#DC2626]">{monthStats.absent}</span>
            <span className="text-[10px] font-medium text-stone-500">Absent</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-[#D97706]">{monthStats.holidays}</span>
            <span className="text-[10px] font-medium text-stone-500">Holidays</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-stone-600">{monthStats.unmarked}</span>
            <span className="text-[10px] font-medium text-stone-500">Unmarked</span>
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="rounded-2xl bg-white border border-stone-200/90 p-4 shadow-sm flex flex-col gap-3">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100 active:bg-stone-200 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h2 className="text-base font-bold text-stone-900">
              {formatMonthYear(currentYear, currentMonth)}
            </h2>
            <p className="text-[11px] text-stone-500">Tap any day to view or mark</p>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100 active:bg-stone-200 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
            const isDefaultOff = profile.weeklyOffDays.includes(i);
            return (
              <span
                key={d}
                className={`text-[11px] font-bold py-1 ${
                  isDefaultOff ? 'text-[#D97706]' : 'text-stone-500'
                }`}
              >
                {d}
              </span>
            );
          })}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty prefix cells */}
          {Array.from({ length: firstDay }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-12" />
          ))}

          {/* Month Day Cells */}
          {Array.from({ length: daysCount }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${currentYear}-${pad2(currentMonth + 1)}-${pad2(dayNum)}`;
            const isFuture = isAfter(dateStr, today);
            const isToday = dateStr === today;
            const record = recordsMap.get(dateStr);

            // Weekly off check
            const dayOfWeek = new Date(currentYear, currentMonth, dayNum).getDay();
            const isWeeklyOff = profile.weeklyOffDays.includes(dayOfWeek);

            // Determine status
            let status: AttendanceStatus | 'unmarked' = 'unmarked';
            if (record) {
              status = record.status;
            } else if (isWeeklyOff) {
              status = 'holiday';
            }

            const isPastUnmarked = !isFuture && !record && !isWeeklyOff;

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isFuture}
                onClick={() => setSelectedDate(dateStr)}
                className={`min-h-[46px] w-full rounded-xl flex flex-col items-center justify-center relative p-1 transition-all ${
                  isFuture
                    ? 'text-stone-300 bg-transparent cursor-not-allowed opacity-60'
                    : isToday
                    ? 'ring-2 ring-[#2E7D4F] ring-offset-1 font-bold'
                    : 'active:scale-95'
                } ${
                  status === 'present'
                    ? 'bg-[#E8F5E9] text-[#2E7D4F] border border-[#2E7D4F]/30'
                    : status === 'absent'
                    ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/30'
                    : status === 'holiday'
                    ? 'bg-[#FEF3C7] text-[#B45309] border border-[#D97706]/30'
                    : isPastUnmarked
                    ? 'border border-dashed border-stone-300 bg-stone-50/70 text-stone-700'
                    : 'text-stone-800 hover:bg-stone-100'
                }`}
              >
                <span className="text-xs font-semibold leading-tight">{dayNum}</span>

                {/* Status indicator badge/dot */}
                <div className="mt-1 flex items-center justify-center h-2">
                  {status === 'present' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2E7D4F]" />
                  )}
                  {status === 'absent' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  )}
                  {status === 'holiday' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                  )}
                  {isPastUnmarked && (
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-3 border-t border-stone-100 text-[11px] text-stone-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D4F]" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-stone-400" />
            <span>Unmarked</span>
          </div>
        </div>
      </div>

      {/* Attendance Bottom Sheet */}
      <AttendanceSheet
        isOpen={Boolean(selectedDate)}
        onClose={() => setSelectedDate(null)}
        dateStr={selectedDate}
        existingRecord={selectedDate ? recordsMap.get(selectedDate) || null : null}
        isWeeklyOffDefault={
          selectedDate ? profile.weeklyOffDays.includes(new Date(selectedDate).getDay()) : false
        }
        cumulativeStats={selectedDateCumulativeStats}
        onMarkAttendance={(status) => {
          if (selectedDate) onMarkAttendance(selectedDate, status);
        }}
        onClearAttendance={() => {
          if (selectedDate) onClearAttendance(selectedDate);
        }}
      />
    </div>
  );
};
