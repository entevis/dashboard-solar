import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "md" ? "py-14 px-6 gap-3" : "py-10 px-4 gap-2",
        className
      )}
    >
      <div className={cn(
        "rounded-xl bg-[var(--color-secondary)] flex items-center justify-center text-[var(--color-muted-foreground)]",
        size === "md" ? "w-12 h-12" : "w-9 h-9"
      )}>
        <Icon className={cn(size === "md" ? "w-5 h-5" : "w-4 h-4")} aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className={cn(
          "font-medium text-[var(--color-foreground)]",
          size === "md" ? "text-body" : "text-label"
        )}>
          {title}
        </p>
        {description && (
          <p className={cn(
            "text-[var(--color-muted-foreground)] max-w-xs",
            size === "md" ? "text-label" : "text-caption"
          )}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
