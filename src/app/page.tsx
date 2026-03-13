'use client'; 
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [studentName, setStudentName] = useState('');
  const [assignmentCode, setAssignmentCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentName.trim() || assignmentCode.length !== 4) {
      setError('Please enter a valid name and a 4-digit code.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: dbError } = await supabase
        .from('assignments')
        .select('id, deadline')
        .eq('assignment_code', assignmentCode)
        .single();

      if (dbError || !data) {
        setError('Invalid assignment code. Please try again.');
        setIsLoading(false);
        return;
      }

      if (data.deadline && new Date(data.deadline) < new Date()) {
        setError('This assignment code is expired and the deadline passed.');
        setIsLoading(false);
        return;
      }

      router.push(`/submit/${assignmentCode}?student=${encodeURIComponent(studentName.trim())}`);
    } catch (err: any) {
      setError('An error occurred. Please try again later.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">DropDesk</h1>
            <p className="text-slate-500 dark:text-slate-400">Enter your details to submit your assignment</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="studentName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <Input
                id="studentName"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                autoComplete="name"
                required
                className="w-full px-5 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="assignmentCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Assignment Code
              </label>
              <Input
                id="assignmentCode"
                type="text"
                value={assignmentCode}
                onChange={(e) => setAssignmentCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                pattern="\d{4}"
                className="w-full px-5 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm text-center text-xl tracking-widest font-mono"
                placeholder="----"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                A 4-digit code provided by your instructor.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-5 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Access Portal'
              )}
            </Button>
          </form>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 p-4 flex justify-between text-sm">
          <Link href="/questions" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Ask a Question
          </Link>
          <Link href="/grades" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Check Grades
          </Link>
        </div>
      </div>
    </div>
  );
}
