'use client';

import { Button } from "@/components/ui/Button";
import { FileCode, Loader2, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Assignment, Submission } from '../types';
import { EmptyState } from "@/components/ui/EmptyState";

interface AssignmentListProps {
  assignments: Assignment[];
  loadingAssignments: boolean;
  isDeletingId: string | null;
  handleEditAssignmentClick: (assignment: Assignment) => void;
  handleDeleteClick: (assignment: Assignment) => void;
  submissions: Submission[];
}

export function AssignmentList({
  assignments,
  loadingAssignments,
  isDeletingId,
  handleEditAssignmentClick,
  handleDeleteClick,
  submissions
}: AssignmentListProps) {
  if (loadingAssignments) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <EmptyState
        title="No Assignments Yet"
        description="Create your first assignment to get started."
        icon={<FileCode className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-500" />}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow-md rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-900/50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assignment Code</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Score</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deadline</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Submissions</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
          {assignments.map(a => (
            <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
              <td className="px-6 py-4 whitespace-nowrap w-fit">
                <span className="inline-block bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 font-mono font-bold text-lg px-3 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 shadow-sm">
                  {a.assignment_code}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                {a.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                {a.total_score || 10}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                {a.deadline ? format(new Date(a.deadline), 'PPp') : 'No deadline'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{submissions.length}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                {format(new Date(a.created_at), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-3">
                  <Button onClick={() => handleEditAssignmentClick(a)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition p-1 cursor-pointer">
                    <Pencil className="w-5 h-5" />
                  </Button>
                  <Button onClick={() => handleDeleteClick(a)} disabled={isDeletingId === a.id} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition p-1 cursor-pointer">
                    {isDeletingId === a.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
