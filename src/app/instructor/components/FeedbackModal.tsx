'use client';

import { Button } from "@/components/ui/Button";
import { X, Loader2, Save } from 'lucide-react';
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Submission } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSub: Submission | null;
  feedbackText: string;
  setFeedbackText: (text: string) => void;
  isSaving: boolean;
  handleSaveFeedback: () => Promise<void>;
}

export function FeedbackModal({
  isOpen,
  onClose,
  selectedSub,
  feedbackText,
  setFeedbackText,
  isSaving,
  handleSaveFeedback
}: FeedbackModalProps) {
  if (!isOpen || !selectedSub) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Instructor Feedback</h3>
          <Button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Student: <span className="text-slate-900 dark:text-white">{selectedSub.student_name}</span></p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Assignment: <span className="text-slate-900 dark:text-white">{selectedSub.assignment_title}</span></p>
          </div>
          <RichTextEditor
            content={feedbackText}
            onChange={setFeedbackText}
            placeholder="Write your feedback here..."
            className="w-full h-48"
          />
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end space-x-3">
          <Button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveFeedback}
            disabled={isSaving}
            className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
