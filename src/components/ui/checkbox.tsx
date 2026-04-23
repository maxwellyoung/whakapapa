"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-[var(--atlas-line)] bg-[rgba(255,249,238,0.74)] text-[var(--atlas-paper-strong)] shadow-xs outline-none transition-[background-color,border-color,box-shadow] data-[state=checked]:border-[var(--atlas-accent)] data-[state=checked]:bg-[var(--atlas-accent)] focus-visible:border-[var(--atlas-accent)] focus-visible:ring-[3px] focus-visible:ring-[rgba(203,153,79,0.2)] aria-invalid:border-[var(--atlas-coral)] aria-invalid:ring-[rgba(181,86,59,0.18)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
