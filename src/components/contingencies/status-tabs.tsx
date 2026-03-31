"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "", label: "Todas" },
  { key: "OPEN", label: "Abiertas" },
  { key: "IN_PROGRESS", label: "En progreso" },
  { key: "CLOSED", label: "Cerradas" },
];

export function StatusTabs({ counts }: { counts: Record<string, number> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "";

  function handleClick(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key) {
      params.set("status", key);
    } else {
      params.delete("status");
    }
    router.push(`/contingencies?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 bg-[var(--color-secondary)] p-1 rounded-lg">
      {tabs.map((tab) => {
        const isActive = currentStatus === tab.key;
        const count = tab.key ? (counts[tab.key] ?? 0) : Object.values(counts).reduce((a, b) => a + b, 0);
        return (
          <button
            key={tab.key}
            onClick={() => handleClick(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
              isActive
                ? "bg-white text-[var(--color-foreground)] shadow-sm"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-[12px] opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
