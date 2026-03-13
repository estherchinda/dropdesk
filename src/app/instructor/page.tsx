'use client'; 
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, LayoutDashboard, ExternalLink, Save, FileCode, Search, Plus, BookOpen, X, CheckCircle, LogOut, User, Lock, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

type Submission = {
  id: string;
  student_name: string;
  assignment_code: string;
  assignment_title: string;
  file_urls: string[];
  submitted_at: string;
  grade: string | null;
  comment: string | null;
};

type Assignment = {
  id: string;
  assignment_code: string;
  title: string;
  description: string | null;
  deadline: string | null;
  total_score: number;
  created_at: string;
};

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState<'submissions' | 'assignments'>('submissions');
  const [isPasswordVisible, setIsPasssordVisible] = useState(false);
  
  // Submissions State
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState('');
  // const [editComment, setEditComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Assignments State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  
  // New Assignment Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newTotalScore, setNewTotalScore] = useState('10');
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  // Assignment Edit/Delete State
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editTotalScore, setEditTotalScore] = useState('');
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Feedback State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedFeedbackSub, setSelectedFeedbackSub] = useState<Submission | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  // Auth State
  const [session, setSession] = useState<any | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      setSession(data.session);
      setIsSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchSubmissions();
      fetchAssignments();
    }
  }, [session]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Logged in successfully!');
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully.');
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (dbError) throw new Error(dbError.message);
      
      setSubmissions(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const { data, error: dbError } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw new Error(dbError.message);
      
      setAssignments(data || []);
    } catch (err: any) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handlEditClick = (sub: Submission) => {
    setEditingId(sub.id);
    let gradeNum = '';
    if (sub.grade) {
      gradeNum = sub.grade.includes('/') ? sub.grade.split('/')[0] : sub.grade;
    }
    setEditGrade(gradeNum);
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      const subToUpdate = submissions.find(s => s.id === id);
      const assignment = assignments.find(a => a.assignment_code === subToUpdate?.assignment_code);
      const totalScore = assignment?.total_score || 10;
      const formattedGrade = editGrade.trim() ? `${editGrade.trim()}/${totalScore}` : null;

      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          grade: formattedGrade
        })
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);

      setSubmissions(prev => 
        prev.map(s => s.id === id ? { ...s, grade: formattedGrade } : s)
      );
      setEditingId(null);
      toast.success('Grade saved successfully!');
    } catch (err: any) {
      toast.error(`Error updating grade: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenFeedback = (sub: Submission) => {
    setSelectedFeedbackSub(sub);
    setFeedbackText(sub.comment || '');
    setFeedbackModalOpen(true);
  };

  const handleSaveFeedback = async () => {
    if (!selectedFeedbackSub) return;
    setIsSavingFeedback(true);
    try {
      const formattedComment = feedbackText.trim() || null;
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          comment: formattedComment
        })
        .eq('id', selectedFeedbackSub.id);

      if (updateError) throw new Error(updateError.message);

      setSubmissions(prev => 
        prev.map(s => s.id === selectedFeedbackSub.id ? { ...s, comment: formattedComment } : s)
      );
      setFeedbackModalOpen(false);
      toast.success('Feedback saved successfully!');
    } catch (err: any) {
      toast.error(`Error saving feedback: ${err.message}`);
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmittingAssignment(true);
    
    // Generate a unique 4 digit code
    let code = '';
    let isUnique = false;
    
    try {
      while (!isUnique) {
        code = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Check if code exists
        const { data } = await supabase
          .from('assignments')
          .select('id')
          .eq('assignment_code', code)
          .maybeSingle();
          
        if (!data) isUnique = true;
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('assignments')
        .insert({
          assignment_code: code,
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          deadline: newDeadline ? new Date(newDeadline).toISOString() : null,
          total_score: Number(newTotalScore) || 10
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      setAssignments([insertedData, ...assignments]);
      setCreatedCode(code);
      setNewTitle('');
      setNewDescription('');
      setNewDeadline('');
      setNewTotalScore('10');
      toast.success('Assignment created successfully!');
    } catch (err: any) {
      toast.error(`Error creating assignment: ${err.message}`);
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const handleDeleteClick = (assignment: Assignment) => {
    setAssignmentToDelete(assignment);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    
    setIsDeletingId(assignmentToDelete.id);
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentToDelete.id);

      if (error) throw new Error(error.message);

      setAssignments(prev => prev.filter(a => a.id !== assignmentToDelete.id));
      toast.success('Assignment deleted successfully!');
      setIsDeleteModalOpen(false);
      setAssignmentToDelete(null);
    } catch (err: any) {
      toast.error(`Error deleting assignment: ${err.message}`);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleEditAssignmentClick = (assignment: Assignment) => {
    setEditingAssignmentId(assignment.id);
    setEditTitle(assignment.title);
    setEditDescription(assignment.description || '');
    setEditDeadline(assignment.deadline ? new Date(assignment.deadline).toISOString().slice(0, 16) : '');
    setEditTotalScore(assignment.total_score ? assignment.total_score.toString() : '10');
  };

  const handleUpdateAssignment = async (id: string) => {
    if (!editTitle.trim()) return;
    setIsUpdatingAssignment(true);
    try {
      const { error: updateError } = await supabase
        .from('assignments')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          deadline: editDeadline ? new Date(editDeadline).toISOString() : null,
          total_score: Number(editTotalScore) || 10
        })
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);

      setAssignments(prev => prev.map(a => 
        a.id === id ? { 
          ...a, 
          title: editTitle.trim(), 
          description: editDescription.trim() || null, 
          deadline: editDeadline ? new Date(editDeadline).toISOString() : null,
          total_score: Number(editTotalScore) || 10
        } : a
      ));
      setEditingAssignmentId(null);
      toast.success('Assignment updated successfully!');
    } catch (err: any) {
      toast.error(`Error updating assignment: ${err.message}`);
    } finally {
      setIsUpdatingAssignment(false);
    }
  };

  const getPreviewUrl = (urls: string[]) => {
    return urls.find(url => url.toLowerCase().endsWith('index.html'));
  };

  const filteredSubmissions = submissions.filter(s => 
    s.student_name.toLowerCase().includes(search.toLowerCase()) || 
    s.assignment_code.includes(search) ||
    (s.assignment_title && s.assignment_title.toLowerCase().includes(search.toLowerCase()))
  );

  if (isSessionLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  // auth
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                DropDesk Instructor
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Sign in to manage your classes
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-5 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                    placeholder="instructor@school.edu"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    type={isPasswordVisible ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-5 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                  <div onClick={() => setIsPasssordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer">
                    {isPasswordVisible ? <Eye className="size-5 text-slate-400" /> : <EyeOff className='size-5 text-slate-400' />}
                  </div>
                </div>
              </div>              {authError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
                  {authError}
                </div>
              )}

              <Button
                type="submit"
                disabled={isAuthLoading}
                className="w-full flex justify-center items-center py-3 px-5 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors shadow-md"
              >
                {isAuthLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </div>
          

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center mb-2">
            <LayoutDashboard className="w-8 h-8 mr-3 text-indigo-600 dark:text-indigo-400" />
            Instructor Dashboard
          </h1>
          <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-700 mt-6 w-fit">
            <Button
              onClick={() => setActiveTab('submissions')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                activeTab === 'submissions' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <div className="flex items-center">
                <FileCode className="w-4 h-4 mr-2" />
                Submissions
              </div>
            </Button>
            <Button
              onClick={() => setActiveTab('assignments')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                activeTab === 'assignments' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Assignments
              </div>
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-4 mt-8 md:mt-0">
          {activeTab === 'submissions' && (
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <Input
                type="text"
                placeholder="Search student or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-full leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
              />
            </div>
          )}
          <Button 
            onClick={handleLogout}
            className="shrink-0 p-2.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900 shadow-sm cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 shadow-md rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden p-6">
            {isCreatingAssignment ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Assignment</h2>
                  <Button 
                    onClick={() => { setIsCreatingAssignment(false); setCreatedCode(null); }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {createdCode ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-center mb-4">
                      <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Assignment Created Successfully!</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">Give this 4-digit code to your students so they can submit their work.</p>
                    <div className="inline-block bg-white dark:bg-slate-900 border-2 border-green-300 dark:border-green-700 rounded-xl px-10 py-4 shadow-sm mb-6">
                      <span className="text-5xl font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400">{createdCode}</span>
                    </div>
                    <div>
                      <Button 
                        onClick={() => { setIsCreatingAssignment(false); setCreatedCode(null); }}
                        className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-sm font-medium shadow-sm hover:opacity-90 transition"
                      >
                        Back to Assignments
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateAssignment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Assignment Title *</label>
                      <Input 
                        type="text" 
                        required
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="e.g. Final Web Project"
                        className="w-full px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Description</label>
                      <Textarea 
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                        placeholder="Instructions for the assignment..."
                        rows={3}
                        className="w-full px-5 py-3 border border-slate-300 dark:border-slate-600 rounded-3xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
                        <Input 
                          type="datetime-local" 
                          value={newDeadline}
                          onChange={e => setNewDeadline(e.target.value)}
                          className="w-full px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Score</label>
                        <Input 
                          type="number" 
                          min="1"
                          value={newTotalScore}
                          onChange={e => setNewTotalScore(e.target.value)}
                          className="w-full px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white no-stepper outline-none"
                        />
                      </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                      <Button 
                        type="button"
                        onClick={() => setIsCreatingAssignment(false)}
                        className="px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={isSubmittingAssignment || !newTitle.trim()}
                        className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
                      >
                        {isSubmittingAssignment && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ) : editingAssignmentId ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Assignment</h2>
                  <Button 
                    onClick={() => setEditingAssignmentId(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleUpdateAssignment(editingAssignmentId); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Assignment Title *</label>
                    <Input 
                      type="text" 
                      required
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder="e.g. Final Web Project"
                      className="w-full px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Description</label>
                    <Textarea 
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="Instructions for the assignment..."
                      rows={3}
                      className="w-full px-5 py-3 border border-slate-300 dark:border-slate-600 rounded-3xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
                      <Input 
                        type="datetime-local" 
                        value={editDeadline}
                        onChange={e => setEditDeadline(e.target.value)}
                        className="w-full px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Score</label>
                      <Input 
                        type="number" 
                        min="1"
                        value={editTotalScore}
                        onChange={e => setEditTotalScore(e.target.value)}
                        className="w-full px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white no-stepper outline-none"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end space-x-3">
                    <Button 
                      type="button"
                      onClick={() => setEditingAssignmentId(null)}
                      className="px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isUpdatingAssignment || !editTitle.trim()}
                      className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                      {isUpdatingAssignment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Update Assignment
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Assignments</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Generate access PIN codes and manage class tasks.</p>
                </div>
                <Button 
                  onClick={() => setIsCreatingAssignment(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-md hover:bg-indigo-700 transition"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 shadow-md rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {loadingAssignments ? (
               <div className="flex h-40 items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
               </div>
            ) : assignments.length === 0 ? (
               <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                 <p>No assignments created yet.</p>
               </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assignment Code</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Score</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deadline</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {assignments.map(a => {
                    return (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-6 py-4 whitespace-nowrap w-fit">
                        <span className="inline-block bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 font-mono font-bold text-lg px-3 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 shadow-sm">
                          {a.assignment_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white w-full">
                        {a.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                        {a.total_score || 10}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {a.deadline ? format(new Date(a.deadline), 'PPp') : 'No deadline'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {format(new Date(a.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Button onClick={() => handleEditAssignmentClick(a)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition p-1 cursor-pointer">
                            <Pencil className="w-5 h-5" />
                          </Button>
                          <Button onClick={() => handleDeleteClick(a)} disabled={isDeletingId === a.id} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition p-1 cursor-pointer">
                            {isDeletingId === a.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400">
              <p className="font-semibold text-lg">Error</p>
              <p>{error}</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-16 text-center text-slate-500 dark:text-slate-400">
              <FileCode className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-lg font-medium text-slate-900 dark:text-white">No submissions found</p>
              <p className="mt-1">Students haven't submitted any assignments yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-visible">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Student & Assignment
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Files / Preview
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Grade
                    </th>
                    <th scope="col" className="relative px-6 py-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredSubmissions.map((sub) => {
                    const previewUrl = getPreviewUrl(sub.file_urls || []);
                    const isEditing = editingId === sub.id;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-white">{sub.student_name}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center mt-1">
                            {sub.assignment_title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                          {format(new Date(sub.submitted_at), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-2">
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                              {sub.file_urls?.length || 0} uploaded
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              {previewUrl && (
                                <a
                                  href={previewUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                                >
                                  Preview HTML
                                  <ExternalLink className="w-3 h-3 ml-1.5" />
                                </a>
                              )}
                              
                              {sub.file_urls && sub.file_urls.length > 0 && (
                                <div className="relative group inline-block">
                                  <span className="text-xs text-slate-500 dark:text-slate-400 underline cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                                    View File(s)
                                  </span>
                                  <div className="absolute z-10 hidden group-hover:block w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1 left-0 shadow-lg">
                                    <ul className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                      {sub.file_urls.map((url, i) => {
                                        const fileName = url.split('/').pop()?.split('?')[0] || `file-${i}`;
                                        return (
                                          <li key={i}>
                                            <a href={url} target="_blank" rel="noreferrer" className="block text-xs text-indigo-600 dark:text-indigo-400 hover:underline p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded truncate" title={fileName}>
                                              {fileName}
                                            </a>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 min-w-[200px]">
                          {isEditing ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min="0"
                                max={assignments.find(a => a.assignment_code === sub.assignment_code)?.total_score || 10}
                                value={editGrade}
                                onChange={(e) => setEditGrade(e.target.value)}
                                placeholder="0"
                                className="w-20 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded shadow-sm text-sm bg-white dark:bg-slate-900 focus:ring-indigo-500 focus:border-indigo-500 outline-none no-stepper"
                              />
                              <span className="text-sm text-slate-500 font-medium">
                                / {assignments.find(a => a.assignment_code === sub.assignment_code)?.total_score || 10}
                              </span>
                            </div>
                          ) : (
                            <div>
                              {sub.grade ? (
                                <div className="mb-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold leading-5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                  {sub.grade}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400 italic">Not graded</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {isEditing ? (
                            <div className="flex justify-end space-x-2">
                              <Button
                                onClick={() => setEditingId(null)}
                                disabled={isSaving}
                                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleSave(sub.id)}
                                disabled={isSaving}
                                className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition bg-indigo-50 dark:bg-indigo-900/30 px-4 py-1.5 rounded-full"
                              >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                                Save
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end space-x-3 items-center">
                              <Button
                                onClick={() => handlEditClick(sub)}
                                variant="default"
                              >
                                {sub.grade ? 'Edit Grade' : 'Add Grade'}
                              </Button>
                              <Button
                                onClick={() => handleOpenFeedback(sub)}
                                variant="outline"
                              >
                                {sub.comment ? 'Edit Feedback' : 'Add Feedback'}
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModalOpen && selectedFeedbackSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Instructor Feedback</h3>
              <Button 
                onClick={() => setFeedbackModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Student: <span className="text-slate-900 dark:text-white">{selectedFeedbackSub.student_name}</span></p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Assignment: <span className="text-slate-900 dark:text-white">{selectedFeedbackSub.assignment_title}</span></p>
              </div>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Write your feedback here..."
                className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-2xl shadow-sm text-sm bg-white dark:bg-slate-900 focus:ring-indigo-500 focus:border-indigo-500 h-40 resize-none custom-scrollbar text-slate-900 dark:text-white"
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end space-x-3">
              <Button
                onClick={() => setFeedbackModalOpen(false)}
                className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"
                disabled={isSavingFeedback}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveFeedback}
                disabled={isSavingFeedback}
                className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {isSavingFeedback ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && assignmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Assignment</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{assignmentToDelete.title}"</span>? This action cannot be undone and will remove all associated submissions.
              </p>
              <div className="flex justify-center space-x-3">
                <Button
                  onClick={() => { setIsDeleteModalOpen(false); setAssignmentToDelete(null); }}
                  className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                  disabled={!!isDeletingId}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteAssignment}
                  disabled={!!isDeletingId}
                  className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-full text-sm font-medium shadow-md hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {isDeletingId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
