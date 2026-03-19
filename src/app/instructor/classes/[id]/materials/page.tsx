'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Plus, FolderOpen, FileCode } from 'lucide-react';
import { toast } from 'react-toastify';
import { EmptyState } from '@/components/ui/EmptyState';

export default function MaterialsPage() {
  const params = useParams();
  const classId = params.id as string;

  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const filePath = `materials/${classId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('materials')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicData.publicUrl);
      }

      const { data, error } = await supabase
        .from('materials')
        .insert([{
          class_id: classId,
          title: title.trim(),
          description: description.trim() || null,
          file_urls: uploadedUrls
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Material added successfully!');
      setMaterials([data, ...materials]);
      setIsCreating(false);
      setTitle('');
      setDescription('');
      setFiles([]);
    } catch (err: any) {
      toast.error(`Error adding material: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Class Materials</h1>
          <p className="text-sm text-slate-500">Add documents and guidelines</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} variant='default'>
            <Plus className="w-4 h-4 mr-2" /> Add Material
          </Button>
        )}
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-4 space-y-4 shadow-sm animate-in fade-in">
           <h3 className="text-md font-bold">New Material</h3>
           <form onSubmit={handleAddMaterial} className="space-y-4">
             <div>
               <label className="block text-sm font-medium mb-1">Title *</label>
               <Input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
             </div>
             <div>
               <label className="block text-sm font-medium mb-1">Description</label>
               <textarea 
                 className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm" 
                 rows={4} 
                 value={description} 
                 onChange={e => setDescription(e.target.value)}
                 placeholder="Plain text or short notes..."
               />
             </div>
             <div>
               <label className="text-sm font-medium mb-2 flex items-center"><FolderOpen className="w-4 h-4 mr-1 text-indigo-600" /> Files</label>
               <input type="file" multiple onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
             </div>
             <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button type="submit" disabled={isUploading || !title.trim()}>
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
             </div>
           </form>
        </div>
      )}

      {loading ? (
         <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
      ) : materials.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />}
          title="No materials added yet"
          description="Create your first material to get started."
        />
      ) : (
         <div className="space-y-4">
           {materials.map(mat => (
              <div key={mat.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-lg">{mat.title}</h3>
                {mat.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{mat.description}</p>}
                {mat.file_urls && mat.file_urls.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {mat.file_urls.map((url: string, index: number) => (
                      <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium max-w-xs truncate text-indigo-600 hover:underline shadow-sm hover:shadow">
                        <FileCode className="w-3.5 h-3.5 mr-1 text-slate-500" /> Attached File
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
