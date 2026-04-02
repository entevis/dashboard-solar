import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary: bg #2563eb, white text → 5.4:1 ✓
        default:
          "bg-[var(--color-primary-container)] text-white hover:bg-[var(--color-primary)] active:scale-[0.98]",
        // Destructive: bg #ba1a1a, white text → 8.5:1 ✓
        destructive:
          "bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90",
        // Secondary/Outline: dark text on light bg → on-surface on surface-container-highest
        outline:
          "bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]",
        secondary:
          "bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]",
        // Ghost: primary text on transparent, hover bg is primary-fixed (light blue)
        // on-surface (#0d1c2e) on primary-fixed (#dbe1ff) → 13.5:1 ✓
        ghost:
          "text-[var(--color-primary)] hover:bg-[var(--color-primary-fixed)] hover:text-[var(--color-on-surface)]",
        link:
          "text-[var(--color-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs:      "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm:      "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg:      "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon:    "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
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

export { Button, buttonVariants }
