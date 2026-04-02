import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
}

export function KpiCard({ label, value, sublabel, icon }: KpiCardProps) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={700} color="text.primary">{value}</Typography>
            {sublabel && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>{sublabel}</Typography>
            )}
          </Box>
          <Box sx={{ width: 40, height: 40, borderRadius: 1.5, backgroundColor: "#dbe1ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#004ac6", flexShrink: 0 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
