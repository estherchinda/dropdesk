'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/Button";
import { Loader2, Award, Calendar, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';

import { useStudent } from '../layout';
import { EmptyState } from '@/components/ui/EmptyState';

export function StudentGrades() {
  const { user } = useStudent();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err: any) {
      toast.error('Failed to load grades.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Grades</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">View your scores and feedback for submitted assignments</p>
      </div>

      {submissions.length === 0 ? (
        <EmptyState title="No submissions found" description="Submit an assignment from the assignments tab to see grades here." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{sub.assignment_title || `Code: ${sub.assignment_code}`}</h3>
                    <p className="text-xs text-slate-500 flex items-center mt-1">
                      <Calendar className="w-3.5 h-3.5 mr-1" /> Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  {sub.grade ? (
                    <div className="p-3 text-green-700 dark:text-green-400 rounded-2xl flex flex-col items-center justify-center font-bold">
                      <span className="text-xl">{sub.grade.includes('/') ? sub.grade.split('/')[0] : sub.grade}</span>
                      <span className="text-xs opacity-70">/ {sub.grade.includes('/') ? sub.grade.split('/')[1] : '10'}</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-center font-bold text-sm">
                      Pending
                    </div>
                  )}
                </div>

                {sub.comment && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Feedback:</p>
                    <div className="text-sm text-slate-800 dark:text-slate-300 mt-1 tiptap prose-sm" dangerouslySetInnerHTML={{ __html: sub.comment }} />
                  </div>
                )}
              </div>

               {sub.file_urls && sub.file_urls.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-medium text-slate-500 mb-2">Files Submitted:</p>
                      <div className="flex flex-wrap gap-1">
                          {sub.file_urls.map((url: string, index: number) => (
                              <button key={index} onClick={() => window.open(url, '_blank')} className="text-xs text-indigo-600 hover:underline flex items-center bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-full">
                                  File {index + 1} <ExternalLink className="w-3 h-3 ml-1" />
                              </button>
                          ))}
                      </div>
                  </div>
               )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
