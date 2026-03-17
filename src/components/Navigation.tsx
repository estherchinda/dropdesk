'use client';

import { useState } from 'react';
import Link from 'next/link';
// import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Navigation() {
  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'student';
  const isAuthPage = pathname === '/' || pathname === '/reset-password';

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="shrink-0 flex items-center">
            <Link href="/" className='flex items-center relative'>
              <div className="size-14 relative">
                <Image src="/d-nobg.png" alt="Logo" fill />
              </div>
              <span className="hidden md:block text-2xl font-bold uppercase">DropDesk</span>
            </Link>
          </div>

          {isAuthPage && (
            <div className="flex items-center space-x-2">
              <Link 
                href="/?role=student" 
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${role === 'student' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
              >
                For Student
              </Link>
              <Link 
                href="/?role=instructor" 
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${role === 'instructor' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
              >
                For Instructor
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
