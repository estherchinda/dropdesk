'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { Loader2, FolderOpen, FileCode } from 'lucide-react';
import { toast } from 'react-toastify';

export default function StudentMaterialsPage() {
  const params = useParams();
  const classId = params.id as string;

  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, [classId]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (err: any) {
      toast.error('Failed to load materials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Class Materials</h1>
        <p className="text-sm text-slate-500">View documents and guidelines</p>
      </div>

      {loading ? (
         <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : materials.length === 0 ? (
         <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="flex flex-col items-center justify-center">
                <FolderOpen className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">No materials added yet.</p>
                <p className="text-sm text-slate-400">Check back later for updates.</p>
            </div>
         </div>
      ) : (
         <div className="space-y-4">
           {materials.map(mat => (
              <div key={mat.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{mat.title}</h3>
                {mat.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{mat.description}</p>}
                {mat.file_urls && mat.file_urls.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {mat.file_urls.map((url: string, index: number) => (
                      <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium max-w-xs truncate text-indigo-600 dark:text-indigo-400 hover:underline shadow-sm">
                        <FileCode className="w-3.5 h-3.5 mr-1 text-slate-400" /> Attached File
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-3">Added {new Date(mat.created_at).toLocaleDateString()}</p>
              </div>
           ))}
         </div>
      )}
    </div>
  );
}
