'use client'; 
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Send } from 'lucide-react';
import Link from 'next/link';

export default function QuestionsPage() {
  const [studentName, setStudentName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentName.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error: dbError } = await supabase
        .from('questions')
        .insert({
          student_name: studentName.trim(),
          message: message.trim(),
          created_at: new Date().toISOString(),
        });

      if (dbError) throw new Error(dbError.message);

      setIsSuccess(true);
      setStudentName('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">Ask a Question</h1>
        <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
          Need help with an assignment? Submit your question below and your instructor will review.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isSuccess ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
              <Send className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Question Submitted!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Your instructor has received your question and will get back to you soon.
            </p>
            <div className="space-x-4">
              <Button 
                onClick={() => setIsSuccess(false)} 
                className="inline-flex items-center px-6 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-full text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Ask Another
              </Button>
              <Link href="/" className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition">
                Return Home
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="studentName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <Input
                id="studentName"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                className="w-full px-5 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Your Question
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="w-full px-5 py-4 rounded-3xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition resize-none custom-scrollbar"
                placeholder="How do I setup the project structure?"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3 px-5 border border-transparent rounded-full shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Submit Question
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
