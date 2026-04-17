"use client";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#eff4ff",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "transparent" },
    "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 },
  },
};

interface Option {
  id: number;
  name: string;
  secondary?: string;
}

interface SearchableSelectProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  allOption?: string;
}

export function SearchableSelect({ label, options, value, onChange, required, disabled, placeholder, allOption }: SearchableSelectProps) {
  const allOpt: Option | null = allOption ? { id: -1, name: allOption } : null;
  const fullOptions = allOpt ? [allOpt, ...options] : options;
  const selected = value === "all" && allOpt ? allOpt : options.find((o) => String(o.id) === value) ?? (allOpt || null);

  return (
    <Autocomplete
      size="small"
      options={fullOptions}
      value={selected}
      onChange={(_, newValue) => {
        if (!newValue) onChange(allOpt ? "all" : "");
        else if (newValue.id === -1) onChange("all");
        else onChange(String(newValue.id));
      }}
      getOptionLabel={(o) => o.secondary ? `${o.name} (${o.secondary})` : o.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      disabled={disabled}
      noOptionsText="Sin resultados"
      renderOption={(props, option) => {
        const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: string };
        return (
          <Box component="li" key={key} {...rest} sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start !important", py: "6px !important" }}>
            <Typography fontSize="0.8125rem" fontWeight={option.id === -1 ? 600 : 500}>{option.name}</Typography>
            {option.secondary && (
              <Typography fontSize="0.6875rem" color="text.secondary">{option.secondary}</Typography>
            )}
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          placeholder={placeholder ?? "Buscar..."}
          sx={inputSx}
        />
      )}
    />
  );
}
