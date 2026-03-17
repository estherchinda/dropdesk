'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Grid, List, Lock, Unlock, Eye, Calendar, Award, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import Link from 'next/link';

import { useStudent } from '../layout';
import { useRouter } from 'next/navigation';

export function StudentAssignments() {
  const { user } = useStudent();
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [unlockedCodes, setUnlockedCodes] = useState<string[]>([]);
  const [search, setSearch] = useState<string>('');
  
  // Code Prompt Modal
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchAssignments();
    // Load unlocked codes from localStorage
    const savedCodes = localStorage.getItem(`unlocked_codes_${user.id}`);
    if (savedCodes) {
      setUnlockedCodes(JSON.parse(savedCodes));
    }
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (err: any) {
      toast.error('Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.assignment_code.includes(search)
  );

  const handleUnlock = (assignment: any) => {
    if (unlockedCodes.includes(assignment.assignment_code)) {
      // Already unlocked!
      return;
    }
    setSelectedAssignment(assignment);
    setVerifyCode('');
  };

  const verifyAssignmentCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsVerifying(true);
    if (verifyCode === selectedAssignment.assignment_code) {
      const updatedCodes = [...unlockedCodes, verifyCode];
      setUnlockedCodes(updatedCodes);
      localStorage.setItem(`unlocked_codes_${user.id}`, JSON.stringify(updatedCodes));
      toast.success('Assignment unlocked!');
      setSelectedAssignment(null);
    } else {
      toast.error('Invalid code. Please try again.');
    }
    setIsVerifying(false);
  };

  const forgetCode = (code: string) => {
    const updatedCodes = unlockedCodes.filter(c => c !== code);
    setUnlockedCodes(updatedCodes);
    localStorage.setItem(`unlocked_codes_${user.id}`, JSON.stringify(updatedCodes));
    toast.info('Assignment locked.');
    setSelectedAssignment(null);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assignments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and submit class assignments</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-4 py-1.5 border border-slate-300 dark:border-slate-800 rounded-full bg-white dark:bg-slate-900 focus:ring-indigo-500 text-sm shadow-sm"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 border border-slate-200 dark:border-slate-800 rounded-full bg-white dark:bg-slate-900 p-1">
            <Button
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-full h-8 w-8"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-full h-8 w-8"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
           <div className="flex flex-col items-center justify-center">
               <Grid className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
               <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">No assignments found</p>
               <p className="text-sm text-slate-400">Check back with your instructor.</p>
           </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredAssignments.map((assignment) => {
            const isUnlocked = unlockedCodes.includes(assignment.assignment_code);
            return (
              <div
                key={assignment.id}
                className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden ${viewMode === 'list' ? 'flex items-center p-6 space-x-4' : 'flex flex-col'}`}
              >
                {viewMode === 'grid' && (
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{assignment.title}</h3>
                      {isUnlocked ? <Unlock className="w-5 h-5 text-green-500" /> : <Lock className="w-5 h-5 text-slate-400" />}
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{assignment.description.replace(/<[^>]*>/g, '')}</p>
                    )}
                    <div className="flex items-center text-xs text-slate-500 space-x-4">
                      <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'No deadline'}</span>
                      <span className="flex items-center"><Award className="w-4 h-4 mr-1" /> {assignment.total_score} pts</span>
                    </div>
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{assignment.title}</h3>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                          <Calendar className="w-3.5 h-3.5 mr-1" /> {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'No deadline'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`${viewMode === 'grid' ? 'border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 flex' : 'flex items-center'} `}>
                  {isUnlocked ? (
                    <div className="flex w-full space-x-2">
                        <Button onClick={() => router.push(`/student/submit/${assignment.assignment_code}`)} variant="default" className="flex-1">
                          <Eye className="w-4 h-4 mr-2" /> View & Submit
                        </Button>
                        <Button 
                            onClick={() => forgetCode(assignment.assignment_code)}
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            title="Lock this assignment code"
                        >
                            Forget Code
                        </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleUnlock(assignment)}
                      variant="outline"
                      className="w-full"
                    >
                      Enter Code to View
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Code Prompt Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Unlock {selectedAssignment.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Please enter the 4-digit assignment code provided by your instructor.</p>
            <form onSubmit={verifyAssignmentCode} className="space-y-4">
              <Input
                type="text"
                placeholder="4-digit code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                className="w-full px-4 py-2 text-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <div className="flex space-x-2">
                <Button type="button" onClick={() => setSelectedAssignment(null)} variant="outline" className="w-full">Cancel</Button>
                <Button type="submit" disabled={isVerifying} variant="default" className="w-full">
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unlock'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
