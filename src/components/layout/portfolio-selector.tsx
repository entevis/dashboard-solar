"use client";

import { usePathname, useRouter } from "next/navigation";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Box from "@mui/material/Box";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";

interface Portfolio { id: number; name: string }
interface Props {
  portfolios: Portfolio[];
  selectedPortfolioId?: number | null;
}

const COOKIE_NAME = "portfolio_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function PortfolioSelector({ portfolios, selectedPortfolioId }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const urlMatch = pathname.match(/^\/(\d+)(\/|$)/);
  const currentId = urlMatch ? parseInt(urlMatch[1]) : selectedPortfolioId;

  function handleChange(value: string) {
    const id = parseInt(value);
    document.cookie = `${COOKIE_NAME}=${id}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    router.push(`/${id}/power-plants`);
    router.refresh();
  }

  return (
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <Select
        value={currentId ? String(currentId) : ""}
        onChange={(e) => handleChange(String(e.target.value))}
        displayEmpty
        renderValue={(value) => {
          const portfolio = portfolios.find((p) => String(p.id) === value);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ApartmentOutlinedIcon sx={{ fontSize: 15, color: "#434655", flexShrink: 0 }} />
              <span style={{ fontSize: "0.8125rem", color: "#0d1c2e" }}>
                {portfolio?.name ?? "Seleccionar portafolio"}
              </span>
            </Box>
          );
        }}
        sx={{
          height: 32,
          backgroundColor: "#eff4ff",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#c3c6d7" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: 2 },
          "& .MuiSelect-select": { py: "4px", px: "10px" },
        }}
      >
        {portfolios.map((p) => (
          <MenuItem key={p.id} value={String(p.id)} sx={{ fontSize: "0.8125rem" }}>
            {p.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
