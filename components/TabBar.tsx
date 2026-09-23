'use client';

import React from 'react';
import { CalendarDays, Receipt, Award, User } from 'lucide-react';
import { TabType } from '@/lib/types';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'attendance', label: 'Attendance', icon: CalendarDays },
  { id: 'fees', label: 'Fees', icon: Receipt },
  { id: 'marks', label: 'Marks', icon: Award },
  { id: 'profile', label: 'Profile', icon: User },
];

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-stone-200 pb-safe shadow-lg shadow-stone-900/5"
      aria-label="Bottom Navigation"
    >
      <div className="grid grid-cols-4 max-w-lg mx-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[56px] py-1.5 flex flex-col items-center justify-center gap-1 transition-colors relative active:bg-stone-200/40 ${
                isActive ? 'text-[#2E7D4F]' : 'text-stone-500 hover:text-stone-800'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active top indicator pill */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 rounded-b-full bg-[#2E7D4F]" />
              )}

              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span
                className={`text-[11px] leading-tight tracking-tight ${
                  isActive ? 'font-bold text-[#2E7D4F]' : 'font-medium text-stone-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
