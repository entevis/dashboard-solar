import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

interface Alert {
  id: number;
  plantName: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography fontSize="0.875rem" fontWeight={600}>Contingencias abiertas</Typography>
        {alerts.length > 0 && (
          <Chip label={alerts.length} size="small" sx={{ backgroundColor: "#fef9c3", color: "#a16207", fontWeight: 700, fontSize: "0.6875rem", height: 20 }} />
        )}
      </Box>
      <CardContent>
        {alerts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No hay contingencias abiertas</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {alerts.slice(0, 5).map((alert) => (
              <Box key={alert.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 1.5, borderRadius: 1.5, backgroundColor: "#fafafa" }}>
                <WarningAmberOutlinedIcon sx={{ fontSize: 16, color: "#a16207", mt: 0.25, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontSize="0.8125rem" fontWeight={500} noWrap>{alert.plantName}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{alert.description}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    <Chip label={alert.type === "PREVENTIVE" ? "Preventivo" : "Correctivo"} size="small" variant="outlined" sx={{ fontSize: "0.625rem", height: 18 }} />
                    <Typography variant="caption" color="text.secondary">{alert.createdAt}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
