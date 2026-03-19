'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Plus, FolderOpen, FileCode, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { EmptyState } from '@/components/ui/EmptyState';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { sendEmailNotification } from '@/lib/notify';

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    }
  });

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

      // Notify enrolled students
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('student_id')
        .eq('class_id', classId);

      if (enrollments && enrollments.length > 0) {
        const studentIds = enrollments.map(e => e.student_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email')
          .in('id', studentIds);

        if (profiles && profiles.length > 0) {
          const emails = profiles.map(p => p.email);
          sendEmailNotification(emails, 'new_material', {
            materialTitle: title.trim(),
            description: description.trim(),
          });
        }
      }
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
               <label className="block text-sm font-medium mb-1">Title <span className="text-red-500">*</span></label>
               <Input 
                 type="text" 
                 value={title} 
                 onChange={e => setTitle(e.target.value)} required 
                 className="w-full px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
               />
             </div>
             <div>
               <label className="block text-sm font-medium mb-1">Description</label>
               <RichTextEditor
                 content={description}
                 onChange={setDescription}
                 placeholder="Instructions for the assignment..."
                 className="w-full h-64"
               />
             </div>
             <div>
               <label className="text-sm font-medium mb-2 flex items-center"><FolderOpen className="w-4 h-4 mr-1 text-indigo-600" /> Files</label>
               <div 
                 {...getRootProps()} 
                 className={cn(
                   "border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer transition", 
                   isDragActive ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10" : "hover:border-indigo-500"
                 )}
               >
                 <input {...getInputProps()} />
                 <FolderOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                 <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Drag & drop files here, or click to select</p>
                 <p className="text-xs text-slate-400 mt-1">Multiple files allowed</p>
               </div>

               {files.length > 0 && (
                 <div className="mt-4 space-y-2">
                   {files.map((file, index) => (
                     <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in">
                       <div className="flex items-center space-x-2 truncate">
                         <FileCode className="w-4 h-4 text-slate-500 shrink-0" />
                         <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
                         <span className="text-2xs text-slate-400 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                       </div>
                       <button 
                         type="button" 
                         onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))} 
                         className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition cursor-pointer"
                       >
                         <X className="w-4 h-4" />
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
             <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button type="submit" variant='default' disabled={isUploading || !title.trim()}>
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
                {mat.description && (
                  <div 
                    className="text-sm text-slate-600 dark:text-slate-400 mt-2 tiptap" 
                    dangerouslySetInnerHTML={{ __html: mat.description }} 
                  />
                )}
                {mat.file_urls && mat.file_urls.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {mat.file_urls.map((url: string, index: number) => (
                      <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center p-2.5 bg-slate-50 
                      dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium max-w-xs truncate text-indigo-600 hover:underline shadow-sm hover:shadow">
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
