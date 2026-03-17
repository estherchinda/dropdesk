import { File } from 'lucide-react';

export function EmptyState({ title = "No items", description = "Try adding or reloading." }: { title?: string, description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 max-w-md mx-auto shadow-sm">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <File className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">{title}</p>
      <p className="text-sm text-slate-400 text-center max-w-xs">{description}</p>
    </div>
  );
}
