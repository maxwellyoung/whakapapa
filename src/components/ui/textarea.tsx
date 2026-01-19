import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3.5 text-base text-stone-900 shadow-sm shadow-stone-900/5 transition-all duration-200 outline-none resize-none leading-relaxed",
        "placeholder:text-stone-400 dark:placeholder:text-stone-500",
        "dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-100",
        "focus:border-stone-400 focus:ring-2 focus:ring-stone-400/20 dark:focus:border-stone-500 dark:focus:ring-stone-500/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-red-400 aria-invalid:ring-red-400/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
