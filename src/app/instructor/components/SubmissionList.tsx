'use client';

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, FileCode, ExternalLink, Save } from 'lucide-react';
import { format } from 'date-fns';
import { Submission, Assignment } from '../types';

interface SubmissionListProps {
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  editingId: string | null;
  editGrade: string;
  setEditGrade: (grade: string) => void;
  isSaving: boolean;
  assignments: Assignment[];
  handleSave: (id: string) => Promise<void>;
  handlEditClick: (sub: Submission) => void;
  cancelEdit: () => void;
  handleOpenFeedback: (sub: Submission) => void;
  getPreviewUrl: (urls: string[]) => string | undefined;
}

export function SubmissionList({
  submissions,
  loading,
  error,
  editingId,
  editGrade,
  setEditGrade,
  isSaving,
  assignments,
  handleSave,
  handlEditClick,
  cancelEdit,
  handleOpenFeedback,
  getPreviewUrl,
}: SubmissionListProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        <p className="font-semibold text-lg">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="p-16 text-center text-slate-500 dark:text-slate-400">
        <FileCode className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <p className="text-lg font-medium text-slate-900 dark:text-white">No submissions found</p>
        <p className="mt-1">Students haven't submitted any assignments yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Student & Assignment
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Submitted
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Files / Preview
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Grade
              </th>
              <th scope="col" className="relative px-6 py-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {submissions.map((sub) => {
              const previewUrl = getPreviewUrl(sub.file_urls || []);
              const isEditing = editingId === sub.id;
              const assignment = assignments.find(a => a.assignment_code === sub.assignment_code);
              const totalScore = assignment?.total_score || 10;

              return (
                <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 dark:text-white">{sub.student_name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center mt-1">
                      {sub.assignment_title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {format(new Date(sub.submitted_at), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-3">
                        {previewUrl && (
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                          >
                            Preview HTML
                            <ExternalLink className="w-3 h-3 ml-1.5" />
                          </a>
                        )}
                        
                        {sub.file_urls && sub.file_urls.length > 0 && (
                          <div className="relative group inline-block">
                            <span className="text-xs text-slate-500 dark:text-slate-400 underline cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                              View {sub.file_urls?.length} file(s)
                            </span>
                            <div className="absolute z-10 hidden group-hover:block w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1 left-0 shadow-lg">
                              <ul className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                {sub.file_urls.map((url, i) => {
                                  const fileName = url.split('/').pop()?.split('?')[0] || `file-${i}`;
                                  return (
                                    <li key={i}>
                                      <a href={url} target="_blank" rel="noreferrer" className="block text-xs text-indigo-600 dark:text-indigo-400 hover:underline p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded truncate" title={fileName}>
                                        {fileName}
                                      </a>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 min-w-[200px]">
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max={totalScore}
                          value={editGrade}
                          onChange={(e) => setEditGrade(e.target.value)}
                          placeholder="0"
                          className="w-20 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded shadow-sm text-sm bg-white dark:bg-slate-900 focus:ring-indigo-500 focus:border-indigo-500 outline-none no-stepper"
                        />
                        <span className="text-sm text-slate-500 font-medium">
                          / {totalScore}
                        </span>
                      </div>
                    ) : (
                       <div>
                        {sub.grade ? (
                          <div className="mb-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold leading-5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                            {sub.grade}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Not graded</span>
                        )}
                        {sub.comment && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 max-w-[150px]" title="Contains feedback">
                            Feedback: <span dangerouslySetInnerHTML={{ __html: sub.comment.replace(/<[^>]+>/g, ' ') }}></span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isEditing ? (
                      <div className="flex justify-end space-x-2">
                        <Button
                          onClick={() => cancelEdit()}
                          disabled={isSaving}
                          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSave(sub.id)}
                          disabled={isSaving}
                          className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition bg-indigo-50 dark:bg-indigo-900/30 px-4 py-1.5 rounded-full"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-3 items-center">
                        <Button
                          onClick={() => handlEditClick(sub)}
                          variant="default"
                        >
                          {sub.grade ? 'Edit Grade' : 'Add Grade'}
                        </Button>
                        <Button
                          onClick={() => handleOpenFeedback(sub)}
                          variant="outline"
                        >
                          {sub.comment ? 'Edit Feedback' : 'Add Feedback'}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
