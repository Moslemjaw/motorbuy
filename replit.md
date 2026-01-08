# MotorBuy - Multi-Vendor Car Parts Marketplace

## Overview

MotorBuy is a modern, multi-vendor e-commerce platform for automotive parts built with a full-stack TypeScript architecture. The platform supports three user roles (Customer, Vendor, Admin) and enables vendors to list car parts while customers browse, compare, and purchase from multiple sellers. The system uses Replit Auth for authentication and is designed to be payment-gateway ready.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite with custom Replit plugins for development
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom automotive-themed color palette
- **Animations**: Framer Motion for page transitions

The frontend follows a pages-based architecture with reusable components. Custom hooks in `client/src/hooks/` abstract API calls and authentication logic.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: REST endpoints defined in `shared/routes.ts` with Zod validation
- **Authentication**: Replit OpenID Connect integration with Passport.js
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple

The backend uses a storage abstraction pattern (`server/storage.ts`) that implements an `IStorage` interface, making it easier to swap data sources if needed.

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via `drizzle-kit push`

Key tables: users, sessions, roles, vendors, categories, products, orders, orderItems, cartItems, vendorStories

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts`: Database table definitions and TypeScript types
- `routes.ts`: API endpoint definitions with Zod schemas for type-safe requests/responses
- `models/auth.ts`: User and session table definitions required by Replit Auth

### Build System
- **Development**: tsx for running TypeScript directly
- **Production Build**: Custom build script using esbuild (server) and Vite (client)
- **Output**: Server bundled to `dist/index.cjs`, client to `dist/public/`

## External Dependencies

### Authentication
- **Replit Auth**: OpenID Connect-based authentication via `openid-client` and Passport.js
- Sessions stored in PostgreSQL using the `sessions` table

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Required Tables**: The `sessions` and `users` tables are mandatory for Replit Auth

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, forms, etc.)
- **shadcn/ui**: Pre-styled components using Radix + Tailwind
- **Lucide React**: Icon library

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `@tanstack/react-query`: Async state management
- `express-session` / `connect-pg-simple`: Session handling
- `framer-motion`: Animations
- `wouter`: Client-side routing

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for signing session cookies
- `ISSUER_URL`: OpenID Connect issuer (defaults to Replit's OIDC)
- `REPL_ID`: Automatically set by Replit environment