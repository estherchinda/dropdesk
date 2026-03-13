import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navigation from '@/components/Navigation';

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
          <Navigation />
          
          <main className="grow bg-slate-50/50 dark:bg-slate-900/50">
            {children}
          </main>
          
          <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>© {new Date().getFullYear()} DropDesk. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
