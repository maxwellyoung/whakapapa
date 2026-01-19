import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-base text-stone-900 shadow-sm shadow-stone-900/5 transition-all duration-200 outline-none",
        "placeholder:text-stone-400 dark:placeholder:text-stone-500",
        "dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-100",
        "hover:border-stone-300 dark:hover:border-stone-600",
        "focus:border-stone-400 focus:ring-2 focus:ring-stone-400/20 dark:focus:border-stone-500 dark:focus:ring-stone-500/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:text-stone-700 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium dark:file:text-stone-300",
        "aria-invalid:border-red-400 aria-invalid:ring-red-400/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
