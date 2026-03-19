'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InstructorDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/instructor/classes');
  }, [router]);

  return null;
}
