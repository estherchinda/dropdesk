'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { Submission, Assignment } from '../../../types';
import { SubmissionList } from '../../../components/SubmissionList';
import { FeedbackModal } from '../../../components/FeedbackModal';
import { sendNotification } from '@/lib/notify';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Feedback State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedFeedbackSub, setSelectedFeedbackSub] = useState<Submission | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    fetchAssignments();
  }, []);

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
    try {
      const { data } = await supabase
        .from('assignments')
        .select('*');
      setAssignments(data || []);
    } catch (err) {
      console.error(err);
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
        .update({ grade: formattedGrade })
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);

      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, grade: formattedGrade } : s));
      setEditingId(null);
      toast.success('Grade saved successfully!');

      if (subToUpdate && formattedGrade) {
        await sendNotification({
          type: 'ASSIGNMENT_GRADED',
          studentId: subToUpdate.student_id,
          title: subToUpdate.assignment_title || 'Assignment',
          link: '/student/classes',
          extraData: { grade: formattedGrade, comment: subToUpdate.comment }
        });
      }

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
        .update({ comment: formattedComment })
        .eq('id', selectedFeedbackSub.id);

      if (updateError) throw new Error(updateError.message);

      setSubmissions(prev => prev.map(s => s.id === selectedFeedbackSub.id ? { ...s, comment: formattedComment } : s));
      setFeedbackModalOpen(false);
      toast.success('Feedback saved successfully!');

      if (formattedComment) {
        await sendNotification({
          type: 'ASSIGNMENT_GRADED',
          studentId: selectedFeedbackSub.student_id,
          title: selectedFeedbackSub.assignment_title || 'Assignment',
          link: '/student/classes',
          extraData: { grade: selectedFeedbackSub.grade, comment: formattedComment }
        });
      }

    } catch (err: any) {
      toast.error(`Error saving feedback: ${err.message}`);
    } finally {
      setIsSavingFeedback(false);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Submissions</h1>
           <p className="text-sm text-slate-500 dark:text-slate-400">View and grade student project uploads.</p>
        </div>
        <div className="relative w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <Input
            type="text"
            placeholder="Search student or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-900 focus:ring-indigo-500 text-sm shadow-sm"
          />
        </div>
      </div>

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

      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        selectedSub={selectedFeedbackSub}
        feedbackText={feedbackText}
        setFeedbackText={setFeedbackText}
        isSaving={isSavingFeedback}
        handleSaveFeedback={handleSaveFeedback}
      />
    </div>
  );
}
