'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useInstructor } from '../layout';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Plus, School, Copy, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function ClassesPage() {
  const { user } = useInstructor();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (err: any) {
      toast.error('Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    setIsCreating(true);
    try {
      const code = generateCode();
      const { data, error } = await supabase
        .from('classes')
        .insert([{ name: className, code, instructor_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Class created successfully!');
      setClasses([data, ...classes]);
      setCreateModalOpen(false);
      setClassName('');
    } catch (err: any) {
      toast.error('Failed to create class.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Classes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and manage your classrooms</p>
        </div>
        
        <Button onClick={() => setCreateModalOpen(true)} variant='default'>
          <Plus className="w-4 h-4 mr-2" /> Create Class
        </Button>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
           <div className="flex flex-col items-center justify-center">
               <School className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
               <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">No classes created yet</p>
               <p className="text-sm text-slate-400 mb-4">Create your first class to get started.</p>
               <Button onClick={() => setCreateModalOpen(true)} variant="outline">Create Class</Button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{cls.name}</h3>
                  <p className="text-xs text-slate-500">Created {new Date(cls.created_at).toLocaleDateString()}</p>
                </div>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl">
                  <School className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-500">Class Code</p>
                  <p className="text-base font-mono font-bold text-slate-800 dark:text-white">{cls.code}</p>
                </div>
                <Button 
                  onClick={() => copyToClipboard(cls.code)} 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                >
                  {copiedCode === cls.code ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </Button>
              </div>

              <div className="flex space-x-2">
                <Link href={`/instructor/classes/${cls.id}`} className="w-full">
                  <Button variant="default" className="w-full rounded-xl">View Details</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-center text-xl font-bold text-slate-900 dark:text-white mb-2">Create New Class</h2>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">Enter a name for your class. We'll generate a join code for you.</p>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Mathematics 101"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-3"
                />
              </div>
              <div className="flex space-x-2">
                <Button type="button" onClick={() => setCreateModalOpen(false)} variant="outline" className="w-full">Cancel</Button>
                <Button type="submit" disabled={isCreating} variant="default" className="w-full">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
