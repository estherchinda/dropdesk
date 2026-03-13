'use client';

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X, CheckCircle, Loader2, Save } from 'lucide-react';
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Assignment } from '../types';

interface AssignmentFormProps {
  isCreating: boolean;
  editingAssignmentId: string | null;
  setIsCreating: (isCreating: boolean) => void;
  setEditingAssignmentId: (id: string | null) => void;
  
  // Create form state
  newTitle: string;
  setNewTitle: (title: string) => void;
  newDescription: string;
  setNewDescription: (desc: string) => void;
  newDeadline: string;
  setNewDeadline: (deadline: string) => void;
  newTotalScore: string;
  setNewTotalScore: (score: string) => void;
  isSubmitting: boolean;
  createdCode: string | null;
  setCreatedCode: (code: string | null) => void;
  handleCreateAssignment: (e: React.FormEvent) => Promise<void>;

  // Edit form state
  editTitle: string;
  setEditTitle: (title: string) => void;
  editDescription: string;
  setEditDescription: (desc: string) => void;
  editDeadline: string;
  setEditDeadline: (deadline: string) => void;
  editTotalScore: string;
  setEditTotalScore: (score: string) => void;
  isUpdating: boolean;
  handleUpdateAssignment: (id: string) => Promise<void>;
}

export function AssignmentForm({
  isCreating,
  editingAssignmentId,
  setIsCreating,
  setEditingAssignmentId,
  newTitle,
  setNewTitle,
  newDescription,
  setNewDescription,
  newDeadline,
  setNewDeadline,
  newTotalScore,
  setNewTotalScore,
  isSubmitting,
  createdCode,
  setCreatedCode,
  handleCreateAssignment,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editDeadline,
  setEditDeadline,
  editTotalScore,
  setEditTotalScore,
  isUpdating,
  handleUpdateAssignment
}: AssignmentFormProps) {
  if (isCreating) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Assignment</h2>
          <Button 
            onClick={() => { setIsCreating(false); setCreatedCode(null); }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {createdCode ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Assignment Created Successfully!</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Give this 4-digit code to your students so they can submit their work.</p>
            <div className="inline-block bg-white dark:bg-slate-900 border-2 border-green-300 dark:border-green-700 rounded-xl px-10 py-4 shadow-sm mb-6">
              <span className="text-5xl font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400">{createdCode}</span>
            </div>
            <div>
              <Button 
                onClick={() => { setIsCreating(false); setCreatedCode(null); }}
                className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-sm font-medium shadow-sm hover:opacity-90 transition"
              >
                Back to Assignments
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Assignment Title *</label>
              <Input 
                type="text" 
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Final Web Project"
                className="w-full px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Description</label>
              <RichTextEditor 
                content={newDescription}
                onChange={setNewDescription}
                placeholder="Instructions for the assignment..."
                className="w-full h-64"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
                <Input 
                  type="datetime-local" 
                  value={newDeadline}
                  onChange={e => setNewDeadline(e.target.value)}
                  className="w-full px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Score</label>
                <Input 
                  type="number" 
                  min="1"
                  value={newTotalScore}
                  onChange={e => setNewTotalScore(e.target.value)}
                  className="w-full px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white no-stepper outline-none"
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end space-x-3">
              <Button 
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  if (editingAssignmentId) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Assignment</h2>
          <Button 
            onClick={() => setEditingAssignmentId(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleUpdateAssignment(editingAssignmentId); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Assignment Title *</label>
            <Input 
              type="text" 
              required
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="e.g. Final Web Project"
              className="w-full px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Description</label>
            <RichTextEditor 
              content={editDescription}
              onChange={setEditDescription}
              placeholder="Instructions for the assignment..."
              className="w-full h-64"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
              <Input 
                type="datetime-local" 
                value={editDeadline}
                onChange={e => setEditDeadline(e.target.value)}
                className="w-full px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Score</label>
              <Input 
                type="number" 
                min="1"
                value={editTotalScore}
                onChange={e => setEditTotalScore(e.target.value)}
                className="w-full px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white no-stepper outline-none"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <Button 
              type="button"
              onClick={() => setEditingAssignmentId(null)}
              className="px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isUpdating || !editTitle.trim()}
              className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Update Assignment
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}
