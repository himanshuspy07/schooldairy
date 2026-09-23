'use client';

import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Download, Share, X } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E7D4F] text-white text-xs font-bold shadow-xs hover:bg-[#225C3A] active:scale-95 transition-all"
        aria-label="Install App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 active:bg-stone-100 transition-colors"
        >
          <Share className="w-3 h-3 text-[#2E7D4F]" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4">
            <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-stone-900">Install School Diary</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                To install on iPhone or iPad:
                <br />
                1. Tap the <strong>Share</strong> icon in Safari toolbar.
                <br />
                2. Scroll down and choose <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#2E7D4F] text-white text-xs font-bold hover:bg-[#225C3A] transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
