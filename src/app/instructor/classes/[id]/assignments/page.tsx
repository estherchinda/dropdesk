'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { sendEmailNotification } from '@/lib/notify';

import { Assignment, Submission } from '../../../types';
import { AssignmentForm } from '../../../components/AssignmentForm';
import { AssignmentList } from '../../../components/AssignmentList';
import { DeleteAssignmentModal } from '../../../components/DeleteAssignmentModal';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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

  useEffect(() => {
    fetchAssignments();
    fetchSubmissions();
  }, []);

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
      toast.error('Failed to load assignments.');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data } = await supabase.from('submissions').select('*');
      setSubmissions(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmittingAssignment(true);
    let code = '';
    let isUnique = false;
    
    try {
      while (!isUnique) {
        code = Math.floor(1000 + Math.random() * 9000).toString();
        const { data } = await supabase.from('assignments').select('id').eq('assignment_code', code).maybeSingle();
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

      // Notify enrolled students about new assignment
      // First get the class_id from the URL params
      const pathParts = window.location.pathname.split('/');
      const classIdx = pathParts.indexOf('classes');
      const currentClassId = classIdx !== -1 ? pathParts[classIdx + 1] : null;

      if (currentClassId) {
        const { data: enrollments } = await supabase
          .from('class_enrollments')
          .select('student_id')
          .eq('class_id', currentClassId);

        if (enrollments && enrollments.length > 0) {
          const studentIds = enrollments.map(e => e.student_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('email')
            .in('id', studentIds);

          if (profiles && profiles.length > 0) {
            const emails = profiles.map(p => p.email);
            sendEmailNotification(emails, 'new_assignment', {
              assignmentTitle: newTitle.trim(),
              assignmentCode: code,
              deadline: newDeadline ? new Date(newDeadline).toISOString() : null,
            });
          }
        }
      }
    } catch (err: any) {
      toast.error(`Error creating assignment: ${err.message}`);
    } finally {
      setIsSubmittingAssignment(false);
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

  const handleDeleteClick = (assignment: Assignment) => {
    setAssignmentToDelete(assignment);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    setIsDeletingId(assignmentToDelete.id);
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', assignmentToDelete.id);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assignments</h1>
           <p className="text-sm text-slate-500 dark:text-slate-400">Manage classroom tasks and PIN generators.</p>
        </div>
        {!isCreatingAssignment && !editingAssignmentId && (
            <Button 
                onClick={() => setIsCreatingAssignment(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-md hover:bg-indigo-700 transition"
            >
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
            </Button>
        )}
      </div>

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

      <AssignmentList
        assignments={assignments}
        loadingAssignments={loadingAssignments}
        isDeletingId={isDeletingId}
        handleEditAssignmentClick={handleEditAssignmentClick}
        handleDeleteClick={handleDeleteClick}
        submissions={submissions}
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
