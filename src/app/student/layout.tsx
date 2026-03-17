'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, BookOpen, MessageSquare, Award, LogOut, Menu, X, User } from 'lucide-react';
import { toast } from 'react-toastify';
import Link from 'next/link';

// Context to share user session without prop drilling
const StudentContext = createContext<{ user: any }>({ user: null });

export function useStudent() {
    return useContext(StudentContext);
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [profileName, setProfileName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/');
        return;
      }
      checkRole(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

    if (error || data?.role !== 'student') {
        if (data?.role === 'instructor') {
             router.push('/instructor');
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
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const menuItems = [
    { id: 'assignments', label: 'Assignments', icon: BookOpen, href: '/student/assignments' },
    { id: 'questions', label: 'Questions', icon: MessageSquare, href: '/student/questions' },
    { id: 'grades', label: 'Grades', icon: Award, href: '/student/grades' },
    { id: 'profile', label: 'Profile', icon: User, href: '/student/profile' },
  ];

  return (
    <StudentContext.Provider value={{ user: session.user }}>
      <div className="flex h-[90vh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 relative flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                {profileName ? profileName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : session.user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{profileName || 'Logged in as Student'}</p>
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

        {/* Mobile Sidebar */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}>
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
                      <span className="text-xl font-bold">DropDesk</span>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)}>
                      <X className="w-5 h-5 text-slate-500" />
                  </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 dark:text-slate-400">
                  <Menu className="w-6 h-6" />
              </button>
              <span className="font-bold">DropDesk</span>
              <div className="w-10"></div> {/* Spacer */}
          </header>

          {/* Dynamic Content */}
          <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </StudentContext.Provider>
  );
}
