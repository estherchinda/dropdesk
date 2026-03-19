'use client';

import { useParams, useRouter } from 'next/navigation';
import { StudentSubmit } from '../../components/StudentSubmit';
import { useStudent } from '../../layout';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const { user } = useStudent();

  return (
    <StudentSubmit 
      assignmentCode={params.code as string} 
      user={user} 
      onBack={(classId) => router.push(classId ? `/student/classes/${classId}/assignments` : '/student/classes')} 
    />
  );
}
