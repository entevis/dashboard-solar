"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";

interface Props {
  invoiceId: number;
  duemintId: string | null;
  isPaid: boolean;
  url: string | null;
  pdfUrl: string | null;
  reportUrl: string | null;
  reportBackHref?: string;
}

export function InvoiceRowActions({ invoiceId, duemintId, isPaid, url, pdfUrl, reportUrl, reportBackHref }: Props) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setAnchorEl(null);
    setRefreshing(true);
    try {
      await fetch(`/api/billing/invoices/${invoiceId}`, { method: "PATCH" });
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label="Acciones de factura"
        aria-expanded={Boolean(anchorEl)}
        aria-haspopup="true"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ width: 28, height: 28, color: "text.secondary" }}
      >
        {refreshing
          ? <CircularProgress size={14} color="inherit" />
          : <MoreVertOutlinedIcon sx={{ fontSize: 16 }} />
        }
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{ paper: { sx: { width: 192, mt: 0.5 } } }}
      >
        {!isPaid && (
          <MenuItem onClick={handleRefresh} disabled={refreshing} sx={{ fontSize: "0.8125rem", gap: 1.5 }}>
            <RefreshOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
            Actualizar estado
          </MenuItem>
        )}
        {!isPaid && (url || pdfUrl) && <Divider />}
        {url && (
          <MenuItem component="a" href={url} target="_blank" rel="noopener noreferrer" onClick={() => setAnchorEl(null)} sx={{ fontSize: "0.8125rem", gap: 1.5 }}>
            <OpenInNewOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
            Ver en Duemint
          </MenuItem>
        )}
        {pdfUrl && (
          <MenuItem component="a" href={pdfUrl} target="_blank" rel="noopener noreferrer" onClick={() => setAnchorEl(null)} sx={{ fontSize: "0.8125rem", gap: 1.5 }}>
            <PictureAsPdfOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
            Descargar PDF
          </MenuItem>
        )}
        {reportUrl && (
          <>
            {(url || pdfUrl) && <Divider />}
            <MenuItem component="a" href={reportUrl} target="_blank" rel="noopener noreferrer" onClick={() => setAnchorEl(null)} sx={{ fontSize: "0.8125rem", gap: 1.5 }}>
              <AssessmentOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
              Ver reporte
            </MenuItem>
            {duemintId && (
              <MenuItem component={Link} href={`/report/${duemintId}${reportBackHref ? `?back=${encodeURIComponent(reportBackHref)}` : ""}`} onClick={() => setAnchorEl(null)} sx={{ fontSize: "0.8125rem", gap: 1.5 }}>
                <AssessmentOutlinedIcon sx={{ fontSize: 15, color: "#2563eb" }} />
                Ver nuevo reporte
              </MenuItem>
            )}
          </>
        )}
      </Menu>
    </>
  );
}
