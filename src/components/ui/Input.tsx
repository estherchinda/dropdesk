import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    variant?: "default" | "none"
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "none", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          {
            "flex w-full rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm": variant === "default"
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
