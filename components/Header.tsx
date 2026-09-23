'use client';

import React from 'react';
import { StudentProfile } from '@/lib/types';
import { ChevronDown, BookOpen } from 'lucide-react';
import { PWAInstallBanner } from './PWAInstallBanner';

interface HeaderProps {
  currentProfile: StudentProfile | null;
  profilesCount: number;
  onOpenProfileSwitcher: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProfile,
  profilesCount,
  onOpenProfileSwitcher,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-stone-200/80 pt-safe px-4 pb-3">
      <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
        {/* Student Profile Switcher Trigger */}
        <button
          type="button"
          onClick={onOpenProfileSwitcher}
          className="flex items-center gap-2.5 text-left py-1 px-1.5 rounded-2xl hover:bg-stone-200/50 active:bg-stone-200 transition-colors group"
        >
          {/* Avatar / Photo */}
          <div className="w-10 h-10 rounded-full bg-[#E8F5E9] border border-[#2E7D4F]/30 overflow-hidden flex items-center justify-center shrink-0 text-[#2E7D4F] font-bold text-sm shadow-xs">
            {currentProfile?.photoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentProfile.photoUrl}
                alt={currentProfile.name}
                className="w-full h-full object-cover"
              />
            ) : currentProfile?.name ? (
              currentProfile.name.charAt(0).toUpperCase()
            ) : (
              <BookOpen className="w-5 h-5 text-[#2E7D4F]" />
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-stone-900 tracking-tight leading-tight">
                {currentProfile ? currentProfile.name : 'School Diary'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-transform" />
            </div>
            <span className="text-[11px] text-stone-500 font-medium leading-tight truncate max-w-[170px] sm:max-w-[220px]">
              {currentProfile
                ? `${currentProfile.grade} • ${currentProfile.school}`
                : 'Select or add profile'}
            </span>
          </div>
        </button>

        {/* Right action: Install PWA button */}
        <div className="flex items-center gap-2">
          <PWAInstallBanner />
        </div>
      </div>
    </header>
  );
};
