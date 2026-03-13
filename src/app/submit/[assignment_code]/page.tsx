'use client'; 
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

import { useState, useCallback, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useDropzone } from 'react-dropzone';
import { FileUp, File, X, CheckCircle, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

type Assignment = {
  id: string;
  assignment_code: string;
  title: string;
  description: string;
  deadline: string;
  created_at: string;
};

export default function SubmitPage({ params }: { params: Promise<{ assignment_code: string }> }) {
  const unwrappedParams = use(params);
  const searchParams = useSearchParams();
  const studentName = searchParams.get('student') || '';
  const assignmentCode = unwrappedParams.assignment_code;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!studentName) {
        setError("Student name is missing. Please go back and enter your name.");
        setLoading(false);
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
        setLoading(false);
        return;
      }

      if (assignData.deadline && new Date(assignData.deadline) < new Date()) {
        setError("This assignment code has expired (deadline passed).");
        setLoading(false);
        return;
      }

      setAssignment(assignData);

      // 2. Check if already submitted
      const { data: subData } = await supabase
        .from('submissions')
        .select('id')
        .eq('assignment_code', assignmentCode)
        .eq('student_name', studentName)
        .maybeSingle();

      if (subData) {
        setAlreadySubmitted(true);
      }
      setLoading(false);
    }
    fetchData();
  }, [assignmentCode, studentName]);

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
        // preserve folder structure if present in webkitRelativePath, else just name
        const pathSuffix = file.webkitRelativePath || file.name;
        const filePath = `${assignmentCode}/${studentName.replace(/\\s+/g, '_')}/${pathSuffix}`;

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
          student_name: studentName,
          assignment_code: assignmentCode,
          assignment_title: assignment?.title || 'Unknown Assignment',
          file_urls: uploadedUrls,
          submitted_at: new Date().toISOString()
        });

      if (dbError) throw new Error(dbError.message);

      setIsSubmitted(true);
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-center">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h2>
        <p className="text-slate-700 dark:text-slate-300">{error}</p>
        <Link href="/" className="mt-6 inline-block text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
          &larr; Return Home
        </Link>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-center shadow-lg">
        <h2 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-4">Already Submitted</h2>
        <p className="text-slate-700 dark:text-slate-300">
          You have already submitted an assignment for code <span className="font-bold">{assignmentCode}</span>.
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <Link href="/" className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-full shadow hover:bg-indigo-700 transition">
            Home
          </Link>
          <Link href="/grades" className="px-6 py-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-slate-700 rounded-full shadow hover:bg-indigo-50 dark:hover:bg-slate-700 transition">
            Check Grades
          </Link>
        </div>
      </div>
    );
  }

  if (isSubmitted && assignment) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Submitted Successfully!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Your work has been securely uploaded.</p>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 text-left mb-8 border border-slate-100 dark:border-slate-700">
          <div className="grid grid-cols-3 gap-y-4 text-sm">
            <div className="text-slate-500 dark:text-slate-400 font-medium">Student</div>
            <div className="col-span-2 font-semibold text-slate-900 dark:text-slate-100">{studentName}</div>
            
            <div className="text-slate-500 dark:text-slate-400 font-medium">Assignment</div>
            <div className="col-span-2 font-semibold text-slate-900 dark:text-slate-100">{assignment.title}</div>
            
            <div className="text-slate-500 dark:text-slate-400 font-medium">Status</div>
            <div className="col-span-2 font-semibold text-green-600 dark:text-green-400 flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Submitted
            </div>
            
            <div className="text-slate-500 dark:text-slate-400 font-medium">Time</div>
            <div className="col-span-2 font-semibold text-slate-900 dark:text-slate-100">
              {format(new Date(), 'PPp')}
            </div>
          </div>
        </div>
        
        <Link href="/" className="inline-block px-8 py-3 bg-indigo-600 text-white font-medium rounded-full shadow-lg hover:bg-indigo-700 transition">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {assignment && (
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-indigo-600 dark:text-indigo-400 font-semibold mb-1 uppercase tracking-wider text-xs">Assignment for code "{assignmentCode}"</p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{assignment.title}</h1>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-slate-700 dark:text-slate-300 mb-4 tiptap" dangerouslySetInnerHTML={{ __html: assignment.description }}></div>
            <div className="flex items-center text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-1.5 rounded-full">
              <Calendar className="w-4 h-4 mr-2" />
              Due: {format(new Date(assignment.deadline), 'PPp')}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Submit Work</h2>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Submitting as <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded ml-1 font-semibold">{studentName}</span>
          </div>
        </div>
        
        <div className="p-8">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'}
            `}
          >
            <Input {...getInputProps() as any} />
            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <FileUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">
              {isDragActive ? 'Drop files here...' : 'Drag & drop files or folders'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              or click to browse from your computer
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Files you can submit:
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-4">
              <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600">HTML / CSS / JS</span>
              <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600">PDF / DOCX</span>
              <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600">Images</span>
              <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600">ZIP</span>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                <File className="w-4 h-4 mr-2" /> Selected Files ({files.length})
              </h3>
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-full border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center truncate max-w-[80%] pl-2">
                      <File className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {file.webkitRelativePath || file.name}
                      </span>
                    </div>
                    <Button 
                      onClick={() => removeFile(index)}
                      className="p-1.5 mr-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      disabled={isUploading}
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              
              {isUploading && (
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    <span>Uploading submission...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setShowConfirmModal(true)}
                disabled={isUploading}
                className="w-full mt-6 flex justify-center items-center py-3 px-5 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Submit Assignment'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirm Submission</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Are you sure you want to submit? Ensure all your files are correct. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowConfirmModal(false)}
                disabled={isUploading}
                className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
              >
                Cancel
              </Button>
              <Button
                onClick={uploadSubmission}
                disabled={isUploading}
                className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow transition disabled:opacity-70"
              >
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Yes, Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
