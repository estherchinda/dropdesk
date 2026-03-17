'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: password.trim() });
      if (error) throw error;
      toast.success("Password updated successfully!");
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-700">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset Password</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Type your new password below to regain access.</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <Input
                type={isPasswordVisible ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-full border border-slate-300 dark:border-slate-600 focus:ring-indigo-500 shadow-sm"
                placeholder="••••••••"
              />
              <div onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer">
                {isPasswordVisible ? <Eye className="size-5 text-slate-400" /> : <EyeOff className='size-5 text-slate-400' />}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 py-3 rounded-full border border-slate-300 dark:border-slate-600 focus:ring-indigo-500 shadow-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full flex justify-center items-center py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Set New Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
