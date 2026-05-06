import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  // ── Spacing — base 7px instead of 8px for a denser feel ─────────────
  spacing: 7,

  // ── Palette ─────────────────────────────────────────────────────────
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",       // primary-container (button bg)
      dark: "#004ac6",       // primary (links, accents)
      light: "#dbe1ff",      // primary-fixed
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#495c95",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ba1a1a",
      light: "#ffdad6",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#F97316",
    },
    success: {
      main: "#22C55E",
    },
    background: {
      default: "#f8f9ff",    // background
      paper: "#ffffff",      // surface-container-lowest
    },
    text: {
      primary: "#0d1c2e",    // on-surface
      secondary: "#434655",  // on-surface-variant
    },
    divider: "#c3c6d7",      // outline-variant
  },

  // ── Typography ───────────────────────────────────────────────────────
  typography: {
    fontFamily: 'var(--font-archivo-narrow), "Archivo Narrow", sans-serif',
    h1: { fontFamily: 'var(--font-archivo-narrow), "Archivo Narrow", sans-serif', fontWeight: 700 },
    h2: { fontFamily: 'var(--font-archivo-narrow), "Archivo Narrow", sans-serif', fontWeight: 700 },
    h3: { fontFamily: 'var(--font-archivo-narrow), "Archivo Narrow", sans-serif', fontWeight: 700 },
    h4: { fontFamily: 'var(--font-archivo-narrow), "Archivo Narrow", sans-serif', fontWeight: 600 },
    h5: { fontFamily: 'var(--font-archivo-narrow), "Archivo Narrow", sans-serif', fontWeight: 600 },
    h6: { fontFamily: 'var(--font-archivo-narrow), "Archivo Narrow", sans-serif', fontWeight: 600 },
    // Page title
    pageTitle: {
      fontFamily: 'var(--font-archivo-narrow), "Archivo Narrow", sans-serif',
      fontSize: "1.5rem",   // 24px
      fontWeight: 700,
      lineHeight: 1.3,
      color: "#0d1c2e",
    },
    // Section title
    sectionTitle: {
      fontFamily: 'var(--font-archivo-narrow), "Archivo Narrow", sans-serif',
      fontSize: "1.25rem",  // 20px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "0.8125rem", // 13px — main body
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.75rem",   // 12px — secondary
      lineHeight: 1.5,
    },
    caption: {
      fontSize: "0.6875rem", // 11px
      lineHeight: 1.4,
    },
    overline: {
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
    },
  },

  // ── Shape ────────────────────────────────────────────────────────────
  shape: {
    borderRadius: 8,        // base radius (buttons, inputs)
  },

  // ── Shadows ──────────────────────────────────────────────────────────
  shadows: [
    "none",
    "0 1px 3px rgba(13,28,46,0.06)",                     // 1 — subtle
    "0 4px 12px rgba(13,28,46,0.08)",                    // 2 — cards
    "0 8px 20px rgba(13,28,46,0.10)",                    // 3
    "0 12px 28px rgba(13,28,46,0.10)",                   // 4
    "0 20px 40px rgba(13,28,46,0.06)",                   // 5 — ambient/modals
    ...Array(19).fill("none"),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any,

  // ── Component overrides ──────────────────────────────────────────────
  components: {
    // Button
    MuiButton: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontFamily: 'var(--font-archivo-narrow), "Archivo Narrow", sans-serif',
          fontWeight: 500,
          fontSize: "0.8125rem",
          boxShadow: "none",
          padding: "5px 14px",
          "&:hover": { boxShadow: "none" },
          "&:active": { boxShadow: "none" },
        },
        sizeSmall: {
          fontSize: "0.8125rem",
          padding: "4px 12px",
        },
        containedPrimary: {
          backgroundColor: "#2563eb",
          "&:hover": { backgroundColor: "#1d4ed8" },
        },
        outlinedPrimary: {
          borderColor: "#c3c6d7",
          color: "#0d1c2e",
          backgroundColor: "#d5e3fc",
          "&:hover": {
            backgroundColor: "#dce9ff",
            borderColor: "#c3c6d7",
          },
        },
        textPrimary: {
          color: "#434655",
          "&:hover": {
            backgroundColor: "#eff4ff",
            color: "#0d1c2e",
          },
        },
      },
    },

    // Card
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(13,28,46,0.08)",
          backgroundColor: "#ffffff",
          backgroundImage: "none",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "16px",
          "&:last-child": { paddingBottom: "16px" },
        },
      },
    },

    // Paper (used by dropdowns, dialogs, etc.)
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        rounded: {
          borderRadius: 12,
        },
      },
    },

    // TextField / Input
    MuiOutlinedInput: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#eff4ff",
          fontSize: "0.8125rem",
          "& fieldset": { borderColor: "transparent" },
          "&:hover fieldset": { borderColor: "transparent" },
          "&.Mui-focused fieldset": {
            borderColor: "#2563eb",
            borderWidth: 2,
          },
        },
        inputSizeSmall: {
          padding: "6px 12px",
        },
      },
    },
    MuiInputLabel: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: {
          fontSize: "0.8125rem",
          color: "#434655",
          "&.Mui-focused": { color: "#2563eb" },
        },
        sizeSmall: {
          fontSize: "0.8125rem",
        },
      },
    },

    // Select
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#eff4ff",
          fontSize: "0.875rem",
        },
      },
    },

    // Table
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: "#eff4ff",
            color: "#434655",
            fontSize: "0.6875rem",
            fontWeight: 600,
            textTransform: "none",
            letterSpacing: "0.01em",
            borderBottom: "none",
            whiteSpace: "nowrap",
            padding: "8px 12px",
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#eff4ff",
          },
          "& .MuiTableCell-root": {
            borderBottom: "none",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "none",
          fontSize: "0.8125rem",
          color: "#0d1c2e",
          padding: "7px 12px",
        },
      },
    },

    // Chip (replaces Badge)
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontFamily: 'var(--font-archivo-narrow), "Archivo Narrow", sans-serif',
          fontSize: "0.6875rem",
          fontWeight: 600,
          height: 22,
        },
      },
    },

    // Dialog
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0 20px 40px rgba(13,28,46,0.12)",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-archivo-narrow), "Archivo Narrow", sans-serif',
          fontSize: "1rem",
          fontWeight: 600,
          padding: "16px 20px 10px",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "0 20px 16px",
        },
      },
    },

    // Tabs
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-archivo-narrow), "Archivo Narrow", sans-serif',
          fontSize: "0.8125rem",
          fontWeight: 500,
          textTransform: "none",
          minHeight: 40,
          padding: "8px 14px",
          color: "#434655",
          "&.Mui-selected": {
            color: "#004ac6",
            fontWeight: 600,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: {
          backgroundColor: "#004ac6",
          height: 2,
        },
      },
    },
    // Tooltip
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#0d1c2e",
          fontSize: "0.75rem",
          borderRadius: 6,
        },
      },
    },

    // AppBar (Topbar)
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 0 0 #c3c6d7",
          color: "#0d1c2e",
        },
      },
    },

    // Drawer (Sidebar)
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#ffffff",
          borderRight: "none",
          boxShadow: "1px 0 0 0 #c3c6d7",
        },
      },
    },

    // ListItemButton (nav items)
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "1px 8px",
          padding: "8px 10px",
          "&:hover": {
            backgroundColor: "#eff4ff",
            color: "#0d1c2e",
          },
          "&.Mui-selected": {
            backgroundColor: "#dbe1ff",
            color: "#0d1c2e",
            fontWeight: 600,
            "&:hover": { backgroundColor: "#dbe1ff" },
          },
        },
      },
    },
  },
});

// Extend MUI typography variants typings
declare module "@mui/material/styles" {
  interface TypographyVariants {
    pageTitle: React.CSSProperties;
    sectionTitle: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    pageTitle?: React.CSSProperties;
    sectionTitle?: React.CSSProperties;
  }
}
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    pageTitle: true;
    sectionTitle: true;
  }
}
