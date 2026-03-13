'use client'; 
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Award, Search, ChevronDown, ChevronRight } from 'lucide-react';

type Grade = {
  id: string;
  student_name: string;
  assignment_title: string;
  grade: string;
};

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchGrades() {
      try {
        const { data, error: dbError } = await supabase
          .from('submissions')
          .select('id, student_name, assignment_title, grade')
          .not('grade', 'is', null)
          .order('assignment_title', { ascending: true })
          .order('student_name', { ascending: true });

        if (dbError) throw new Error(dbError.message);
        
        setGrades(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load grades.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchGrades();
  }, []);

  const filteredGrades = grades.filter(g => 
    g.student_name.toLowerCase().includes(search.toLowerCase()) || 
    (g.assignment_title && g.assignment_title.toLowerCase().includes(search.toLowerCase()))
  );

  const groupedGrades = useMemo(() => {
    const groups: Record<string, Grade[]> = {};
    filteredGrades.forEach(g => {
      const title = g.assignment_title || 'Unknown Assignment';
      if (!groups[title]) groups[title] = [];
      groups[title].push(g);
    });
    return groups;
  }, [filteredGrades]);

  const toggleAccordion = (title: string) => {
    setExpandedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        {/* <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
            <Award className="h-8 w-8" />
          </div>
        </div> */}
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">Student Grades</h1>
        <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
          Check the scores for all graded assignments.
        </p>
      </div>

      <div className="mb-6 relative max-w-md mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <Input
          type="text"
          placeholder="Search by student or assignment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-full leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
        />
      </div>

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
        ) : Object.keys(groupedGrades).length === 0 ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400">
            <Award className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-lg font-medium text-slate-900 dark:text-white">No grades available</p>
            <p className="mt-1">Check back later when instructors have finalized grading.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {Object.entries(groupedGrades).map(([title, assignmentGrades]) => {
              const isExpanded = expandedAssignments.has(title);
              return (
                <div key={title} className="bg-white dark:bg-slate-800">
                  <Button
                    onClick={() => toggleAccordion(title)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition focus:outline-none"
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-4">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{assignmentGrades.length} {assignmentGrades.length === 1 ? 'submission' : 'submissions'} graded</p>
                      </div>
                    </div>
                    <div className="text-slate-400 dark:text-slate-500">
                      <ChevronDown className={`w-6 h-6 transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </Button>
                  
                  <div 
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="overflow-x-auto custom-scrollbar mt-2">
                          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead>
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  Student Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  Score
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                              {assignmentGrades.map((grade) => (
                                <tr key={grade.id} className="hover:bg-slate-100 dark:hover:bg-slate-700/50 transition">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">
                                    {grade.student_name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                      {grade.grade}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
