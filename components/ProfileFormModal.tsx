'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BottomSheet } from './BottomSheet';
import { StudentProfile } from '@/lib/types';
import { DatePickerField } from './DatePickerField';
import { getTodayLocalDateString } from '@/lib/date-utils';
import { Camera, User, X } from 'lucide-react';

interface ProfileFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile?: StudentProfile | null;
  onSave: (profileData: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>, id?: number) => Promise<void>;
  isFirstProfile?: boolean;
}

const WEEK_DAYS = [
  { label: 'Sun', day: 0 },
  { label: 'Mon', day: 1 },
  { label: 'Tue', day: 2 },
  { label: 'Wed', day: 3 },
  { label: 'Thu', day: 4 },
  { label: 'Fri', day: 5 },
  { label: 'Sat', day: 6 },
];

const CURRENCIES = ['₹', '$', '€', '£', '¥', 'AED'];

export const ProfileFormModal: React.FC<ProfileFormModalProps> = ({
  isOpen,
  onClose,
  initialProfile,
  onSave,
  isFirstProfile = false,
}) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [school, setSchool] = useState('');
  const [sessionStart, setSessionStart] = useState('2026-04-01');
  const [sessionEnd, setSessionEnd] = useState('2027-03-31');
  const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([0]); // Default: Sunday
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState('₹');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name || '');
      setGrade(initialProfile.grade || '');
      setSection(initialProfile.section || '');
      setRollNo(initialProfile.rollNo || '');
      setSchool(initialProfile.school || '');
      setSessionStart(initialProfile.sessionStart || '2026-04-01');
      setSessionEnd(initialProfile.sessionEnd || '2027-03-31');
      setWeeklyOffDays(initialProfile.weeklyOffDays || [0]);
      setPhotoUrl(initialProfile.photoUrl);
      setCurrency(initialProfile.currency || '₹');
      setError('');
    } else {
      const curYear = new Date().getFullYear();
      setName('');
      setGrade('');
      setSection('');
      setRollNo('');
      setSchool('');
      setSessionStart(`${curYear}-04-01`);
      setSessionEnd(`${curYear + 1}-03-31`);
      setWeeklyOffDays([0]);
      setPhotoUrl(undefined);
      setCurrency('₹');
      setError('');
    }
  }, [initialProfile, isOpen]);

  const toggleDay = (day: number) => {
    setWeeklyOffDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) return prev; // Keep at least one weekly off
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image file size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      setPhotoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Student name is required.');
      return;
    }
    if (!grade.trim()) {
      setError('Class / Grade is required.');
      return;
    }
    if (!school.trim()) {
      setError('School name is required.');
      return;
    }
    if (!sessionStart || !sessionEnd) {
      setError('Academic session start and end dates are required.');
      return;
    }
    if (sessionStart > sessionEnd) {
      setError('Session end date cannot be earlier than session start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          name: name.trim(),
          grade: grade.trim(),
          section: section.trim() || undefined,
          rollNo: rollNo.trim() || undefined,
          school: school.trim(),
          sessionStart,
          sessionEnd,
          weeklyOffDays,
          photoUrl,
          currency: currency || '₹',
        },
        initialProfile?.id
      );
      onClose();
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        isFirstProfile
          ? 'Create Student Profile'
          : initialProfile
          ? 'Edit Student Profile'
          : 'Add Student Profile'
      }
      maxHeight="max-h-[92vh]"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-4">
        {error && (
          <div className="rounded-xl bg-[#FEE2E2] p-3 text-xs font-semibold text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Photo Upload Avatar */}
        <div className="flex items-center gap-4 py-1">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-stone-200 border-2 border-stone-300 overflow-hidden flex items-center justify-center text-stone-500">
              {photoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photoUrl}
                  alt={name || 'Student'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-stone-400" />
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#2E7D4F] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
              aria-label="Upload photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-bold text-stone-900">Student Photo</h4>
            <p className="text-xs text-stone-500">Optional profile picture or avatar</p>
            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl(undefined)}
                className="mt-1 text-xs font-semibold text-[#DC2626] hover:underline"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        {/* Student Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Student Full Name <span className="text-[#DC2626]">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Aarav Sharma"
            className="w-full min-h-[48px] rounded-xl border border-stone-300 bg-white px-3.5 text-base font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-[#2E7D4F] focus:outline-none focus:ring-2 focus:ring-[#2E7D4F]/20"
          />
        </div>

        {/* Class/Grade & Section & Roll No */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Grade*
            </label>
            <input
              type="text"
              required
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="10th"
              className="w-full min-h-[48px] rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-[#2E7D4F] focus:outline-none"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Section
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="A"
              className="w-full min-h-[48px] rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-[#2E7D4F] focus:outline-none"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Roll No.
            </label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="24"
              className="w-full min-h-[48px] rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-[#2E7D4F] focus:outline-none"
            />
          </div>
        </div>

        {/* School Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            School Name <span className="text-[#DC2626]">*</span>
          </label>
          <input
            type="text"
            required
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="e.g. Delhi Public School"
            className="w-full min-h-[48px] rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-[#2E7D4F] focus:outline-none"
          />
        </div>

        {/* Academic Session Dates */}
        <div className="grid grid-cols-2 gap-3">
          <DatePickerField
            label="Session Start"
            value={sessionStart}
            onChange={(d) => setSessionStart(d)}
            required
          />
          <DatePickerField
            label="Session End"
            value={sessionEnd}
            onChange={(d) => setSessionEnd(d)}
            required
          />
        </div>

        {/* Weekly Off Days */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Weekly Off Day(s) (Default: Sunday)
          </label>
          <div className="grid grid-cols-7 gap-1">
            {WEEK_DAYS.map((w) => {
              const isSelected = weeklyOffDays.includes(w.day);
              return (
                <button
                  key={w.day}
                  type="button"
                  onClick={() => toggleDay(w.day)}
                  className={`h-11 rounded-xl text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-[#D97706] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {w.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Currency Symbol */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Currency Symbol (Default: ₹)
          </label>
          <div className="flex items-center gap-2">
            {CURRENCIES.map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => setCurrency(sym)}
                className={`min-h-[44px] flex-1 rounded-xl text-sm font-bold border transition-all ${
                  currency === sym
                    ? 'border-[#2E7D4F] bg-[#E8F5E9] text-[#2E7D4F]'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                {sym}
              </button>
            ))}
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="Other"
              className="w-16 min-h-[44px] rounded-xl border border-stone-300 bg-white text-center text-sm font-bold text-stone-900 focus:border-[#2E7D4F] focus:outline-none"
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[50px] rounded-2xl bg-[#2E7D4F] font-bold text-white shadow-md shadow-[#2E7D4F]/30 hover:bg-[#225C3A] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isFirstProfile
              ? 'Start Using School Diary'
              : initialProfile
              ? 'Save Profile Changes'
              : 'Add Student Profile'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
