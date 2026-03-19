'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function StudentClassIndex() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    router.replace(`${pathname}/assignments`);
  }, []);

  return null;
}
