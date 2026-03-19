'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, User, Mail, Save } from 'lucide-react';
import { toast } from 'react-toastify';

export function ProfileView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [initials, setInitials] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      setUserId(session.user.id);
      setEmail(session.user.email || '');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setName(data.name || '');
        if (data.name) {
             setInitials(data.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2));
        } else {
             setInitials(session.user.email?.[0].toUpperCase() || 'U');
        }
      }
    } catch (err: any) {
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          email: email.trim() // user asked for this
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 2. Optionally update Supabase auth email if it changed
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.email !== email.trim()) {
           const { error: authError } = await supabase.auth.updateUser({ email: email.trim() });
           if (authError) {
               toast.warning('Profile updated, but auth email change needs confirmation from your inbox.');
           }
      }

      setInitials(name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2));
      toast.success('Profile saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-md">
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-3">
          {initials ? (
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{initials}</span>
          ) : (
            <User className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          )}
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Settings</h2>
        <p className="text-xs text-slate-400">Update your account detail reference</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center">
            <User className="w-4 h-4 mr-1 text-slate-400" /> Name
          </label>
          <Input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center">
            <Mail className="w-4 h-4 mr-1 text-slate-400" /> Email
          </label>
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        <Button type="submit" disabled={saving} variant="default" className="flex justify-center items-center font-semibold">
          {saving ? 
          <>
          <Loader2 className="w-4 h-4 animate-spin" /> 
          </> 
          : 
          <>
          Save Changes
          </>}
        </Button>
      </form>
    </div>
  );
}
