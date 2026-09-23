'use client';

import React, { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import { ExamRecord, SubjectMark, StudentProfile } from '@/lib/types';
import { DatePickerField } from './DatePickerField';
import { getTodayLocalDateString } from '@/lib/date-utils';
import { calculateExamPercentage, validateSubjectMark } from '@/lib/calculations';
import { Plus, Trash2, BookOpen } from 'lucide-react';

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  initialExam: ExamRecord | null;
  suggestedSubjects: string[];
  onSave: (exam: { name: string; date: string; subjects: SubjectMark[]; id?: number }) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export const ExamModal: React.FC<ExamModalProps> = ({
  isOpen,
  onClose,
  initialExam,
  suggestedSubjects,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState(getTodayLocalDateString());
  const [subjects, setSubjects] = useState<SubjectMark[]>([
    { name: 'English', obtained: 85, maxMarks: 100 },
    { name: 'Mathematics', obtained: 92, maxMarks: 100 },
  ]);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (initialExam) {
      setName(initialExam.name);
      setDate(initialExam.date);
      setSubjects(initialExam.subjects.map((s) => ({ ...s })));
      setConfirmDelete(false);
      setError('');
    } else {
      setName('');
      setDate(getTodayLocalDateString());
      // Default common subjects
      const initialSubs = suggestedSubjects.slice(0, 3).map((subName) => ({
        name: subName,
        obtained: 0,
        maxMarks: 100,
      }));
      setSubjects(
        initialSubs.length > 0
          ? initialSubs
          : [
              { name: 'English', obtained: 0, maxMarks: 100 },
              { name: 'Mathematics', obtained: 0, maxMarks: 100 },
            ]
      );
      setConfirmDelete(false);
      setError('');
    }
  }, [initialExam, isOpen, suggestedSubjects]);

  const handleSubjectChange = (
    index: number,
    field: keyof SubjectMark,
    val: string | number
  ) => {
    setSubjects((prev) => {
      const updated = [...prev];
      if (field === 'name') {
        updated[index] = { ...updated[index], name: String(val) };
      } else {
        const num = parseFloat(String(val));
        updated[index] = { ...updated[index], [field]: isNaN(num) ? 0 : num };
      }
      return updated;
    });
    setError('');
  };

  const addSubject = (subName?: string) => {
    setSubjects((prev) => [
      ...prev,
      { name: subName || '', obtained: 0, maxMarks: 100 },
    ]);
  };

  const removeSubject = (index: number) => {
    if (subjects.length <= 1) {
      setError('An exam must have at least one subject.');
      return;
    }
    setSubjects((prev) => prev.filter((_, i) => i !== index));
    setError('');
  };

  // Real-time calculated preview
  const previewStats = calculateExamPercentage(subjects);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter an exam title (e.g., Unit Test 1).');
      return;
    }
    if (!date) {
      setError('Please select an exam date.');
      return;
    }
    if (subjects.length === 0) {
      setError('Please add at least one subject.');
      return;
    }

    // Validate each subject
    for (let i = 0; i < subjects.length; i++) {
      const s = subjects[i];
      if (!s.name.trim()) {
        setError(`Subject #${i + 1} is missing a name.`);
        return;
      }
      const validation = validateSubjectMark(s.obtained, s.maxMarks);
      if (!validation.isValid) {
        setError(`${s.name || `Subject #${i + 1}`}: ${validation.error}`);
        return;
      }
    }

    try {
      await onSave({
        name: name.trim(),
        date,
        subjects: subjects.map((s) => ({
          name: s.name.trim(),
          obtained: Number(s.obtained) || 0,
          maxMarks: Number(s.maxMarks) || 100,
        })),
        id: initialExam?.id,
      });
      onClose();
    } catch (err) {
      setError('Failed to save exam marks. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (initialExam?.id && onDelete) {
      await onDelete(initialExam.id);
      onClose();
    }
  };

  // Filter suggested subjects not already added
  const currentSubNames = new Set(subjects.map((s) => s.name.trim().toLowerCase()));
  const quickSuggestions = suggestedSubjects.filter(
    (s) => !currentSubNames.has(s.trim().toLowerCase())
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={initialExam ? 'Edit Exam Marks' : 'Record Exam Marks'}
      maxHeight="max-h-[90vh]"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-4">
        {error && (
          <div className="rounded-xl bg-[#FEE2E2] p-3 text-xs font-semibold text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Exam Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Exam Name <span className="text-[#DC2626]">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Unit Test 1, Half-Yearly, Final Term"
            className="w-full min-h-[48px] rounded-xl border border-stone-300 bg-white px-3.5 text-base font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:border-[#2E7D4F] focus:outline-none focus:ring-2 focus:ring-[#2E7D4F]/20"
          />
        </div>

        {/* Exam Date */}
        <DatePickerField
          label="Exam Date"
          value={date}
          onChange={(newDate) => {
            setDate(newDate);
            setError('');
          }}
          required
        />

        {/* Quick Add Suggestions Chips */}
        {quickSuggestions.length > 0 && (
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              Quick Add Previous Subjects:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickSuggestions.slice(0, 5).map((subName) => (
                <button
                  key={subName}
                  type="button"
                  onClick={() => addSubject(subName)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-stone-200 bg-stone-100 hover:bg-[#E8F5E9] hover:border-[#2E7D4F]/40 active:bg-stone-200 text-xs font-medium text-stone-800 transition-colors"
                >
                  <Plus className="w-3 h-3 text-[#2E7D4F]" />
                  <span>{subName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subjects & Marks List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Subjects & Marks <span className="text-[#DC2626]">*</span>
            </label>
            <button
              type="button"
              onClick={() => addSubject()}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#2E7D4F] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {subjects.map((sub, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-stone-200 bg-white p-3 shadow-xs flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      placeholder="Subject Name (e.g. Mathematics)"
                      value={sub.name}
                      onChange={(e) => handleSubjectChange(idx, 'name', e.target.value)}
                      className="w-full text-sm font-semibold text-stone-900 border-b border-transparent focus:border-[#2E7D4F] focus:outline-none py-1 placeholder:text-stone-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSubject(idx)}
                    disabled={subjects.length <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-[#DC2626] hover:bg-stone-100 disabled:opacity-30 disabled:hover:text-stone-400 transition-colors"
                    aria-label="Remove subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                      Obtained Marks
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={sub.obtained === 0 ? '' : sub.obtained}
                      onChange={(e) => handleSubjectChange(idx, 'obtained', e.target.value)}
                      placeholder="0"
                      className="w-full min-h-[40px] px-2.5 rounded-lg border border-stone-200 bg-stone-50 text-sm font-bold text-stone-900 focus:bg-white focus:border-[#2E7D4F] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                      Max Marks
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      value={sub.maxMarks === 0 ? '' : sub.maxMarks}
                      onChange={(e) => handleSubjectChange(idx, 'maxMarks', e.target.value)}
                      placeholder="100"
                      className="w-full min-h-[40px] px-2.5 rounded-lg border border-stone-200 bg-stone-50 text-sm font-bold text-stone-900 focus:bg-white focus:border-[#2E7D4F] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Score Summary Preview */}
        <div className="rounded-xl bg-[#FAF7F2] border border-stone-200 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
              Exam Score Preview
            </span>
            <span className="text-base font-bold text-stone-900">
              {previewStats.totalObtained} / {previewStats.totalMax}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xl font-black text-[#2E7D4F]">
              {previewStats.formattedPercentage}
            </span>
          </div>
        </div>

        {/* Save & Delete Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="submit"
            className="w-full min-h-[50px] rounded-2xl bg-[#2E7D4F] font-bold text-white shadow-md shadow-[#2E7D4F]/30 hover:bg-[#225C3A] active:scale-[0.98] transition-all"
          >
            {initialExam ? 'Save Exam Marks' : 'Record Exam'}
          </button>

          {initialExam && onDelete && (
            <>
              {confirmDelete ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 min-h-[46px] rounded-xl bg-[#DC2626] font-bold text-white text-xs hover:bg-[#B91C1C] transition-colors"
                  >
                    Confirm Delete Exam
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 min-h-[46px] rounded-xl bg-stone-100 font-semibold text-stone-700 text-xs hover:bg-stone-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2]/60 rounded-xl transition-colors py-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete this exam</span>
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </BottomSheet>
  );
};
