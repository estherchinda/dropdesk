import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navigation from '@/components/Navigation';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DropDesk',
  description: 'Clean UI for assignment submissions',
  themeColor: '#4f46e5',
  icons: {
    icon: "/d.png"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastContainer 
          position="bottom-right" 
          theme="dark" 
          hideProgressBar={true}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          toastClassName="font-sans"
        />
        <div className="min-h-screen flex flex-col">
          <Suspense fallback={<div className="h-20 bg-white/80 dark:bg-slate-900/80 sticky top-0 border-b border-slate-200 dark:border-slate-800 z-50" />}>
            <Navigation />
          </Suspense>
          
          <main className="grow bg-slate-50/50 dark:bg-slate-900/50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
