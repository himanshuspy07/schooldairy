'use client';

import React, { useState, useMemo } from 'react';
import { BottomSheet } from './BottomSheet';
import { ExamRecord } from '@/lib/types';
import { calculateExamPercentage } from '@/lib/calculations';
import { formatDisplayDate } from '@/lib/date-utils';
import { BarChart3, Check } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: ExamRecord[];
}

// Strict NO BLUE series colors:
// green, orange, rose, amber, olive, brown, crimson
const SERIES_COLORS = [
  '#2E7D4F', // Deep Green
  '#EA580C', // Vibrant Orange
  '#E11D48', // Warm Rose
  '#D97706', // Deep Amber
  '#65A30D', // Olive Green
  '#854D0E', // Earthy Brown
  '#991B1B', // Rich Crimson
];

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  exams,
}) => {
  // By default, select the first 2 or 3 exams (or all if <= 3)
  const [selectedExamIds, setSelectedExamIds] = useState<number[]>(() => {
    return exams.slice(0, 3).map((e) => e.id!).filter(Boolean);
  });

  const toggleExam = (id: number) => {
    setSelectedExamIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 2) return prev; // Keep at least 2 for comparison
        return prev.filter((i) => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Selected exams in chronological or chosen order
  const selectedExams = useMemo(() => {
    return exams.filter((e) => e.id && selectedExamIds.includes(e.id));
  }, [exams, selectedExamIds]);

  // Unique subjects across all selected exams
  const allSubjects = useMemo(() => {
    const subjectsMap = new Map<string, boolean>();
    for (const exam of selectedExams) {
      for (const s of exam.subjects) {
        if (s.name.trim()) {
          subjectsMap.set(s.name.trim(), true);
        }
      }
    }
    return Array.from(subjectsMap.keys());
  }, [selectedExams]);

  // Exam stats table data
  const examStats = useMemo(() => {
    return selectedExams.map((exam, index) => {
      const stats = calculateExamPercentage(exam.subjects);
      return {
        exam,
        color: SERIES_COLORS[index % SERIES_COLORS.length],
        ...stats,
      };
    });
  }, [selectedExams]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Exams"
      maxHeight="max-h-[92vh]"
    >
      <div className="flex flex-col gap-5 pb-4">
        {/* Selection selector */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 block mb-2">
            Select Exams to Compare (Select at least 2)
          </span>
          <div className="flex flex-wrap gap-2">
            {exams.map((exam) => {
              const isSelected = exam.id ? selectedExamIds.includes(exam.id) : false;
              const examIndex = selectedExams.findIndex((e) => e.id === exam.id);
              const color =
                examIndex >= 0 ? SERIES_COLORS[examIndex % SERIES_COLORS.length] : undefined;

              return (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => exam.id && toggleExam(exam.id)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                  style={isSelected ? { borderColor: color, color } : undefined}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                      isSelected ? 'text-white' : 'border border-stone-400'
                    }`}
                    style={isSelected ? { backgroundColor: color } : undefined}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span>{exam.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparison Summary Table */}
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Exam Summary Table
            </span>
            <span className="text-[11px] text-stone-500">
              {selectedExams.length} Exams Compared
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {examStats.map((item) => (
              <div key={item.exam.id} className="p-3.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-stone-900 truncate">
                      {item.exam.name}
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      {formatDisplayDate(item.exam.date)} • {item.totalObtained} / {item.totalMax}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className="text-base font-black px-2.5 py-0.5 rounded-lg"
                    style={{
                      color: item.color,
                      backgroundColor: `${item.color}15`,
                    }}
                  >
                    {item.formattedPercentage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grouped Bar Chart by Subject (Pure Responsive SVG - 100% theme consistent, no blue) */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#2E7D4F]" />
              <span>Subject-by-Subject Marks %</span>
            </h4>
            <span className="text-[10px] text-stone-500">Percentages normalized to 100%</span>
          </div>

          {/* Grouped Chart */}
          <div className="flex flex-col gap-4 pt-2">
            {allSubjects.map((subName) => (
              <div key={subName} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                  <span>{subName}</span>
                </div>

                {/* Bars for each exam */}
                <div className="flex flex-col gap-1.5">
                  {selectedExams.map((exam, idx) => {
                    const color = SERIES_COLORS[idx % SERIES_COLORS.length];
                    const sub = exam.subjects.find(
                      (s) => s.name.trim().toLowerCase() === subName.toLowerCase()
                    );
                    const obtained = sub ? Number(sub.obtained) : 0;
                    const max = sub ? Number(sub.maxMarks) : 100;
                    const pct = max > 0 ? Math.round((obtained / max) * 1000) / 10 : 0;

                    return (
                      <div key={exam.id} className="flex items-center gap-2">
                        {/* Legend dot */}
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />

                        {/* Bar track */}
                        <div className="flex-1 h-6 rounded-lg bg-stone-100 overflow-hidden relative flex items-center">
                          <div
                            className="h-full rounded-lg transition-all duration-500"
                            style={{
                              width: sub ? `${Math.min(100, Math.max(0, pct))}%` : '0%',
                              backgroundColor: color,
                            }}
                          />
                          {/* Inner / outer text label */}
                          <div className="absolute right-2 text-[11px] font-bold text-stone-700 pointer-events-none">
                            {sub ? `${obtained}/${max} (${pct}%)` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-stone-100 text-[11px] text-stone-600">
            {examStats.map((item) => (
              <div key={item.exam.id} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-stone-800">{item.exam.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
