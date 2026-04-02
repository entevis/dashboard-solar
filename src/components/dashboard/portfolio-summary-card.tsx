import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";

interface PortfolioSummaryCardProps {
  name: string;
  plantCount: number;
  totalCapacityKw: number;
  activePlants: number;
  customerCount: number;
  logoUrl: string | null;
  href: string;
}

export function PortfolioSummaryCard({ name, plantCount, totalCapacityKw, activePlants, customerCount, logoUrl, href }: PortfolioSummaryCardProps) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <Link href={href} style={{ display: "block", textDecoration: "none" }}>
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", transition: "all 200ms", "&:hover": { borderColor: "#004ac6", boxShadow: "0 4px 12px rgba(13,28,46,0.08)" } }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 88, height: 40, borderRadius: 1, overflow: "hidden", backgroundColor: "#eff4ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {logoUrl
                ? <Image src={logoUrl} alt={`Logo ${name}`} width={88} height={40} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
                : <Typography fontSize="0.8125rem" fontWeight={600} color="primary.main">{initials}</Typography>
              }
            </Box>
            <Typography fontSize="0.875rem" fontWeight={600} color="text.primary" noWrap>{name}</Typography>
          </Box>

          <Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />

          <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, flex: 1 }}>
              {[
                { label: "clientes", value: customerCount },
                { label: "plantas activas", value: activePlants },
              ].map((s) => (
                <Box key={s.label}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{s.label}</Typography>
                  <Typography fontSize="1.125rem" fontWeight={700} color="text.primary" sx={{ lineHeight: 1 }}>{s.value}</Typography>
                </Box>
              ))}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>capacidad</Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                  <BoltOutlinedIcon sx={{ fontSize: 12, color: "#a16207", mb: 0.25 }} />
                  <Typography fontSize="1.125rem" fontWeight={700} color="text.primary" sx={{ lineHeight: 1 }}>
                    {Math.round(totalCapacityKw).toLocaleString("es-CL")}
                    <Box component="span" sx={{ fontSize: "0.75rem", fontWeight: 400, color: "text.secondary", ml: 0.5 }}>kW</Box>
                  </Typography>
                </Box>
              </Box>
            </Box>
            <ChevronRightOutlinedIcon sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0, transition: "color 150ms", ".MuiCard-root:hover &": { color: "#004ac6" } }} />
          </Box>
        </CardContent>
      </Card>
    </Link>
  );
}
