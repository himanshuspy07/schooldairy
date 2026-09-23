'use client';

import React from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-4 right-4 z-50 flex items-center justify-center gap-2 rounded-xl bg-[#D97706] text-white px-3.5 py-2 text-xs font-bold shadow-lg transition-all animate-bounce">
      <WifiOff className="w-4 h-4" />
      <span>Offline Mode — All data is saved on your device</span>
    </div>
  );
};
