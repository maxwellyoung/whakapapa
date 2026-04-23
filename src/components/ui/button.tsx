import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-[180ms] ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--atlas-paper)] select-none",
  {
    variants: {
      variant: {
        default: "border border-[rgba(69,45,31,0.18)] bg-[var(--atlas-ink)] text-[#fff8ec] shadow-[0_10px_24px_rgba(69,45,31,0.16)] hover:bg-[#3b281e]",
        destructive:
          "border border-[#8f3f34]/20 bg-[#9f4638] text-white shadow-[0_10px_24px_rgba(159,70,56,0.18)] hover:bg-[#87382e]",
        outline:
          "border border-[var(--atlas-line)] bg-[rgba(255,250,244,0.76)] text-[var(--atlas-copy)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] hover:border-[var(--atlas-line-strong)] hover:bg-[rgba(255,248,239,0.96)] hover:text-[var(--atlas-ink)]",
        secondary:
          "border border-[rgba(203,153,79,0.18)] bg-[var(--atlas-accent-soft)] text-[var(--atlas-accent)] hover:bg-[rgba(203,153,79,0.2)]",
        ghost:
          "text-[var(--atlas-copy)] hover:bg-[rgba(203,153,79,0.08)] hover:text-[var(--atlas-ink)]",
        link: "text-[var(--atlas-accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 rounded-xl px-6 has-[>svg]:px-4 text-base",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
