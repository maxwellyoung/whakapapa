import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-xl border border-[var(--atlas-line)] bg-[rgba(255,249,238,0.74)] px-4 py-3 text-base text-[var(--atlas-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.58)] transition-[border-color,box-shadow,background-color] duration-200 outline-none",
        "placeholder:text-[var(--atlas-muted)]",
        "hover:border-[var(--atlas-line-strong)] hover:bg-[rgba(255,251,244,0.92)]",
        "focus:border-[var(--atlas-accent)] focus:ring-2 focus:ring-[rgba(203,153,79,0.18)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--atlas-copy)]",
        "aria-invalid:border-[var(--atlas-coral)] aria-invalid:ring-[rgba(181,86,59,0.18)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
