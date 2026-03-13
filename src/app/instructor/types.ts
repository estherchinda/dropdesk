export type Submission = {
  id: string;
  student_name: string;
  assignment_code: string;
  assignment_title: string;
  file_urls: string[];
  submitted_at: string;
  grade: string | null;
  comment: string | null;
};

export type Assignment = {
  id: string;
  assignment_code: string;
  title: string;
  description: string | null;
  deadline: string | null;
  total_score: number;
  created_at: string;
};
