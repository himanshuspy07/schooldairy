'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Calendar,
  Wallet,
  Award,
  Download,
  Upload,
  HardDrive,
  Edit,
  Trash2,
  Plus,
  School,
  Hash,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { AttendanceRecord, ExamRecord, FeePayment, StudentProfile, TabType } from '@/lib/types';
import { formatDisplayDate } from '@/lib/date-utils';
import {
  calculateAttendanceForRange,
  calculateExamPercentage,
  calculateFeeTotal,
} from '@/lib/calculations';
import {
  exportBackupData,
  importBackupData,
  isStoragePersisted,
  requestPersistentStorage,
} from '@/lib/db';

interface ProfileTabProps {
  profile: StudentProfile;
  profiles: StudentProfile[];
  attendance: AttendanceRecord[];
  fees: FeePayment[];
  exams: ExamRecord[];
  todayStr: string;
  onNavigateTab: (tab: TabType) => void;
  onEditProfile: (profile: StudentProfile) => void;
  onDeleteProfile: (id: number) => Promise<void>;
  onAddNewProfile: () => void;
  onDataRestored: () => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  profiles,
  attendance,
  fees,
  exams,
  todayStr,
  onNavigateTab,
  onEditProfile,
  onDeleteProfile,
  onAddNewProfile,
  onDataRestored,
}) => {
  const [persistedStatus, setPersistedStatus] = useState<boolean | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check and request persistence on mount
  useEffect(() => {
    async function checkPersist() {
      const persisted = await isStoragePersisted();
      if (!persisted) {
        const requested = await requestPersistentStorage();
        setPersistedStatus(requested);
      } else {
        setPersistedStatus(true);
      }
    }
    checkPersist();
  }, []);

  // 1. Session attendance %
  const attendanceStats = calculateAttendanceForRange(
    attendance,
    profile.weeklyOffDays,
    profile.sessionStart,
    profile.sessionEnd,
    todayStr
  );

  // 2. Total fees paid
  const feeStats = calculateFeeTotal(fees, profile.sessionStart, profile.sessionEnd);

  // 3. Latest exam %
  const sortedExams = [...exams].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  const latestExam = sortedExams[0] || null;
  const latestExamStats = latestExam ? calculateExamPercentage(latestExam.subjects) : null;

  // Export JSON backup
  const handleExportBackup = async () => {
    try {
      const data = await exportBackupData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school-diary-backup-${todayStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupMessage({ type: 'success', text: 'Backup exported successfully!' });
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (e) {
      setBackupMessage({ type: 'error', text: 'Failed to export backup.' });
    }
  };

  // Import JSON backup
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        const result = await importBackupData(json);
        setBackupMessage({ type: 'success', text: result.message });
        onDataRestored();
        setTimeout(() => setBackupMessage(null), 4000);
      } catch (err) {
        setBackupMessage({
          type: 'error',
          text: 'Invalid backup file or corrupted data format.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteCurrent = async () => {
    if (profile.id) {
      await onDeleteProfile(profile.id);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Backup notification */}
      {backupMessage && (
        <div
          className={`rounded-xl p-3 text-xs font-bold ${
            backupMessage.type === 'success'
              ? 'bg-[#E8F5E9] text-[#2E7D4F] border border-[#2E7D4F]/30'
              : 'bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/30'
          }`}
        >
          {backupMessage.text}
        </div>
      )}

      {/* Student Profile Card */}
      <div className="rounded-2xl bg-white border border-stone-200/90 p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-[#E8F5E9] border border-[#2E7D4F]/30 overflow-hidden flex items-center justify-center shrink-0">
              {profile.photoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={profile.photoUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black text-[#2E7D4F]">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-stone-900 leading-tight">
                {profile.name}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-0.5">
                <School className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-semibold">{profile.school}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                <span>Class {profile.grade}</span>
                {profile.section && <span>• Sec {profile.section}</span>}
                {profile.rollNo && <span>• Roll #{profile.rollNo}</span>}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onEditProfile(profile)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 transition-colors shrink-0"
            aria-label="Edit student profile"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>

        {/* Details breakdown */}
        <div className="pt-3 border-t border-stone-100 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-semibold uppercase text-stone-400 block">
              Academic Session
            </span>
            <span className="font-semibold text-stone-800">
              {formatDisplayDate(profile.sessionStart)} to {formatDisplayDate(profile.sessionEnd)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase text-stone-400 block">
              Weekly Off Day(s)
            </span>
            <span className="font-semibold text-stone-800">
              {profile.weeklyOffDays.map((d) => DAY_NAMES[d]).join(', ') || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Three Summary Tiles (Tap to open corresponding tab) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 px-1 mb-2">
          Academic Overview (Tap tile to view)
        </h3>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Tile 1: Session Attendance */}
          <button
            type="button"
            onClick={() => onNavigateTab('attendance')}
            className="rounded-2xl bg-white border border-stone-200 p-3.5 text-left shadow-xs hover:border-[#2E7D4F]/50 active:bg-stone-50 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-[#2E7D4F] mb-2">
              <Calendar className="w-4 h-4" />
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
            </div>
            <div>
              <span className="text-xl font-black text-stone-900 block leading-tight">
                {attendanceStats.formattedPercentage}
              </span>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mt-1 block">
                Attendance
              </span>
            </div>
          </button>

          {/* Tile 2: Total Fees Paid */}
          <button
            type="button"
            onClick={() => onNavigateTab('fees')}
            className="rounded-2xl bg-white border border-stone-200 p-3.5 text-left shadow-xs hover:border-[#2E7D4F]/50 active:bg-stone-50 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-[#2E7D4F] mb-2">
              <Wallet className="w-4 h-4" />
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
            </div>
            <div>
              <span className="text-lg font-black text-stone-900 block leading-tight truncate">
                {profile.currency || '₹'}
                {feeStats.totalPaid.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mt-1 block">
                Fees Paid
              </span>
            </div>
          </button>

          {/* Tile 3: Latest Exam % */}
          <button
            type="button"
            onClick={() => onNavigateTab('marks')}
            className="rounded-2xl bg-white border border-stone-200 p-3.5 text-left shadow-xs hover:border-[#2E7D4F]/50 active:bg-stone-50 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-[#2E7D4F] mb-2">
              <Award className="w-4 h-4" />
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
            </div>
            <div>
              <span className="text-xl font-black text-stone-900 block leading-tight">
                {latestExamStats ? latestExamStats.formattedPercentage : '—'}
              </span>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mt-1 block truncate">
                {latestExam ? latestExam.name : 'Latest Exam'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Storage & Backup Tools */}
      <div className="rounded-2xl bg-white border border-stone-200/90 p-4 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
          Data Backup & Storage
        </h3>

        {/* Offline Persistence Status */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#E8F5E9]/60 border border-[#2E7D4F]/20 text-xs">
          <ShieldCheck className="w-5 h-5 text-[#2E7D4F] shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-stone-900 block">Offline Local Storage</span>
            <span className="text-stone-600 text-[11px]">
              {persistedStatus
                ? 'Persistent storage active. Data is safely stored in this browser.'
                : 'Storage ready. All attendance, fees, and marks stay on this device.'}
            </span>
          </div>
        </div>

        {/* Export & Import Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="min-h-[46px] rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 active:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-[#2E7D4F]" />
            <span>Export Backup</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[46px] rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 active:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4 text-[#2E7D4F]" />
            <span>Import Backup</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      {/* Multi-Profile Management & Delete */}
      <div className="rounded-2xl bg-white border border-stone-200/90 p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
            Student Profiles ({profiles.length})
          </h3>
          <button
            type="button"
            onClick={onAddNewProfile}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#2E7D4F] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Profile</span>
          </button>
        </div>

        {/* Delete Profile button with confirmation */}
        <div className="pt-2 border-t border-stone-100">
          {confirmDelete ? (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#FEE2E2]/60 border border-[#DC2626]/30">
              <p className="text-xs font-bold text-[#DC2626]">
                Delete profile &quot;{profile.name}&quot; and all their attendance, fees, and exam records?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteCurrent}
                  className="flex-1 min-h-[42px] rounded-lg bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C]"
                >
                  Yes, Delete Profile
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 min-h-[42px] rounded-lg bg-stone-100 text-stone-800 text-xs font-semibold hover:bg-stone-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="min-h-[44px] w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2]/50 rounded-xl transition-colors py-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete {profile.name}&apos;s Profile</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
