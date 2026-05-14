import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { SavingsAnalysisClient } from "@/components/savings/savings-analysis-client";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

interface Props {
  params: Promise<{ portfolioId: string }>;
}

export default async function SavingsAnalysisPage({ params }: Props) {
  const { portfolioId } = await params;
  const pid = parseInt(portfolioId);
  const user = await requireAuth();

  const plantFilter = await buildPlantAccessFilter(user);
  const plants = await prisma.powerPlant.findMany({
    where: { ...plantFilter, portfolioId: pid },
    select: { id: true, name: true, selfConsumptionDiscount: true },
    orderBy: { name: "asc" },
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          Análisis de Ahorro
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Compara el costo real con planta solar contra el costo hipotético sin ella.
        </Typography>
      </Box>

      {/* Intro */}
      <Card elevation={0} sx={{ bgcolor: "#fff", border: "1px solid #bbf7d0", borderRadius: 2, maxWidth: 560 }}>
        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: "#15803d", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            ¿Cómo funciona?
          </Typography>
          <Box sx={{ mt: 1.25, display: "flex", flexDirection: "column", gap: 1 }}>
            {[
              "Cada mes se suma lo pagado a S-Invest y a la distribuidora.",
              "Se estima cuánto habría costado comprar esa misma energía a tarifa plena, sin planta.",
              "La diferencia entre ambos escenarios es el ahorro concreto de la planta solar.",
              "Sube las boletas de la distribuidora en PDF digital para comenzar.",
            ].map((item) => (
              <Box key={item} sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#15803d", flexShrink: 0, mt: "5px" }} />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <SavingsAnalysisClient plants={plants} />
    </Box>
  );
}
