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
- **Session Management**: Memory-based sessions via memorystore

The backend uses a storage abstraction pattern (`server/storage.ts`) that implements an `IStorage` interface, making it easier to swap data sources if needed.

### Data Storage
- **Database**: MongoDB Atlas
- **ODM**: Mongoose with custom schemas
- **Schema Location**: `server/mongodb.ts` contains all Mongoose model definitions
- **Types**: `shared/schema.ts` contains plain TypeScript interfaces with Zod validation

Key collections: users, roles, vendors, categories, products, orders, orderItems, cartItems, vendorStories, paymentRequests

### ID Format
- All IDs are MongoDB ObjectId strings (24-character hex strings)
- The storage layer handles conversion between string IDs and ObjectId types
- Frontend components and hooks use string IDs throughout

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts`: TypeScript interfaces and Zod schemas for type validation
- `routes.ts`: API endpoint definitions with Zod schemas for type-safe requests/responses
- `models/auth.ts`: User and session type definitions

### Build System
- **Development**: tsx for running TypeScript directly
- **Production Build**: Custom build script using esbuild (server) and Vite (client)
- **Output**: Server bundled to `dist/index.cjs`, client to `dist/public/`

## External Dependencies

### Authentication
- **Replit Auth**: OpenID Connect-based authentication via `openid-client` and Passport.js
- Sessions stored in memory using memorystore

### Database
- **MongoDB Atlas**: Primary data store, connection via `MONGODB_URI` environment variable
- Collections are automatically created when first documents are inserted

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, forms, etc.)
- **shadcn/ui**: Pre-styled components using Radix + Tailwind
- **Lucide React**: Icon library

### Key NPM Packages
- `mongoose`: MongoDB ODM
- `@tanstack/react-query`: Async state management
- `express-session` / `memorystore`: Session handling
- `framer-motion`: Animations
- `wouter`: Client-side routing

### Environment Variables Required
- `MONGODB_URI`: MongoDB Atlas connection string
- `SESSION_SECRET`: Secret for signing session cookies
- `ISSUER_URL`: OpenID Connect issuer (defaults to Replit's OIDC)
- `REPL_ID`: Automatically set by Replit environment

## Recent Changes

### MongoDB Migration (Jan 8, 2026)
- Migrated from PostgreSQL/Drizzle to MongoDB Atlas/Mongoose
- Created Mongoose models for all collections in `server/mongodb.ts`
- Rewrote storage layer in `server/storage.ts` to use MongoDB queries
- Updated session storage to use memorystore instead of PostgreSQL
- Converted all IDs to string format (MongoDB ObjectId)
- Updated frontend hooks to handle string IDs
