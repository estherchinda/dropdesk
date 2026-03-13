import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    variant?: "default" | "none"
  }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "none", ...props }, ref) => {
    return (
      <textarea
        className={cn(
          {
            "flex min-h-[80px] w-full rounded-2xl md:rounded-3xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all custom-scrollbar": variant === "default"
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
