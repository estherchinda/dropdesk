'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Loader2, CheckCircle, Clock, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { useStudent } from '../layout';
import { EmptyState } from '@/components/ui/EmptyState';
import { X } from 'lucide-react';

export function StudentQuestions() {
  const { user } = useStudent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [studentName, setStudentName] = useState(user.email);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetchQuestions();

    const channel = supabase
      .channel(`questions_student_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
          filter: `student_id=eq.${user.id}`,
        },
        () => {
          fetchQuestions(true); // Refresh questions quietly on change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchQuestions = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (err: any) {
      toast.error('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please fill in both fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('questions')
        .insert({
          student_id: user.id,
          student_name: studentName.trim(),
          message: message.trim(),
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      toast.success('Question submitted!');
      setMessage('');
      setIsModalOpen(false); // Close Modal
      fetchQuestions(); // Refresh

    } catch (err: any) {
      toast.error(err.message || 'Failed to ask question.');
    } finally {
      setIsSubmitting(false);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Questions</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ask questions and see instructor answers.</p>
         </div>
         <Button onClick={() => setIsModalOpen(true)} variant="default" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Ask a Question</Button>
      </div>

      {/* Ask Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl max-w-lg w-full relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-10 text-center">Ask a Question</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <RichTextEditor
                content={message}
                onChange={setMessage}
                placeholder="What setup errors are you running into?"
                className='mb-10'
              />
              <div className="flex space-x-2 justify-end items-center">
                  <Button type="button" onClick={() => setIsModalOpen(false)} variant="outline">
                    Cancel
                    </Button>
                  <Button type="submit" disabled={isSubmitting} variant="default" className="flex justify-center items-center">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Send Question'}
                  </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <EmptyState title="No questions asked yet" description="Ask a question above to get help from your instructor." />
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm text-slate-500">{new Date(q.created_at).toLocaleString()}</span>
                    <div className="font-medium text-slate-900 dark:text-white mt-1 tiptap" dangerouslySetInnerHTML={{ __html: q.message }}></div>
                  </div>
                  {q.answer ? (
                    <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold">
                      <CheckCircle className="w-3 h-3 mr-1" /> Answered
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-bold">
                      <Clock className="w-3 h-3 mr-1" /> Pending
                    </span>
                  )}
                </div>

                {q.answer && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Instructor Answer:</p>
                    <div className="text-sm text-slate-800 dark:text-slate-300 mt-1 tiptap" dangerouslySetInnerHTML={{ __html: q.answer }}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
