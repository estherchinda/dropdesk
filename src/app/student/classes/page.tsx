'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useStudent } from '../layout';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Plus, School, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function StudentClassesPage() {
  const { user } = useStudent();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('class_enrollments')
        .select(`
          joined_at,
          classes (
            id,
            name,
            code,
            created_at
          )
        `)
        .eq('student_id', user.id);

      if (error) throw error;
      setClasses(data.map((d: any) => ({
        ...d.classes,
        joined_at: d.joined_at
      })) || []);
    } catch (err: any) {
      toast.error('Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) return;

    setIsJoining(true);
    try {
      // 1. Find the class
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('code', classCode.trim().toUpperCase())
        .maybeSingle();

      if (classError || !classData) {
        toast.error('Invalid class code. Please check and try again.');
        setIsJoining(false);
        return;
      }

      // 2. Insert enrollment
      const { error: enrollError } = await supabase
        .from('class_enrollments')
        .insert([{ class_id: classData.id, student_id: user.id }]);

      if (enrollError) {
        if (enrollError.code === '23505') { // Unique constraint
          toast.warning('You are already enrolled in this class.');
        } else {
          throw enrollError;
        }
      } else {
         toast.success(`Joined class: ${classData.name}!`);
         setClasses([{ ...classData, joined_at: new Date().toISOString() }, ...classes]);
      }

      setJoinModalOpen(false);
      setClassCode('');
    } catch (err: any) {
      toast.error('Failed to join class.');
    } finally {
      setIsJoining(false);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Classes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and join your classrooms</p>
        </div>
        
        <Button onClick={() => setJoinModalOpen(true)} variant='default'>
          <Plus className="w-4 h-4 mr-2" /> Join Class
        </Button>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
           <div className="flex flex-col items-center justify-center">
               <School className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
               <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Not enrolled in any classes yet</p>
               <p className="text-sm text-slate-400 mb-4">Enter a code from your instructor to join a class.</p>
               <Button onClick={() => setJoinModalOpen(true)} variant="outline">Join Class</Button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{cls.name}</h3>
                  <p className="text-xs text-slate-500">
                    Joined {cls.joined_at ? `${formatDistanceToNow(new Date(cls.joined_at))} ago` : 'recently'}
                  </p>
                </div>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl">
                  <School className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Link href={`/student/classes/${cls.id}`} className="w-full">
                  <Button variant="default" className="w-full rounded-xl flex items-center justify-center">
                    Enter Class <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Class Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Join a Class</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">Ask your instructor for the 6-character class code.</p>
            <form onSubmit={handleJoinClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class Code</label>
                <Input
                  type="text"
                  placeholder="ABC123"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  required
                  className="w-full px-4 py-2 text-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-3"
                />
              </div>
              <div className="flex space-x-2">
                <Button type="button" onClick={() => setJoinModalOpen(false)} variant="outline" className="w-full">Cancel</Button>
                <Button type="submit" disabled={isJoining} variant="default" className="w-full">
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
