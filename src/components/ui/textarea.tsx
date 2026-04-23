import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full resize-none rounded-xl border border-[var(--atlas-line)] bg-[rgba(255,249,238,0.74)] px-4 py-3.5 text-base leading-relaxed text-[var(--atlas-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.58)] transition-[border-color,box-shadow,background-color] duration-200 outline-none",
        "placeholder:text-[var(--atlas-muted)]",
        "focus:border-[var(--atlas-accent)] focus:ring-2 focus:ring-[rgba(203,153,79,0.18)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-[var(--atlas-coral)] aria-invalid:ring-[rgba(181,86,59,0.18)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
