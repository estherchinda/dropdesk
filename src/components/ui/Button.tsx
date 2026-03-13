import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger" | "none"
  size?: "default" | "sm" | "lg" | "icon" | "none"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "none", size = "none", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          {
            "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 shadow-sm px-4 py-2": variant !== "none",
            "bg-indigo-600 text-white hover:bg-indigo-700": variant === "default",
            "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900": variant === "outline",
            "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800 shadow-none": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700": variant === "danger",
            "h-10 px-5 py-2": size === "default",
            "h-8 px-4 py-1.5 text-xs": size === "sm",
            "h-12 px-8 py-3 text-base": size === "lg",
            "h-10 w-10 p-2.5": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
