'use client';

import React from 'react';
import { BottomSheet } from './BottomSheet';
import { AttendanceRecord, AttendanceStatus } from '@/lib/types';
import { formatDayName, formatDisplayDate } from '@/lib/date-utils';
import { Check, X, Coffee, Trash2 } from 'lucide-react';
import { AttendanceStats } from '@/lib/calculations';

interface AttendanceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string | null;
  existingRecord: AttendanceRecord | null;
  isWeeklyOffDefault: boolean;
  cumulativeStats: AttendanceStats | null;
  onMarkAttendance: (status: AttendanceStatus) => void;
  onClearAttendance: () => void;
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  isOpen,
  onClose,
  dateStr,
  existingRecord,
  isWeeklyOffDefault,
  cumulativeStats,
  onMarkAttendance,
  onClearAttendance,
}) => {
  if (!dateStr) return null;

  const currentStatus: AttendanceStatus | 'unmarked' = existingRecord
    ? existingRecord.status
    : isWeeklyOffDefault
    ? 'holiday'
    : 'unmarked';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance Status"
      maxHeight="max-h-[85vh]"
    >
      <div className="flex flex-col gap-5 pb-2">
        {/* Date header & cumulative stat */}
        <div className="rounded-2xl bg-white p-4 border border-stone-200 shadow-sm flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                {formatDayName(dateStr)}
              </p>
              <h3 className="text-xl font-bold text-stone-900">
                {formatDisplayDate(dateStr)}
              </h3>
            </div>

            {/* Status indicator */}
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  currentStatus === 'present'
                    ? 'bg-[#E8F5E9] text-[#2E7D4F]'
                    : currentStatus === 'absent'
                    ? 'bg-[#FEE2E2] text-[#DC2626]'
                    : currentStatus === 'holiday'
                    ? 'bg-[#FEF3C7] text-[#B45309]'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {currentStatus === 'present' && <Check className="w-3.5 h-3.5" />}
                {currentStatus === 'absent' && <X className="w-3.5 h-3.5" />}
                {currentStatus === 'holiday' && <Coffee className="w-3.5 h-3.5" />}
                {currentStatus === 'present'
                  ? 'Present'
                  : currentStatus === 'absent'
                  ? 'Absent'
                  : currentStatus === 'holiday'
                  ? isWeeklyOffDefault && !existingRecord
                    ? 'Holiday (Weekly off)'
                    : 'Holiday'
                  : 'Not Marked'}
              </span>
            </div>
          </div>

          {/* Cumulative Attendance up to this date */}
          {cumulativeStats && (
            <div className="mt-2 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
              <span>Cumulative session attendance up to this day:</span>
              <span className="font-bold text-stone-900 text-sm">
                {cumulativeStats.formattedPercentage}
                {cumulativeStats.percentage !== null && (
                  <span className="text-xs font-normal text-stone-500 ml-1">
                    ({cumulativeStats.present}/{cumulativeStats.present + cumulativeStats.absent} days)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 px-1">
            {existingRecord ? 'Change attendance to:' : 'Mark attendance as:'}
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {/* Present Button */}
            <button
              type="button"
              onClick={() => {
                onMarkAttendance('present');
                onClose();
              }}
              className={`min-h-[52px] rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-transform active:scale-[0.98] ${
                currentStatus === 'present'
                  ? 'bg-[#2E7D4F] text-white shadow-md shadow-[#2E7D4F]/30 ring-2 ring-[#2E7D4F]'
                  : 'bg-white border-2 border-stone-200 text-stone-800 hover:border-[#2E7D4F] hover:bg-[#E8F5E9]/30 active:bg-[#E8F5E9]'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  currentStatus === 'present' ? 'bg-white/20' : 'bg-[#E8F5E9] text-[#2E7D4F]'
                }`}
              >
                <Check className="w-4 h-4" />
              </div>
              <span>Present</span>
            </button>

            {/* Absent Button */}
            <button
              type="button"
              onClick={() => {
                onMarkAttendance('absent');
                onClose();
              }}
              className={`min-h-[52px] rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-transform active:scale-[0.98] ${
                currentStatus === 'absent'
                  ? 'bg-[#DC2626] text-white shadow-md shadow-[#DC2626]/30 ring-2 ring-[#DC2626]'
                  : 'bg-white border-2 border-stone-200 text-stone-800 hover:border-[#DC2626] hover:bg-[#FEE2E2]/30 active:bg-[#FEE2E2]'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  currentStatus === 'absent' ? 'bg-white/20' : 'bg-[#FEE2E2] text-[#DC2626]'
                }`}
              >
                <X className="w-4 h-4" />
              </div>
              <span>Absent</span>
            </button>

            {/* Holiday Button */}
            <button
              type="button"
              onClick={() => {
                onMarkAttendance('holiday');
                onClose();
              }}
              className={`min-h-[52px] rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-transform active:scale-[0.98] ${
                currentStatus === 'holiday'
                  ? 'bg-[#D97706] text-white shadow-md shadow-[#D97706]/30 ring-2 ring-[#D97706]'
                  : 'bg-white border-2 border-stone-200 text-stone-800 hover:border-[#D97706] hover:bg-[#FEF3C7]/30 active:bg-[#FEF3C7]'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  currentStatus === 'holiday' ? 'bg-white/20' : 'bg-[#FEF3C7] text-[#D97706]'
                }`}
              >
                <Coffee className="w-4 h-4" />
              </div>
              <span>Holiday</span>
            </button>
          </div>

          {/* Clear button if record exists */}
          {existingRecord && (
            <button
              type="button"
              onClick={() => {
                onClearAttendance();
                onClose();
              }}
              className="mt-2 min-h-[44px] flex items-center justify-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 active:bg-stone-200 rounded-xl transition-colors py-2"
            >
              <Trash2 className="w-4 h-4 text-stone-400" />
              <span>Clear custom marking for this day</span>
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
