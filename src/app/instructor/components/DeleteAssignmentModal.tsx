'use client';

import { Button } from "@/components/ui/Button";
import { Loader2, Trash2 } from 'lucide-react';
import { Assignment } from '../types';

interface DeleteAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentToDelete: Assignment | null;
  isDeletingId: string | null;
  confirmDeleteAssignment: () => Promise<void>;
}

export function DeleteAssignmentModal({
  isOpen,
  onClose,
  assignmentToDelete,
  isDeletingId,
  confirmDeleteAssignment
}: DeleteAssignmentModalProps) {
  if (!isOpen || !assignmentToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Assignment</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{assignmentToDelete.title}"</span>? This action cannot be undone and will remove all associated submissions.
          </p>
          <div className="flex justify-center space-x-3">
            <Button
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
              disabled={!!isDeletingId}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteAssignment}
              disabled={!!isDeletingId}
              className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-full text-sm font-medium shadow-md hover:bg-red-700 disabled:opacity-50 transition"
            >
              {isDeletingId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
