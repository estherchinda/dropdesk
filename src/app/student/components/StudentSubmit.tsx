'use client'; 

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDropzone } from 'react-dropzone';
import { FileUp, File, X, CheckCircle, Loader2, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { sendEmailNotification } from '@/lib/notify';

type Assignment = {
  id: string;
  assignment_code: string;
  title: string;
  description: string;
  deadline: string;
  created_at: string;
  class_id?: string;
};

interface StudentSubmitProps {
  assignmentCode: string;
  user: any;
  onBack: (classId?: string) => void;
}

export function StudentSubmit({ assignmentCode, user, onBack }: StudentSubmitProps) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentName, setStudentName] = useState(user.email || '');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (!user) {
          setError("Please log in to submit assignments.");
          return;
        }

        // 1. Fetch assignment rules
        const { data: assignData, error: assignError } = await supabase
          .from('assignments')
          .select('*')
          .eq('assignment_code', assignmentCode)
          .single();

        if (assignError || !assignData) {
          setError("Assignment not found.");
          return;
        }

        if (assignData.deadline && new Date(assignData.deadline) < new Date()) {
          setError("This assignment code has expired (deadline passed).");
          return;
        }

        setAssignment(assignData);

        // 2. Check if already submitted
        const { data: subData } = await supabase
          .from('submissions')
          .select('id')
          .eq('assignment_code', assignmentCode)
          .eq('student_id', user.id)
          .maybeSingle();

        if (subData) {
          setAlreadySubmitted(true);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load details.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [assignmentCode, user]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop
  });

  const uploadSubmission = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);

    const uploadedUrls: string[] = [];
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    let uploadedBytes = 0;

    try {
      for (const file of files) {
        const pathSuffix = file.webkitRelativePath || file.name;
        const filePath = `${assignmentCode}/${studentName.replace(/\s+/g, '_')}/${pathSuffix}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(filePath, file, {
            upsert: true,
          });

        if (uploadError) throw new Error(uploadError.message);

        const { data: publicData } = supabase.storage
          .from('submissions')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicData.publicUrl);
        uploadedBytes += file.size;
        setUploadProgress(Math.round((uploadedBytes / totalBytes) * 100));
      }

      const { error: dbError } = await supabase
        .from('submissions')
        .insert({
          student_id: user.id,
          student_name: studentName,
          assignment_code: assignmentCode,
          assignment_title: assignment?.title || 'Unknown Assignment',
          file_urls: uploadedUrls,
          submitted_at: new Date().toISOString()
        });

      if (dbError) throw new Error(dbError.message);

      setIsSubmitted(true);
      toast.success("Assignment submitted successfully!");

      // Notify the instructor about the new submission
      if (assignment?.class_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select('instructor_id')
          .eq('id', assignment.class_id)
          .single();

        if (classData?.instructor_id) {
          const { data: instructorProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', classData.instructor_id)
            .single();

          if (instructorProfile?.email) {
            sendEmailNotification(instructorProfile.email, 'new_submission', {
              studentName,
              assignmentTitle: assignment.title,
              assignmentCode,
            });
          }
        }
      }
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-200 dark:border-red-800 text-center">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Error</h2>
        <p className="text-slate-700 dark:text-slate-300 mb-4">{error}</p>
        <Button onClick={() => onBack(assignment?.class_id)} variant="default">
          &larr; Back to Assignments
        </Button>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="p-8 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 text-center shadow-lg">
        <h2 className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-2">Already Submitted</h2>
        <p className="text-slate-700 dark:text-slate-300 mb-6">
          You have already submitted an assignment for code <span className="font-bold">{assignmentCode}</span>.
        </p>
        <Button onClick={() => onBack(assignment?.class_id)} variant="default">
          Back to Assignments
        </Button>
      </div>
    );
  }

  if (isSubmitted && assignment) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Submitted Successfully!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Your work has been securely uploaded.</p>
        <Button onClick={() => onBack(assignment?.class_id)} variant="default">
          Return to Assignments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Button onClick={() => onBack(assignment?.class_id)} variant="ghost" size="icon">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Submit Assignment</h2>
          <p className="text-sm text-slate-500">Code: {assignmentCode}</p>
        </div>
      </div>

      {assignment && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{assignment.title}</h1>
            <div className="text-slate-700 dark:text-slate-300 tiptap" dangerouslySetInnerHTML={{ __html: assignment.description }}></div>
            <div className="flex items-center text-sm font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-1.5 rounded-full w-fit">
              <Calendar className="w-4 h-4 mr-2" />
              Due: {format(new Date(assignment.deadline), 'PPp')}
            </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upload Work</h2>
          <div className="text-sm text-slate-500">Submitting as <span className="font-semibold text-indigo-600">{studentName}</span></div>
        </div>
        
        <div className="p-8 space-y-6">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'}
            `}
          >
            <input {...getInputProps()} />
            <div className="mx-auto w-14 h-14 mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <FileUp className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-md font-medium text-slate-900 dark:text-white mb-1">
              Drag & drop files or click to browse
            </p>
            <p className="text-xs text-slate-500">Supports PDFs, Images, ZIPs, Docs</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                <File className="w-4 h-4 mr-2" /> Selected Files ({files.length})
              </h3>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-4">{file.name}</span>
                    <button onClick={() => removeFile(index)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </li>
                ))}
              </ul>

              {isUploading && (
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}

              <Button
                onClick={() => setShowConfirmModal(true)}
                disabled={isUploading}
                variant="default"
                className="w-full font-semibold"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Assignment'}
              </Button>
            </div>
          )}
        </div>
      </div>

       {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirm Submission</h3>
            <p className="text-slate-500 text-sm mb-6">Are you sure you want to submit? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setShowConfirmModal(false)} variant="outline">Cancel</Button>
              <Button onClick={uploadSubmission} variant="default">Yes, Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
