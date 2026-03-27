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

## Design System
- Font: DM Sans
- Primary: #2A6EF5, Success: #22C55E, Warning: #F97316
- Cards: border-radius 12px, subtle shadows
- Max 2 font weights per screen

## Conventions
- All tables use soft delete (`active`: 1=visible, 0=deleted)
- All tables have `created_at`, `updated_at`, `active`
- Plant entity is called `PowerPlant` (table: `power_plants`)
- Client entity is `Customer` (table: `customers`), separate from `User`
- User roles: MAESTRO, OPERATIVO, CLIENTE, CLIENTE_PERFILADO
- All data queries must filter by user role via `getAccessiblePowerPlantIds()`
- Billing module uses abstract interface (Duemint integration pending)
- Spanish language for UI, English for code
