'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Receipt, ChevronRight, Wallet } from 'lucide-react';
import { FeePayment, StudentProfile } from '@/lib/types';
import { formatDisplayDate } from '@/lib/date-utils';
import { calculateFeeTotal } from '@/lib/calculations';
import { FeeModal } from './FeeModal';

interface FeesTabProps {
  profile: StudentProfile;
  payments: FeePayment[];
  onAddPayment: (payment: { amount: number; date: string; note?: string }) => Promise<void>;
  onUpdatePayment: (payment: { amount: number; date: string; note?: string; id?: number }) => Promise<void>;
  onDeletePayment: (id: number) => Promise<void>;
}

export const FeesTab: React.FC<FeesTabProps> = ({
  profile,
  payments,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);

  // Sort payments newest first
  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [payments]);

  // Session totals
  const { totalPaid, count } = useMemo(() => {
    return calculateFeeTotal(payments, profile.sessionStart, profile.sessionEnd);
  }, [payments, profile.sessionStart, profile.sessionEnd]);

  const handleOpenAdd = () => {
    setSelectedPayment(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (payment: FeePayment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleSave = async (data: { amount: number; date: string; note?: string; id?: number }) => {
    if (data.id) {
      await onUpdatePayment(data);
    } else {
      await onAddPayment(data);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Session Summary Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#2E7D4F] to-[#225C3A] text-white p-5 shadow-lg shadow-[#2E7D4F]/20 relative overflow-hidden">
        {/* Subtle decorative motif */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="flex items-center justify-between text-white/80 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider">
            Total Session Fees Paid
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/15">
            {count} {count === 1 ? 'Receipt' : 'Receipts'}
          </span>
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-black tracking-tight">
            {profile.currency || '₹'}{' '}
            {totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/80">
          <span>Academic Session:</span>
          <span className="font-semibold text-white">
            {formatDisplayDate(profile.sessionStart)} – {formatDisplayDate(profile.sessionEnd)}
          </span>
        </div>
      </div>

      {/* Payment History List Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">
          Payment History
        </h3>
        <span className="text-xs text-stone-500">
          {sortedPayments.length} {sortedPayments.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {/* Payment items or Empty State */}
      {sortedPayments.length === 0 ? (
        <div className="rounded-2xl bg-white border border-stone-200/90 p-8 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] text-[#2E7D4F] flex items-center justify-center mb-3">
            <Receipt className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-stone-800 mb-1">No fee payments recorded</h4>
          <p className="text-xs text-stone-500 max-w-xs mb-5">
            Keep an accurate log of all school, tuition, bus, or book payments made for {profile.name}.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#2E7D4F] text-white text-xs font-bold shadow-md shadow-[#2E7D4F]/20 hover:bg-[#225C3A] active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add first payment</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sortedPayments.map((payment) => (
            <button
              key={payment.id}
              type="button"
              onClick={() => handleOpenEdit(payment)}
              className="w-full text-left rounded-2xl bg-white border border-stone-200 p-4 shadow-sm hover:border-[#2E7D4F]/40 active:bg-stone-50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#2E7D4F] flex items-center justify-center font-bold shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-900">
                    {profile.currency || '₹'}{' '}
                    {payment.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                    <span>{formatDisplayDate(payment.date)}</span>
                    {payment.note && (
                      <>
                        <span>•</span>
                        <span className="text-stone-700 font-medium truncate max-w-[140px] sm:max-w-[240px]">
                          {payment.note}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center text-stone-400 group-hover:text-stone-700 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Floating Action Button for Add Payment */}
      <button
        type="button"
        onClick={handleOpenAdd}
        className="fixed right-5 bottom-20 z-30 h-14 w-14 rounded-full bg-[#2E7D4F] text-white shadow-xl shadow-[#2E7D4F]/40 flex items-center justify-center hover:bg-[#225C3A] active:scale-95 transition-all"
        aria-label="Add fee payment"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add / Edit Fee Bottom Sheet */}
      <FeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={profile}
        initialPayment={selectedPayment}
        onSave={handleSave}
        onDelete={onDeletePayment}
      />
    </div>
  );
};
