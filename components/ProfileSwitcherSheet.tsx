'use client';

import React from 'react';
import { BottomSheet } from './BottomSheet';
import { StudentProfile } from '@/lib/types';
import { Check, Plus, User } from 'lucide-react';

interface ProfileSwitcherSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: StudentProfile[];
  activeProfileId?: number;
  onSelectProfile: (id: number) => void;
  onAddNewProfile: () => void;
}

export const ProfileSwitcherSheet: React.FC<ProfileSwitcherSheetProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onAddNewProfile,
}) => {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Switch Student Profile"
      maxHeight="max-h-[85vh]"
    >
      <div className="flex flex-col gap-3 pb-3">
        <p className="text-xs text-stone-500">
          Attendance, fee payments, and exam marks are completely separate for each student profile.
        </p>

        {/* Profile List */}
        <div className="flex flex-col gap-2">
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfileId;

            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => {
                  if (profile.id) {
                    onSelectProfile(profile.id);
                    onClose();
                  }
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isActive
                    ? 'border-[#2E7D4F] bg-[#E8F5E9]/50 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300 active:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-stone-200 border border-stone-300 overflow-hidden flex items-center justify-center shrink-0">
                    {profile.photoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={profile.photoUrl}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-bold text-stone-700">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{profile.name}</h4>
                    <p className="text-xs text-stone-500">
                      {profile.grade}
                      {profile.section ? ` • Sec ${profile.section}` : ''}
                      {profile.rollNo ? ` • Roll ${profile.rollNo}` : ''}
                    </p>
                    <p className="text-[11px] text-stone-400 truncate max-w-[200px]">
                      {profile.school}
                    </p>
                  </div>
                </div>

                {isActive ? (
                  <div className="w-7 h-7 rounded-full bg-[#2E7D4F] text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-stone-400">Select</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add Profile button */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onAddNewProfile();
          }}
          className="mt-2 min-h-[48px] w-full rounded-2xl border-2 border-dashed border-stone-300 bg-white text-stone-700 font-bold text-xs flex items-center justify-center gap-2 hover:border-[#2E7D4F] hover:text-[#2E7D4F] active:bg-[#E8F5E9] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Another Student Profile</span>
        </button>
      </div>
    </BottomSheet>
  );
};
