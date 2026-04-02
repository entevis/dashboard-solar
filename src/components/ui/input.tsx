import * as React from "react"
import { cn } from "@/lib/utils"

// No border by default — surface-container-low bg
// Focus: same bg + 2px primary ghost border
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md px-3 py-1 text-sm transition-[color,box-shadow] outline-none",
        "bg-[var(--color-surface-container-low)] text-[var(--color-on-surface)]",
        "placeholder:text-[var(--color-on-surface-variant)]",
        "border border-transparent",
        "focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/20",
        "aria-invalid:border-[var(--color-error)] aria-invalid:bg-[var(--color-error-container)]/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "selection:bg-[var(--color-primary-fixed-dim)] selection:text-[var(--color-on-surface)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
