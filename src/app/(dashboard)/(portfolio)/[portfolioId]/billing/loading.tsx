import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export default function BillingLoading() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 3 }}>
      {/* Header */}
      <Box>
        <Skeleton variant="text" width={220} height={32} />
        <Skeleton variant="text" width={160} height={20} sx={{ mt: 0.25 }} />
      </Box>

      {/* Filter bar */}
      <Skeleton variant="rounded" height={48} sx={{ borderRadius: 2 }} />

      {/* KPI cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 2 }}>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Skeleton variant="text" width={80} height={16} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width={120} height={28} />
              <Skeleton variant="text" width={60} height={14} />
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Table */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* Table header */}
        <Box sx={{ display: "flex", gap: 2, px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
          {[60, 120, 100, 80, 80, 80, 70].map((w, i) => (
            <Skeleton key={i} variant="text" width={w} height={18} />
          ))}
        </Box>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Box key={i} sx={{ display: "flex", gap: 2, px: 2, py: 1.75, borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: "none" } }}>
            {[60, 120, 100, 80, 80, 80, 70].map((w, j) => (
              <Skeleton key={j} variant="text" width={w} height={16} sx={{ opacity: 1 - i * 0.08 }} />
            ))}
          </Box>
        ))}
      </Card>
    </Box>
  );
}
