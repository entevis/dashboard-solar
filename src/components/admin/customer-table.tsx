"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import { formatRut } from "@/lib/utils/formatters";
import { CustomerRowActions } from "@/components/admin/customer-row-actions";

interface Customer {
  id: number;
  name: string;
  rut: string;
  altName: string | null;
  createdAt: string;
  _count: { powerPlants: number; users: number };
}

export function CustomerTable({ customers }: { customers: Customer[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const filtered = q
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.rut.includes(q) ||
        (c.altName ?? "").toLowerCase().includes(q.toLowerCase())
      )
    : customers;

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Search */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <TextField
          size="small"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
          placeholder="Buscar por razón social o RUT..."
          sx={{ maxWidth: 320, "& .MuiOutlinedInput-root": { backgroundColor: "#eff4ff", "& fieldset": { borderColor: "transparent" }, "&:hover fieldset": { borderColor: "transparent" }, "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 } } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} /></InputAdornment> }}
        />
      </Box>

      {filtered.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 1.5 }}>
          <PersonOffOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
          <Typography fontSize="0.875rem" color="text.secondary">
            {q ? `Ningún cliente coincide con "${q}"` : "Crea el primer cliente para comenzar."}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ "& .MuiTableCell-head": { backgroundColor: "#eff4ff", fontSize: "0.75rem", fontWeight: 600 } }}>
                  <TableCell>Razón Social</TableCell>
                  <TableCell>RUT</TableCell>
                  <TableCell>Nombre alternativo</TableCell>
                  <TableCell>Plantas</TableCell>
                  <TableCell>Usuarios</TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((c) => (
                  <TableRow key={c.id} hover sx={{ "& .MuiTableCell-root": { fontSize: "0.8125rem", py: 1.25 } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{c.name}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace" }}>{formatRut(c.rut)}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{c.altName ?? "—"}</TableCell>
                    <TableCell>
                      <Chip label={c._count.powerPlants} size="small" sx={{ backgroundColor: "#eff4ff", color: "text.secondary", fontSize: "0.75rem", height: 20 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={c._count.users} size="small" sx={{ backgroundColor: "#eff4ff", color: "text.secondary", fontSize: "0.75rem", height: 20 }} />
                    </TableCell>
                    <TableCell>
                      <CustomerRowActions customer={c} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Filas:"
            sx={{ borderTop: "1px solid", borderColor: "divider", fontSize: "0.8125rem" }}
          />
        </>
      )}
    </Box>
  );
}
