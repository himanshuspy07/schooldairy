'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db, getRecentSubjectNames } from '@/lib/db';
import {
  AttendanceRecord,
  AttendanceStatus,
  ExamRecord,
  FeePayment,
  StudentProfile,
  SubjectMark,
  TabType,
} from '@/lib/types';
import { getTodayLocalDateString } from '@/lib/date-utils';
import { Header } from '@/components/Header';
import { TabBar } from '@/components/TabBar';
import { AttendanceTab } from '@/components/AttendanceTab';
import { FeesTab } from '@/components/FeesTab';
import { MarksTab } from '@/components/MarksTab';
import { ProfileTab } from '@/components/ProfileTab';
import { ProfileSwitcherSheet } from '@/components/ProfileSwitcherSheet';
import { ProfileFormModal } from '@/components/ProfileFormModal';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { BookOpen, Plus, UserPlus } from 'lucide-react';

export default function Home() {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('attendance');

  // Active student data
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeePayment[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [suggestedSubjects, setSuggestedSubjects] = useState<string[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileSwitcherOpen, setIsProfileSwitcherOpen] = useState(false);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<StudentProfile | null>(null);

  const todayStr = getTodayLocalDateString();

  // Load all profiles on startup
  const loadProfiles = useCallback(async () => {
    try {
      const allProfiles = await db.profiles.toArray();
      setProfiles(allProfiles);

      if (allProfiles.length > 0) {
        // Retrieve saved active profile ID or fall back to the first
        const savedIdStr = localStorage.getItem('school_diary_active_profile');
        const savedId = savedIdStr ? parseInt(savedIdStr, 10) : null;
        const exists = allProfiles.some((p) => p.id === savedId);

        if (exists && savedId) {
          setActiveProfileId(savedId);
        } else {
          setActiveProfileId(allProfiles[0].id!);
          localStorage.setItem('school_diary_active_profile', allProfiles[0].id!.toString());
        }
      } else {
        setActiveProfileId(null);
        // Show create profile modal on first launch
        setIsProfileFormOpen(true);
      }
    } catch (e) {
      console.error('Failed to load profiles from IndexedDB:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Load student records whenever activeProfileId changes
  const loadActiveStudentData = useCallback(async (studentId: number) => {
    try {
      const [studentAttendance, studentFees, studentExams, recentSubjects] = await Promise.all([
        db.attendance.where('studentId').equals(studentId).toArray(),
        db.fees.where('studentId').equals(studentId).toArray(),
        db.exams.where('studentId').equals(studentId).toArray(),
        getRecentSubjectNames(studentId),
      ]);

      setAttendance(studentAttendance);
      setFees(studentFees);
      setExams(studentExams);
      setSuggestedSubjects(recentSubjects);
    } catch (err) {
      console.error('Failed to load student data:', err);
    }
  }, []);

  useEffect(() => {
    if (activeProfileId) {
      loadActiveStudentData(activeProfileId);
    } else {
      setAttendance([]);
      setFees([]);
      setExams([]);
      setSuggestedSubjects([]);
    }
  }, [activeProfileId, loadActiveStudentData]);

  // Active profile reference
  const currentProfile = profiles.find((p) => p.id === activeProfileId) || null;

  // Profile Switching handler
  const handleSelectProfile = (id: number) => {
    setActiveProfileId(id);
    localStorage.setItem('school_diary_active_profile', id.toString());
  };

  // Attendance Actions
  const handleMarkAttendance = async (date: string, status: AttendanceStatus) => {
    if (!activeProfileId) return;

    // Check if record exists
    const existing = await db.attendance
      .where('[studentId+date]')
      .equals([activeProfileId, date])
      .first();

    if (existing && existing.id) {
      await db.attendance.update(existing.id, { status });
    } else {
      await db.attendance.add({
        studentId: activeProfileId,
        date,
        status,
        createdAt: Date.now(),
      });
    }

    await loadActiveStudentData(activeProfileId);
  };

  const handleClearAttendance = async (date: string) => {
    if (!activeProfileId) return;

    const existing = await db.attendance
      .where('[studentId+date]')
      .equals([activeProfileId, date])
      .first();

    if (existing && existing.id) {
      await db.attendance.delete(existing.id);
      await loadActiveStudentData(activeProfileId);
    }
  };

  // Fees Actions
  const handleAddPayment = async (payment: { amount: number; date: string; note?: string }) => {
    if (!activeProfileId) return;
    await db.fees.add({
      studentId: activeProfileId,
      amount: payment.amount,
      date: payment.date,
      note: payment.note,
      createdAt: Date.now(),
    });
    await loadActiveStudentData(activeProfileId);
  };

  const handleUpdatePayment = async (payment: {
    amount: number;
    date: string;
    note?: string;
    id?: number;
  }) => {
    if (!payment.id) return;
    await db.fees.update(payment.id, {
      amount: payment.amount,
      date: payment.date,
      note: payment.note,
    });
    if (activeProfileId) {
      await loadActiveStudentData(activeProfileId);
    }
  };

  const handleDeletePayment = async (id: number) => {
    await db.fees.delete(id);
    if (activeProfileId) {
      await loadActiveStudentData(activeProfileId);
    }
  };

  // Exams Actions
  const handleAddExam = async (exam: {
    name: string;
    date: string;
    subjects: SubjectMark[];
  }) => {
    if (!activeProfileId) return;
    await db.exams.add({
      studentId: activeProfileId,
      name: exam.name,
      date: exam.date,
      subjects: exam.subjects,
      createdAt: Date.now(),
    });
    await loadActiveStudentData(activeProfileId);
  };

  const handleUpdateExam = async (exam: {
    name: string;
    date: string;
    subjects: SubjectMark[];
    id?: number;
  }) => {
    if (!exam.id) return;
    await db.exams.update(exam.id, {
      name: exam.name,
      date: exam.date,
      subjects: exam.subjects,
    });
    if (activeProfileId) {
      await loadActiveStudentData(activeProfileId);
    }
  };

  const handleDeleteExam = async (id: number) => {
    await db.exams.delete(id);
    if (activeProfileId) {
      await loadActiveStudentData(activeProfileId);
    }
  };

  // Profile Create / Edit
  const handleSaveProfile = async (
    profileData: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>,
    id?: number
  ) => {
    if (id) {
      await db.profiles.update(id, {
        ...profileData,
        updatedAt: Date.now(),
      });
    } else {
      const newId = await db.profiles.add({
        ...profileData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setActiveProfileId(Number(newId));
      localStorage.setItem('school_diary_active_profile', newId.toString());
      // Promptly open attendance tab for the new student
      setActiveTab('attendance');
    }

    const updatedProfiles = await db.profiles.toArray();
    setProfiles(updatedProfiles);
    setEditingProfile(null);
  };

  // Profile Delete
  const handleDeleteProfile = async (id: number) => {
    // Delete profile and cascade delete its attendance, fees, exams
    await db.transaction('rw', [db.profiles, db.attendance, db.fees, db.exams], async () => {
      await db.profiles.delete(id);
      await db.attendance.where('studentId').equals(id).delete();
      await db.fees.where('studentId').equals(id).delete();
      await db.exams.where('studentId').equals(id).delete();
    });

    const remaining = await db.profiles.toArray();
    setProfiles(remaining);

    if (remaining.length > 0) {
      const nextActive = remaining[0].id!;
      setActiveProfileId(nextActive);
      localStorage.setItem('school_diary_active_profile', nextActive.toString());
    } else {
      setActiveProfileId(null);
      localStorage.removeItem('school_diary_active_profile');
      setIsProfileFormOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#2E7D4F] flex items-center justify-center">
            <BookOpen className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-xs font-semibold text-stone-600">Opening School Diary...</span>
        </div>
      </div>
    );
  }

  // First launch or no profiles state
  if (profiles.length === 0 || !currentProfile) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center px-5 py-8 max-w-lg mx-auto">
        <div className="rounded-3xl bg-white border border-stone-200 p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#E8F5E9] border border-[#2E7D4F]/30 text-[#2E7D4F] flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight mb-2">
            Welcome to School Diary
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed max-w-xs mb-6">
            A private, fast, offline student diary to track your daily attendance, fee payments, and exam marks.
          </p>

          <button
            type="button"
            onClick={() => {
              setEditingProfile(null);
              setIsProfileFormOpen(true);
            }}
            className="min-h-[50px] w-full rounded-2xl bg-[#2E7D4F] text-white font-bold text-sm shadow-md shadow-[#2E7D4F]/30 hover:bg-[#225C3A] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Student Profile</span>
          </button>
        </div>

        {/* Profile Creation Modal */}
        <ProfileFormModal
          isOpen={isProfileFormOpen}
          onClose={() => setIsProfileFormOpen(false)}
          initialProfile={null}
          onSave={handleSaveProfile}
          isFirstProfile={true}
        />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] flex flex-col selection:bg-[#C8E6C9] selection:text-[#144626]">
      {/* Offline Status indicator banner */}
      <OfflineIndicator />

      {/* Mobile Top Header */}
      <Header
        currentProfile={currentProfile}
        profilesCount={profiles.length}
        onOpenProfileSwitcher={() => setIsProfileSwitcherOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-4">
        {activeTab === 'attendance' && (
          <AttendanceTab
            profile={currentProfile}
            records={attendance}
            onMarkAttendance={handleMarkAttendance}
            onClearAttendance={handleClearAttendance}
          />
        )}

        {activeTab === 'fees' && (
          <FeesTab
            profile={currentProfile}
            payments={fees}
            onAddPayment={handleAddPayment}
            onUpdatePayment={handleUpdatePayment}
            onDeletePayment={handleDeletePayment}
          />
        )}

        {activeTab === 'marks' && (
          <MarksTab
            profile={currentProfile}
            exams={exams}
            suggestedSubjects={suggestedSubjects}
            onAddExam={handleAddExam}
            onUpdateExam={handleUpdateExam}
            onDeleteExam={handleDeleteExam}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            profile={currentProfile}
            profiles={profiles}
            attendance={attendance}
            fees={fees}
            exams={exams}
            todayStr={todayStr}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onEditProfile={(p) => {
              setEditingProfile(p);
              setIsProfileFormOpen(true);
            }}
            onDeleteProfile={handleDeleteProfile}
            onAddNewProfile={() => {
              setEditingProfile(null);
              setIsProfileFormOpen(true);
            }}
            onDataRestored={loadProfiles}
          />
        )}
      </main>

      {/* Fixed Bottom Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Profile Switcher Bottom Sheet */}
      <ProfileSwitcherSheet
        isOpen={isProfileSwitcherOpen}
        onClose={() => setIsProfileSwitcherOpen(false)}
        profiles={profiles}
        activeProfileId={activeProfileId || undefined}
        onSelectProfile={handleSelectProfile}
        onAddNewProfile={() => {
          setEditingProfile(null);
          setIsProfileFormOpen(true);
        }}
      />

      {/* Profile Form Modal (Create / Edit) */}
      <ProfileFormModal
        isOpen={isProfileFormOpen}
        onClose={() => {
          setIsProfileFormOpen(false);
          setEditingProfile(null);
        }}
        initialProfile={editingProfile}
        onSave={handleSaveProfile}
        isFirstProfile={profiles.length === 0}
      />
    </div>
  );
}
