import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface Alert {
  id: number;
  plantName: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <Card className="border-[var(--color-border)] shadow-sm">
        <CardHeader className="pb-3">
          <h3 className="text-[14px] font-medium text-[var(--color-foreground)]">
            Contingencias abiertas
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            No hay contingencias abiertas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--color-border)] shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-medium text-[var(--color-foreground)]">
            Contingencias abiertas
          </h3>
          <Badge
            variant="secondary"
            className="text-[11px] bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
          >
            {alerts.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-background)]"
          >
            <AlertTriangle className="w-4 h-4 text-[var(--color-warning)] mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[var(--color-foreground)] truncate">
                {alert.plantName}
              </p>
              <p className="text-[12px] text-[var(--color-muted-foreground)] truncate">
                {alert.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] h-5">
                  {alert.type === "PREVENTIVE" ? "Preventivo" : "Correctivo"}
                </Badge>
                <span className="text-[11px] text-[var(--color-muted-foreground)]">
                  {alert.createdAt}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
