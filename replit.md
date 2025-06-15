# ecoKART - Sustainable E-commerce Platform

## Overview

ecoKART is a sustainable e-commerce platform built as a full-stack web application that connects eco-conscious consumers with verified sustainable products. The platform focuses on environmental impact tracking, rewarding users for eco-friendly purchases, and providing a marketplace for certified sustainable sellers.

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite for build tooling
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom eco-friendly color scheme
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

### Architecture Pattern
The application follows a monorepo structure with clear separation between client, server, and shared code:
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Common schemas and types shared between frontend and backend

## Key Components

### Database Schema (PostgreSQL + Drizzle)
- **Users**: User profiles with eco-impact tracking (total points, CO2 saved)
- **Sellers**: Business verification system with certification tracking
- **Categories**: Product categorization system
- **Products**: Product catalog with sustainability metrics
- **Shopping Cart**: User cart management
- **Orders**: Order processing and tracking
- **CO2 Contributions**: Environmental impact tracking per transaction
- **Sessions**: Secure session management for authentication

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication using PostgreSQL session store
- Secure cookie management with HTTP-only flags
- User profile management with automatic user creation

### API Structure
RESTful API with the following main endpoints:
- `/api/auth/*` - Authentication routes
- `/api/products` - Product catalog management (buyers see only verified products)
- `/api/cart` - Shopping cart operations
- `/api/orders` - Order management
- `/api/stats` - User and global statistics
- `/api/sellers/*` - Seller registration, product management, and verification
- `/api/admin/*` - Product verification and admin functions
- `/api/company/*` - Company dashboard, employee management, and points redemption

### Frontend Architecture
- Component-based React architecture
- Custom hook system for authentication (`useAuth`)
- Responsive design with mobile-first approach
- Real-time cart updates using TanStack Query
- Form validation using React Hook Form with Zod schemas

## Data Flow

### User Journey
1. **Landing Page**: Unauthenticated users see promotional content
2. **Authentication**: Users authenticate via Replit Auth
3. **Product Discovery**: Browse products with sustainability filters
4. **Shopping Cart**: Add products with real-time cart updates
5. **Checkout**: Secure payment processing with CO2 impact calculation
6. **Order Tracking**: View order history and environmental impact

### Seller Journey
1. **Registration**: Apply to become a verified seller with business credentials
2. **Account Verification**: Admin reviews seller application and certifications
3. **Product Management**: Add/edit products with sustainability metrics
4. **Product Verification**: All products reviewed for sustainability compliance
5. **Dashboard**: Track sales, verification status, and environmental impact

### Company Journey
1. **Auto-Organization**: Users automatically grouped by email domain
2. **Dashboard Access**: View company-wide environmental impact metrics
3. **Employee Tracking**: Monitor individual employee CO2 savings and purchases
4. **Points Management**: Redeem company points for environmental initiatives
5. **Team Management**: Add employees to company organization
6. **Impact Reporting**: Track collective sustainability achievements

### Data Processing
- Real-time CO2 impact calculations
- Points system for eco-friendly purchases
- Global statistics aggregation
- Product search and filtering
- Seller registration and verification system
- Product verification for sustainability compliance
- Company dashboard for organizational environmental tracking
- Employee CO2 impact aggregation by company domain
- Company points management and redemption system

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL connection via Neon
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI components
- **react-hook-form**: Form handling and validation
- **zod**: Schema validation
- **tailwindcss**: Utility-first CSS framework

### Authentication
- **openid-client**: OpenID Connect client
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **vite**: Fast build tool and dev server
- **typescript**: Type safety
- **eslint**: Code linting
- **prettier**: Code formatting

## Deployment Strategy

### Replit Deployment
- Configured for Replit's autoscale deployment
- Environment variables for database and authentication
- Automatic builds using npm scripts
- Port configuration for external access (5000 → 80)

### Build Process
1. **Development**: `npm run dev` - Runs both frontend and backend in development mode
2. **Build**: `npm run build` - Creates production builds for both client and server
3. **Production**: `npm run start` - Serves the production application

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit application identifier
- `ISSUER_URL`: OpenID Connect issuer URL

## Changelog

```
Changelog:
- June 15, 2025. Initial setup
- June 15, 2025. Added Company Dashboard feature with organizational environmental tracking
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```