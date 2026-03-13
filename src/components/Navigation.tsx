'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          <div className="shrink-0 flex items-center">
            <Link href="/" className='flex items-center relative'>
            <div className="size-14 relative">
              <Image  src="/d-nobg.png" alt="Logo" fill  />
            </div>
              <span className="hidden md:block text-2xl font-bold uppercase">DropDesk</span>
              <div className="h-0.5 w-22 absolute right-6 bg-white bottom-2"></div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Submit
            </Link>
            <Link href="/questions" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Questions
            </Link>
            <Link href="/grades" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Grades
            </Link>
            <Link href="/instructor" className="text-sm font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition">
              Instructors
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 focus:outline-none p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-64 border-b border-slate-200 dark:border-slate-800' : 'max-h-0'}`}
      >
        <div className="px-6 pt-2 pb-6 space-y-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg">
          <Link 
            href="/" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-2xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            Submit Assignment
          </Link>
          <Link 
            href="/questions" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-2xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            Ask Questions
          </Link>
          <Link 
            href="/grades" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-2xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            Check Grades
          </Link>
          <div className="pt-2">
            <Link 
              href="/instructor" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center w-full px-4 py-3 border border-indigo-200 dark:border-indigo-800 rounded-full text-base font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
            >
              Instructor Login
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
