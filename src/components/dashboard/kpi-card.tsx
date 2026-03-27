import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
}

export function KpiCard({ label, value, sublabel, icon }: KpiCardProps) {
  return (
    <Card className="border-[var(--color-border)] shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[12px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
              {label}
            </p>
            <p className="text-2xl font-bold text-[var(--color-foreground)] mt-1">
              {value}
            </p>
            {sublabel && (
              <p className="text-[12px] text-[var(--color-muted-foreground)] mt-1">
                {sublabel}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
