import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

// Chips/tags only: full radius allowed per design system
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary-container)] text-white",
        secondary:
          "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]",
        destructive:
          "bg-[var(--color-error-container)] text-[var(--color-on-error-container)]",
        outline:
          "bg-transparent ring-1 ring-[var(--color-outline-variant)] text-[var(--color-on-surface)]",
        ghost:
          "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]",
        link:
          "text-[var(--color-primary)] underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
