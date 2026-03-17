'use client';

import { ProfileView } from '@/components/ProfileView';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
         <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
         <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal account and email addresses.</p>
      </div>
      <ProfileView />
    </div>
  );
}
