'use client'; 
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, LayoutDashboard, FileCode, Search, BookOpen, LogOut, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

import { AuthView } from './components/AuthView';
import { AssignmentList } from './components/AssignmentList';
import { AssignmentForm } from './components/AssignmentForm';
import { SubmissionList } from './components/SubmissionList';
import { FeedbackModal } from './components/FeedbackModal';
import { DeleteAssignmentModal } from './components/DeleteAssignmentModal';
import { Submission, Assignment } from './types';

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
      <AuthView
        handleAuth={handleAuth}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isPasswordVisible={isPasswordVisible}
        setIsPasswordVisible={setIsPasssordVisible}
        isAuthLoading={isAuthLoading}
        authError={authError}
      />
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
          <AssignmentForm
            isCreating={isCreatingAssignment}
            editingAssignmentId={editingAssignmentId}
            setIsCreating={setIsCreatingAssignment}
            setEditingAssignmentId={setEditingAssignmentId}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newDescription={newDescription}
            setNewDescription={setNewDescription}
            newDeadline={newDeadline}
            setNewDeadline={setNewDeadline}
            newTotalScore={newTotalScore}
            setNewTotalScore={setNewTotalScore}
            isSubmitting={isSubmittingAssignment}
            createdCode={createdCode}
            setCreatedCode={setCreatedCode}
            handleCreateAssignment={handleCreateAssignment}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            editDescription={editDescription}
            setEditDescription={setEditDescription}
            editDeadline={editDeadline}
            setEditDeadline={setEditDeadline}
            editTotalScore={editTotalScore}
            setEditTotalScore={setEditTotalScore}
            isUpdating={isUpdatingAssignment}
            handleUpdateAssignment={handleUpdateAssignment}
          />

          {!isCreatingAssignment && !editingAssignmentId && (
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden p-6 mb-6">
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
            </div>
          )}

          <AssignmentList
            assignments={assignments}
            loadingAssignments={loadingAssignments}
            isDeletingId={isDeletingId}
            handleEditAssignmentClick={handleEditAssignmentClick}
            handleDeleteClick={handleDeleteClick}
            submissions={filteredSubmissions}
          />
        </div>
      )}

      {activeTab === 'submissions' && (
        <SubmissionList
          submissions={filteredSubmissions}
          loading={loading}
          error={error}
          editingId={editingId}
          editGrade={editGrade}
          setEditGrade={setEditGrade}
          isSaving={isSaving}
          assignments={assignments}
          handleSave={handleSave}
          handlEditClick={handlEditClick}
          cancelEdit={() => setEditingId(null)}
          handleOpenFeedback={handleOpenFeedback}
          getPreviewUrl={getPreviewUrl}
        />
      )}

      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        selectedSub={selectedFeedbackSub}
        feedbackText={feedbackText}
        setFeedbackText={setFeedbackText}
        isSaving={isSavingFeedback}
        handleSaveFeedback={handleSaveFeedback}
      />

      <DeleteAssignmentModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setAssignmentToDelete(null); }}
        assignmentToDelete={assignmentToDelete}
        isDeletingId={isDeletingId}
        confirmDeleteAssignment={confirmDeleteAssignment}
      />
    </div>
  );
}
