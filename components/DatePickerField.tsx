'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import {
  formatDisplayDate,
  formatMonthYear,
  getDaysInMonth,
  getFirstDayOfMonth,
  getTodayLocalDateString,
  pad2,
} from '@/lib/date-utils';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  helperText?: string;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  required,
  minDate,
  maxDate,
  placeholder = 'Select date',
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Current view year & month index in the picker
  const initialDate = value ? value.split('-').map(Number) : null;
  const today = getTodayLocalDateString();
  const [currentYear, setCurrentYear] = useState(initialDate ? initialDate[0] : new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(
    initialDate ? (initialDate[1] || 1) - 1 : new Date().getMonth()
  );

  const openPicker = () => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      setCurrentYear(y);
      setCurrentMonth((m || 1) - 1);
    }
    setIsOpen(true);
  };

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

  const selectDate = (dayNumber: number) => {
    const formatted = `${currentYear}-${pad2(currentMonth + 1)}-${pad2(dayNumber)}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
        {label} {required && <span className="text-[#DC2626]">*</span>}
      </label>

      {/* Button trigger */}
      <button
        type="button"
        onClick={openPicker}
        className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-left text-sm font-medium text-stone-800 flex items-center justify-between hover:border-stone-400 active:bg-stone-50 transition-colors focus:ring-2 focus:ring-[#2E7D4F]"
      >
        <span className={value ? 'text-stone-900' : 'text-stone-400'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 text-[#2E7D4F]" />
      </button>

      {helperText && <p className="mt-1 text-xs text-stone-500">{helperText}</p>}

      {/* Date Picker Bottom Sheet (Strictly No Blue!) */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={label || 'Select Date'}
        maxHeight="max-h-[85vh]"
      >
        <div className="flex flex-col gap-4">
          {/* Quick presets */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onChange(today);
                setIsOpen(false);
              }}
              className="flex-1 min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const yDate = new Date();
                yDate.setDate(yDate.getDate() - 1);
                const y = yDate.getFullYear();
                const m = pad2(yDate.getMonth() + 1);
                const d = pad2(yDate.getDate());
                onChange(`${y}-${m}-${d}`);
                setIsOpen(false);
              }}
              className="flex-1 min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 transition-colors"
            >
              Yesterday
            </button>
          </div>

          {/* Month & Year Navigation */}
          <div className="flex items-center justify-between px-2 py-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-stone-700 hover:bg-stone-200 active:bg-stone-300 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <span className="text-sm font-bold text-stone-900">
              {formatMonthYear(currentYear, currentMonth)}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-stone-700 hover:bg-stone-200 active:bg-stone-300 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span
                key={i}
                className={`text-xs font-semibold py-1 ${i === 0 ? 'text-[#D97706]' : 'text-stone-500'}`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank leading slots */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`blank-${i}`} className="h-11" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysCount }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${pad2(currentMonth + 1)}-${pad2(day)}`;
              const isSelected = value === dateStr;
              const isToday = today === dateStr;
              const isFuture = maxDate && dateStr > maxDate;
              const isBeforeMin = minDate && dateStr < minDate;
              const isDisabled = Boolean(isFuture || isBeforeMin);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDate(day)}
                  className={`h-11 w-full rounded-xl text-sm font-medium flex flex-col items-center justify-center transition-all ${
                    isDisabled
                      ? 'text-stone-300 bg-transparent cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#2E7D4F] text-white font-bold shadow-md shadow-emerald-900/20'
                      : isToday
                      ? 'border border-[#2E7D4F] text-[#2E7D4F] font-bold bg-[#E8F5E9]/50'
                      : 'text-stone-800 hover:bg-stone-200/70 active:bg-stone-300/70'
                  }`}
                >
                  <span>{day}</span>
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
