import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 [a&]:hover:bg-stone-800 dark:[a&]:hover:bg-stone-200",
        secondary:
          "border-transparent bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 [a&]:hover:bg-stone-200 dark:[a&]:hover:bg-stone-700",
        destructive:
          "border-transparent bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 [a&]:hover:bg-red-200 dark:[a&]:hover:bg-red-900/50",
        outline:
          "border-stone-200 text-stone-600 dark:border-stone-700 dark:text-stone-400 [a&]:hover:bg-stone-50 dark:[a&]:hover:bg-stone-800",
        success:
          "border-transparent bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        warning:
          "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
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

export { Badge, badgeVariants }
