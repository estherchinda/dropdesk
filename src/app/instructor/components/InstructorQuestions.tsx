'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Loader2, MessageSquare, Send, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { EmptyState } from '@/components/ui/EmptyState';

export function InstructorQuestions() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (err: any) {
      toast.error('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAnswer = (q: any) => {
    setAnsweringId(q.id);
    setAnswerText(q.answer || '');
  };

  const handleSaveAnswer = async (id: string) => {
    if (!answerText.trim()) {
      toast.error('Answer cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          answer: answerText.trim()
        })
        .eq('id', id);

      if (error) throw error;

      setQuestions(prev => 
        prev.map(q => q.id === id ? { ...q, answer: answerText.trim() } : q)
      );
      setAnsweringId(null);
      setAnswerText('');
      toast.success('Answer saved!');
    } catch (err: any) {
      toast.error('Error saving answer.');
    } finally {
      setIsSaving(false);
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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Student Questions</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Respond to student inquiries and provide help.</p>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />}
          title="No questions yet"
          description="Students will appear here when they ask questions."
        />
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 dark:text-white">{q.student_name}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400">{new Date(q.created_at).toLocaleString()}</span>
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-200 mt-2 tiptap" dangerouslySetInnerHTML={{ __html: q.message }}></div>
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

              {answeringId === q.id ? (
                  <div className="space-y-3 pt-2">
                       <RichTextEditor 
                            placeholder="Type your response..."
                            content={answerText}
                            onChange={setAnswerText}
                       />
                       <div className="flex space-x-2">
                            <Button onClick={() => setAnsweringId(null)} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white rounded-full">Cancel</Button>
                            <Button onClick={() => handleSaveAnswer(q.id)} disabled={isSaving} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Save Answer
                            </Button>
                       </div>
                  </div>
              ) : (
                  <div>
                      {q.answer ? (
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Response:</p>
                                <div className="text-sm text-slate-800 dark:text-slate-300 mt-1 tiptap" dangerouslySetInnerHTML={{ __html: q.answer }}></div>
                                <button onClick={() => handleOpenAnswer(q)} className="text-xs text-indigo-600 hover:underline mt-2">Edit Answer</button>
                          </div>
                      ) : (
                          <Button onClick={() => handleOpenAnswer(q)} className="mt-2 text-xs text-indigo-600 hover:underline bg-transparent border-0 p-0 shadow-none font-semibold">Answer Question</Button>
                      )}
                  </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
