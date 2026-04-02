"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";

const tabs = [
  { key: "",           label: "Todas" },
  { key: "OPEN",       label: "Abiertas" },
  { key: "IN_PROGRESS",label: "En progreso" },
  { key: "CLOSED",     label: "Cerradas" },
];

export function StatusTabs({ counts }: { counts: Record<string, number> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "";

  function handleChange(_: React.SyntheticEvent, key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key) params.set("status", key); else params.delete("status");
    router.push(`/contingencies?${params.toString()}`);
  }

  return (
    <Tabs value={currentStatus} onChange={handleChange} sx={{ borderBottom: 1, borderColor: "divider" }}>
      {tabs.map((tab) => {
        const count = tab.key ? (counts[tab.key] ?? 0) : Object.values(counts).reduce((a, b) => a + b, 0);
        return (
          <Tab
            key={tab.key}
            value={tab.key}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                {tab.label}
                <Box component="span" sx={{ fontSize: "0.6875rem", opacity: 0.6, fontWeight: 400 }}>{count}</Box>
              </Box>
            }
          />
        );
      })}
    </Tabs>
  );
}
