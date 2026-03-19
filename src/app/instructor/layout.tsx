'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, LayoutDashboard, FileCode, BookOpen, MessageSquare, User, LogOut, Menu, X, School, FolderOpen, ChevronLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import Link from 'next/link';

const InstructorContext = createContext<{ user: any } | null>(null);

export const useInstructor = () => {
  const context = useContext(InstructorContext);
  if (!context) throw new Error('useInstructor must be used within an InstructorLayout');
  return context;
};

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [profileName, setProfileName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [isClassesExpanded, setIsClassesExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const classId = pathname.split('/classes/')[1]?.split('/')[0];

  useEffect(() => {
    if (classId) {
      supabase.from('classes').select('*').eq('id', classId).single().then(({ data }) => {
        if (data) setCurrentClass(data);
      });
    } else {
      setCurrentClass(null);
    }
  }, [classId]);

  useEffect(() => {
    if (session) {
      supabase.from('classes').select('*').eq('instructor_id', session.user.id).then(({ data }) => {
        if (data) setClasses(data);
      });
    }
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      if (!data.session) {
        router.push('/');
        return;
      }
      checkRole(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (!session) {
        router.push('/');
      } else {
        checkRole(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRole = async (session: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', session.user.id)
      .single();

    if (error || data?.role !== 'instructor') {
      if (data?.role === 'student') {
        router.push('/student');
      } else {
        router.push('/');
      }
    } else {
      setSession(session);
      if (data?.name) setProfileName(data.name);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully.');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const menuItems = [
    { id: 'classes', label: 'Classes', icon: School, href: '/instructor/classes' },
    { id: 'profile', label: 'Profile', icon: User, href: '/instructor/profile' },
  ];

  const classMenuItems = [
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'submissions', label: 'Submissions', icon: FileCode },
    { id: 'questions', label: 'Questions', icon: MessageSquare },
    { id: 'materials', label: 'Materials', icon: FolderOpen },
  ];

  return (
    <InstructorContext.Provider value={{ user: session?.user }}>
      <div className="flex h-[90vh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <LayoutDashboard className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
              Instructor
            </h1>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {/* Class Specific Sidebar */}
            {currentClass ? (
              <div className="space-y-4">
                <Link href="/instructor/classes" className="flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    <ChevronLeft className='w-5 h-5' />
                    Back to home
                </Link>
                 <p className="text-sm font-bold truncate text-slate-800 dark:text-white uppercase mb-5">{currentClass.name}</p>
                <div className="space-y-1">
                  {classMenuItems.map((item) => {
                    const itemHref = `/instructor/classes/${classId}/${item.id}`;
                    const isActive = pathname.startsWith(itemHref);
                    return (
                      <Link
                        key={item.id}
                        href={itemHref}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>

                  );
                })}
              </div>
            )}
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 relative flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                {profileName ? profileName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : session.user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{profileName || 'Logged in as Instructor'}</p>
                <p className="text-sm font-medium truncate">{session.user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
              title='Logout'
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* Mobile Navbar Header */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 md:hidden">
            <h1 className="text-lg font-bold flex items-center">
              <LayoutDashboard className="w-5 h-5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
              Instructor Panel
            </h1>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {children}
          </main>
        </div>

        {/* Backdrop for Mobile Sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar Frame */}
        <aside
          className={`fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h1 className="text-xl font-bold flex items-center">
              <LayoutDashboard className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
              Instructor
            </h1>
            <button onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-3 absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
              {profileName ? profileName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : session?.user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs text-slate-500 dark:text-slate-400">{profileName || 'Instructor'}</p>
               <p className="text-sm font-medium truncate">{session?.user.email}</p>
            </div>
            <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
               <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>
      </div>
    </InstructorContext.Provider>
  );
}
