'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Award, ChevronRight, BarChart2, Calendar } from 'lucide-react';
import { ExamRecord, SubjectMark, StudentProfile } from '@/lib/types';
import { formatDisplayDate } from '@/lib/date-utils';
import { calculateExamPercentage, calculateOverallExamStats } from '@/lib/calculations';
import { ExamModal } from './ExamModal';
import { CompareModal } from './CompareModal';

interface MarksTabProps {
  profile: StudentProfile;
  exams: ExamRecord[];
  suggestedSubjects: string[];
  onAddExam: (exam: { name: string; date: string; subjects: SubjectMark[] }) => Promise<void>;
  onUpdateExam: (exam: { name: string; date: string; subjects: SubjectMark[]; id?: number }) => Promise<void>;
  onDeleteExam: (id: number) => Promise<void>;
}

export const MarksTab: React.FC<MarksTabProps> = ({
  profile,
  exams,
  suggestedSubjects,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedExamForEdit, setSelectedExamForEdit] = useState<ExamRecord | null>(null);
  // Expanded exam for inline bar chart view
  const [expandedExamId, setExpandedExamId] = useState<number | null>(null);

  // Sort exams newest first
  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [exams]);

  // Overall session exam stats
  const overallStats = useMemo(() => {
    return calculateOverallExamStats(exams);
  }, [exams]);

  const handleOpenAdd = () => {
    setSelectedExamForEdit(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (exam: ExamRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedExamForEdit(exam);
    setIsAddModalOpen(true);
  };

  const handleToggleExpand = (id: number) => {
    setExpandedExamId((prev) => (prev === id ? null : id));
  };

  const handleSaveExam = async (data: {
    name: string;
    date: string;
    subjects: SubjectMark[];
    id?: number;
  }) => {
    if (data.id) {
      await onUpdateExam(data);
    } else {
      await onAddExam(data);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Overall Performance Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#2E7D4F] to-[#24633E] text-white p-5 shadow-lg shadow-[#2E7D4F]/20 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="flex items-center justify-between text-white/80 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider">
            Overall Academic Average
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/15">
            {overallStats.examCount} {overallStats.examCount === 1 ? 'Exam' : 'Exams'}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-black tracking-tight">
            {overallStats.formattedPercentage}
          </span>
          {overallStats.percentage !== null && (
            <span className="text-xs font-medium text-white/80">
              ({overallStats.totalObtained} / {overallStats.totalMax} total marks)
            </span>
          )}
        </div>

        {/* Action button: Compare mode if 2 or more exams */}
        <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between">
          <span className="text-xs text-white/80">Student: {profile.name}</span>

          {exams.length >= 2 && (
            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all backdrop-blur-xs"
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#FEF3C7]" />
              <span>Compare Exams</span>
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">
          Exam Records
        </h3>
        <span className="text-xs text-stone-500">
          {sortedExams.length} {sortedExams.length === 1 ? 'exam' : 'exams'}
        </span>
      </div>

      {/* Exam List or Empty State */}
      {sortedExams.length === 0 ? (
        <div className="rounded-2xl bg-white border border-stone-200/90 p-8 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] text-[#2E7D4F] flex items-center justify-center mb-3">
            <Award className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-stone-800 mb-1">No exam marks added yet</h4>
          <p className="text-xs text-stone-500 max-w-xs mb-5">
            Record unit tests, mid-terms, and annual exams for {profile.name} to visualize subject performance.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#2E7D4F] text-white text-xs font-bold shadow-md shadow-[#2E7D4F]/20 hover:bg-[#225C3A] active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Record first exam</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedExams.map((exam) => {
            const stats = calculateExamPercentage(exam.subjects);
            const isExpanded = expandedExamId === exam.id;

            return (
              <div
                key={exam.id}
                className="rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-sm transition-all"
              >
                {/* Header tap toggles expansion */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => exam.id && handleToggleExpand(exam.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      exam.id && handleToggleExpand(exam.id);
                    }
                  }}
                  className="w-full text-left p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#2E7D4F] flex items-center justify-center font-bold shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-stone-900">{exam.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          {formatDisplayDate(exam.date)}
                        </span>
                        <span>•</span>
                        <span>{exam.subjects.length} subjects</span>
                      </div>
                    </div>
                  </div>

                  {/* Percentage score badge */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-base font-black text-[#2E7D4F]">
                        {stats.formattedPercentage}
                      </span>
                      <p className="text-[11px] text-stone-500 font-medium">
                        {stats.totalObtained} / {stats.totalMax}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-stone-400 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded View: Subject Bar Chart & Edit button */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-stone-100 bg-[#FAF7F2]/40 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                        Subject Marks Breakdown
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(exam, e)}
                        className="text-xs font-bold text-[#2E7D4F] hover:underline px-2 py-1 rounded-lg hover:bg-stone-100"
                      >
                        Edit Exam
                      </button>
                    </div>

                    {/* Bar chart with one bar per subject (marks obtained with lighter background for max marks) */}
                    <div className="flex flex-col gap-2.5">
                      {exam.subjects.map((sub, sIdx) => {
                        const obtained = Number(sub.obtained) || 0;
                        const max = Number(sub.maxMarks) || 100;
                        const pct = max > 0 ? Math.round((obtained / max) * 1000) / 10 : 0;

                        return (
                          <div key={sIdx} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                              <span>{sub.name}</span>
                              <span className="text-stone-600 font-bold">
                                {obtained} / {max} <span className="text-stone-400">({pct}%)</span>
                              </span>
                            </div>

                            {/* Bar container: lighter background for max marks */}
                            <div className="h-6 w-full rounded-lg bg-[#E6DFD5] relative overflow-hidden flex items-center">
                              {/* Filled bar for obtained marks */}
                              <div
                                className="h-full bg-[#2E7D4F] rounded-lg transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, Math.max(0, pct))}%`,
                                }}
                              />
                              {/* Value label on the bar */}
                              <span className="absolute left-2.5 text-[11px] font-bold text-white drop-shadow-xs pointer-events-none">
                                {obtained} marks
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={handleOpenAdd}
        className="fixed right-5 bottom-20 z-30 h-14 w-14 rounded-full bg-[#2E7D4F] text-white shadow-xl shadow-[#2E7D4F]/40 flex items-center justify-center hover:bg-[#225C3A] active:scale-95 transition-all"
        aria-label="Add exam"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Exam Modal for Add/Edit */}
      <ExamModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        profile={profile}
        initialExam={selectedExamForEdit}
        suggestedSubjects={suggestedSubjects}
        onSave={handleSaveExam}
        onDelete={onDeleteExam}
      />

      {/* Compare Modal */}
      {exams.length >= 2 && (
        <CompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          exams={exams}
        />
      )}
    </div>
  );
};
