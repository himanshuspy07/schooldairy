'use client';

import React, { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import { FeePayment, StudentProfile } from '@/lib/types';
import { DatePickerField } from './DatePickerField';
import { getTodayLocalDateString } from '@/lib/date-utils';
import { Trash2 } from 'lucide-react';

interface FeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  initialPayment: FeePayment | null;
  onSave: (payment: { amount: number; date: string; note?: string; id?: number }) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export const FeeModal: React.FC<FeeModalProps> = ({
  isOpen,
  onClose,
  profile,
  initialPayment,
  onSave,
  onDelete,
}) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayLocalDateString());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (initialPayment) {
      setAmount(initialPayment.amount.toString());
      setDate(initialPayment.date);
      setNote(initialPayment.note || '');
      setConfirmDelete(false);
      setError('');
    } else {
      setAmount('');
      setDate(getTodayLocalDateString());
      setNote('');
      setConfirmDelete(false);
      setError('');
    }
  }, [initialPayment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }
    if (!date) {
      setError('Please select a payment date.');
      return;
    }

    try {
      await onSave({
        amount: numAmount,
        date,
        note: note.trim() || undefined,
        id: initialPayment?.id,
      });
      onClose();
    } catch (err) {
      setError('Failed to save payment. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (initialPayment?.id && onDelete) {
      await onDelete(initialPayment.id);
      onClose();
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={initialPayment ? 'Edit Fee Payment' : 'Add Fee Payment'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
        {error && (
          <div className="rounded-xl bg-[#FEE2E2] p-3 text-xs font-semibold text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Amount Input with currency */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Amount Paid ({profile.currency || '₹'}) <span className="text-[#DC2626]">*</span>
          </label>
          <div className="relative rounded-xl border border-stone-300 bg-white focus-within:border-[#2E7D4F] focus-within:ring-2 focus-within:ring-[#2E7D4F]/20">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-stone-500">
              {profile.currency || '₹'}
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              placeholder="e.g. 5000"
              className="w-full min-h-[48px] rounded-xl pl-8 pr-3.5 text-base font-bold text-stone-900 placeholder:font-normal placeholder:text-stone-400 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Date Field with Custom Picker */}
        <DatePickerField
          label="Payment Date"
          value={date}
          onChange={(newDate) => {
            setDate(newDate);
            setError('');
          }}
          required
        />

        {/* Note / Remarks */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Note / Purpose (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Term 1 Tuition, Books, Transport"
            className="w-full min-h-[48px] rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#2E7D4F] focus:outline-none focus:ring-2 focus:ring-[#2E7D4F]/20"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="submit"
            className="w-full min-h-[50px] rounded-2xl bg-[#2E7D4F] font-bold text-white shadow-md shadow-[#2E7D4F]/30 hover:bg-[#225C3A] active:scale-[0.98] transition-all"
          >
            {initialPayment ? 'Save Changes' : 'Record Payment'}
          </button>

          {/* Delete Action if editing */}
          {initialPayment && onDelete && (
            <>
              {confirmDelete ? (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 min-h-[46px] rounded-xl bg-[#DC2626] font-bold text-white text-xs hover:bg-[#B91C1C] transition-colors"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 min-h-[46px] rounded-xl bg-stone-100 font-semibold text-stone-700 text-xs hover:bg-stone-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2]/60 rounded-xl transition-colors py-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete this payment</span>
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </BottomSheet>
  );
};
