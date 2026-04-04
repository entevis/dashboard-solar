"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
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
  phone: string | null;
  jobTitle: string | null;
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
  total: number;
  page: number;
  rowsPerPage: number;
}

type SortKey = "name" | "email" | "role" | "customer";
type SortDir = "asc" | "desc";

function getAssociated(u: UserWithRelations): string {
  return u.customer?.name ?? u.assignedPortfolio?.name ?? "";
}

function sortUsers(users: UserWithRelations[], key: SortKey, dir: SortDir): UserWithRelations[] {
  return [...users].sort((a, b) => {
    let va: string;
    let vb: string;
    switch (key) {
      case "name":     va = a.name;          vb = b.name;          break;
      case "email":    va = a.email;         vb = b.email;         break;
      case "role":     va = a.role;          vb = b.role;          break;
      case "customer": va = getAssociated(a); vb = getAssociated(b); break;
    }
    const cmp = va.localeCompare(vb, "es");
    return dir === "asc" ? cmp : -cmp;
  });
}

export function UserTable({ users, customers, portfolios, currentUserId, total, page, rowsPerPage }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`?${params.toString()}`);
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function col(key: SortKey) {
    return {
      active: sortKey === key,
      direction: sortKey === key ? sortDir : ("asc" as SortDir),
      onClick: () => handleSort(key),
    };
  }

  const sorted = useMemo(() => sortUsers(users, sortKey, sortDir), [users, sortKey, sortDir]);

  return (
    <Box>
      {total === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 1.5 }}>
          <GroupOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
          <Typography fontSize="0.875rem" color="text.secondary">
            Ningún usuario coincide con los filtros aplicados.
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    "& .MuiTableCell-head": { backgroundColor: "#eff4ff" },
                    "& .MuiTableSortLabel-root": { fontSize: "0.75rem", fontWeight: 600 },
                    "& .MuiTableSortLabel-root.Mui-active": { color: "#004ac6" },
                    "& .MuiTableSortLabel-icon": { fontSize: "0.9rem !important" },
                  }}
                >
                  <TableCell><TableSortLabel {...col("name")}>Nombre</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel {...col("email")}>Email</TableSortLabel></TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Teléfono</TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Cargo</TableCell>
                  <TableCell><TableSortLabel {...col("role")}>Rol</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel {...col("customer")}>Cliente / Portafolio</TableSortLabel></TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((user) => (
                  <TableRow key={user.id} hover sx={{ "& .MuiTableCell-root": { fontSize: "0.8125rem", py: 1.25 } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{user.name}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{user.email}</TableCell>
                    <TableCell sx={{ color: "text.secondary", display: { xs: "none", lg: "table-cell" } }}>{user.phone ?? "—"}</TableCell>
                    <TableCell sx={{ color: "text.secondary", display: { xs: "none", lg: "table-cell" } }}>{user.jobTitle ?? "—"}</TableCell>
                    <TableCell>
                      <Chip label={ROLE_LABELS[user.role]} size="small" sx={{ ...roleSx[user.role], fontSize: "0.6875rem", height: 20, fontWeight: 600 }} />
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
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => updateParam("page", p > 0 ? String(p) : "")}
            onRowsPerPageChange={(e) => { updateParam("pageSize", e.target.value); updateParam("page", ""); }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Filas:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            sx={{
              borderTop: "none",
              fontSize: "0.75rem",
              flexShrink: 0,
              "& .MuiTablePagination-toolbar": { minHeight: 40, px: 1.5 },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.75rem" },
            }}
          />
        </>
      )}
    </Box>
  );
}
