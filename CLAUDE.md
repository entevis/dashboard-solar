# Dashboard Solar

## Project Overview
Sistema de gestión de portafolios de inversión solar. Web app con Next.js 15 + TypeScript + Supabase + Prisma.

## Tech Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS v4 + shadcn/ui (New York style)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (PDFs)
- **Deploy**: Vercel

## Key Commands
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:push` - Push schema to DB
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio

## Project Structure
- `src/app/(auth)/` - Public auth pages (login)
- `src/app/(dashboard)/` - Authenticated pages
- `src/app/api/` - API routes
- `src/components/ui/` - shadcn/ui components
- `src/components/` - App-specific components
- `src/lib/auth/` - Role-based access control
- `src/lib/services/` - Business logic services
- `src/lib/supabase/` - Supabase client utilities
- `prisma/schema.prisma` - Database schema

## Design System — "The Architectural Calm"
- **Fonts**: Manrope (headlines/display) + Inter (body/labels) — never DM Sans
- **Primary**: #004ac6 (primary), #2563eb (primary-container)
- **Surfaces**: structure via background shifts, NOT borders. `surface-container-lowest` (#fff) on `surface-container-low` (#eff4ff) = elevation
- **No-Line Rule**: do NOT use 1px solid borders to section content — use bg color shifts
- **Radii**: 8px buttons/inputs, 12px cards — never 9999px except chips/tags
- **Shadows**: always tinted (`rgba(13,28,46,0.06)`) — never pure black
- **Tokens**: defined in `src/app/globals.css` — use `--color-*` CSS vars or Tailwind utilities
- **Tables**: no horizontal dividers — use row hover bg (`surface-container-low`) for separation
- **Inputs**: no border by default — `surface-container-low` bg + 2px primary ghost border on focus

## Conventions
- All tables use soft delete (`active`: 1=visible, 0=deleted)
- All tables have `created_at`, `updated_at`, `active`
- Plant entity is called `PowerPlant` (table: `power_plants`)
- Client entity is `Customer` (table: `customers`), separate from `User`
- User roles: MAESTRO, OPERATIVO, CLIENTE, CLIENTE_PERFILADO
- All data queries must filter by user role via `getAccessiblePowerPlantIds()`
- Billing module uses abstract interface (Duemint integration pending)
- Spanish language for UI, English for code
