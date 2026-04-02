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
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { UserRowActions } from "@/components/admin/user-row-actions";
import type { UserRole } from "@prisma/client";

const roleSx: Record<UserRole, { backgroundColor: string; color: string }> = {
  MAESTRO: { backgroundColor: "#dbe1ff", color: "#004ac6" },
  OPERATIVO: { backgroundColor: "#fef9c3", color: "#a16207" },
  CLIENTE: { backgroundColor: "#dcfce7", color: "#15803d" },
  CLIENTE_PERFILADO: { backgroundColor: "#dcfce7", color: "#15803d" },
};

interface UserWithRelations {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  customerId: number | null;
  assignedPortfolioId: number | null;
  customer: { id: number; name: string; rut: string } | null;
  assignedPortfolio: { id: number; name: string } | null;
  createdAt: Date;
}

interface Option { id: number; name: string }

interface Props {
  users: UserWithRelations[];
  customers: Option[];
  portfolios: Option[];
  currentUserId: number;
}

export function UserTable({ users, customers, portfolios, currentUserId }: Props) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const filtered = q
    ? users.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
    : users;

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", border: "1px solid", borderColor: "divider", borderRadius: 2, backgroundColor: "white", overflow: "hidden" }}>
      {/* Search */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <TextField
          size="small"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
          placeholder="Buscar por nombre o email..."
          sx={{ maxWidth: 320, "& .MuiOutlinedInput-root": { backgroundColor: "#eff4ff", "& fieldset": { borderColor: "transparent" }, "&:hover fieldset": { borderColor: "transparent" }, "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 } } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} /></InputAdornment> }}
        />
      </Box>

      {filtered.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 1.5 }}>
          <GroupOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
          <Typography fontSize="0.875rem" color="text.secondary">
            {q ? `Ningún usuario coincide con "${q}".` : "Crea el primer usuario para dar acceso al sistema."}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ "& .MuiTableCell-head": { backgroundColor: "#eff4ff", fontSize: "0.75rem", fontWeight: 600 } }}>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Cliente / Portafolio</TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((user) => (
                  <TableRow key={user.id} hover sx={{ "& .MuiTableCell-root": { fontSize: "0.8125rem", py: 1.25 } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{user.name}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{user.email}</TableCell>
                    <TableCell>
                      <Chip label={ROLE_LABELS[user.role]} size="small" sx={{ ...roleSx[user.role], fontSize: "0.75rem", height: 22, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {user.customer ? user.customer.name : user.assignedPortfolio ? user.assignedPortfolio.name : "—"}
                    </TableCell>
                    <TableCell>
                      <UserRowActions user={user} customers={customers} portfolios={portfolios} currentUserId={currentUserId} />
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
