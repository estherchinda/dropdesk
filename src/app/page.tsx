'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Image from "next/image";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [activeRole, setActiveRole] = useState<'student' | 'instructor'>('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'instructor') {
      setActiveRole('instructor');
    } else {
      setActiveRole('student');
    }
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        checkRole(data.session);
      } else {
        setIsSessionLoading(false);
      }
    });
  }, []);

  const checkRole = async (session: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle(); // maybeSingle returns null instead of throwing error if zero rows

      if (error) throw error;

      if (!data) {
        // Wait for auth headers to propagate fully in client session execution
        await new Promise(resolve => setTimeout(resolve, 500));

        // Profile doesn't exist (e.g. historical account). Auto-create using metadata or active state.
        const userRole = session.user.user_metadata?.role || activeRole;
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email || '',
            role: userRole,
          });

        if (insertError) throw insertError;
        
        if (userRole === 'instructor') {
          router.push('/instructor');
        } else {
          router.push('/student');
        }
        return;
      }

      if (data.role === 'instructor') {
        router.push('/instructor');
      } else if (data.role === 'student') {
        router.push('/student');
      }
    } catch (err) {
      setIsSessionLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'https://dropdesk.xyz/',
            data: {
              role: activeRole,
            }
          }
        });

        if (signUpError) throw signUpError;
        
        if (data.session) {
          toast.success('Account created successfully!');
          checkRole(data.session);
        } else if (data.user) {
          toast.success('Successfully registered! Please check your email to verify your account.');
          // Do not push router here; wait for them to verify and login
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.session) {
            toast.success('Logged in successfully!');
            checkRole(data.session);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address first.');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset link sent to your email!');
      setIsForgotPassword(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="size-16 relative mx-auto mb-2 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-2xl flex items-center justify-center">
              <Image src="/d-nobg.png" alt="Logo" fill className="object-contain p-2" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              DropDesk {activeRole === 'instructor' ? 'Instructor' : 'Student'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isForgotPassword 
                ? 'Send a verification email to restore access' 
                : activeRole === 'instructor' 
                  ? 'Manage classes and grade submissions' 
                  : 'View assignments and track your scores'}
            </p>
          </div>



          <form onSubmit={isForgotPassword ? handleForgotPassword : handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  placeholder={activeRole === 'instructor' ? 'instructor@school.edu' : 'student@school.edu'}
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                     {!isSignUp && (
                          <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Forgot password?</button>
                     )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    type={isPasswordVisible ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    placeholder="••••••••"
                  />
                  <div onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer">
                    {isPasswordVisible ? <Eye className="size-5 text-slate-400" /> : <EyeOff className='size-5 text-slate-400' />}
                  </div>
                </div>
              </div>
            )}

            {authError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
                {authError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-5 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors shadow-md"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {!isForgotPassword ? (
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline block w-full"
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </button>
            ) : (
                <button
                  onClick={() => setIsForgotPassword(false)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline block w-full"
                >
                  Back to Sign In
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
