import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium transition-[background-color,border-color,color] duration-200 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--atlas-ink)] text-[var(--atlas-paper-strong)] [a&]:hover:bg-[var(--atlas-teal)]",
        secondary:
          "border-transparent bg-[var(--atlas-accent-soft)] text-[var(--atlas-accent)] [a&]:hover:bg-[rgba(203,153,79,0.18)]",
        destructive:
          "border-transparent bg-[rgba(181,86,59,0.14)] text-[var(--atlas-coral)] [a&]:hover:bg-[rgba(181,86,59,0.2)]",
        outline:
          "border-[var(--atlas-line)] text-[var(--atlas-copy)] [a&]:hover:bg-[rgba(255,249,238,0.74)]",
        success:
          "border-transparent bg-[rgba(91,119,83,0.15)] text-[var(--atlas-jade)]",
        warning:
          "border-transparent bg-[rgba(194,139,63,0.17)] text-[var(--atlas-ochre)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge }
