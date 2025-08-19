# EcoScrap Pickup - E-Waste Collection Platform

## Overview

EcoScrap Pickup is a full-stack web application that facilitates eco-friendly electronic waste collection through drone pickup services. The platform allows users to schedule pickups for electronic waste items, earn EcoPoints for their environmental contributions, and track their impact through certificates and rewards. The application features user authentication, admin management capabilities, and a comprehensive rewards system that gamifies environmental responsibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Simple session-based authentication with bcryptjs for password hashing
- **File Uploads**: Multer middleware for handling image uploads with file type and size validation
- **Development**: Hot module replacement with Vite middleware integration

### Database Schema
- **Users Table**: Stores user credentials, profile information, eco-points, total weight collected, and admin status
- **Pickup Requests Table**: Tracks e-waste pickup requests with status, weight, photos, AI verification, and points awarded
- **Certificates Table**: Records environmental certificates with CO2 savings calculations

### Data Storage Strategy
- **Development**: In-memory storage implementation for rapid prototyping and testing
- **Production Ready**: Configured for PostgreSQL with Neon database support
- **Schema Management**: Drizzle Kit for database migrations and schema evolution

### Authentication & Authorization
- **User Authentication**: Username/password based login with bcrypt password hashing
- **Session Management**: Simplified session handling with user ID headers
- **Role-Based Access**: Admin users have access to management features and pickup completion workflows
- **Route Protection**: Client-side route guards based on authentication status

### API Design
- **RESTful Endpoints**: Standard HTTP methods for CRUD operations
- **Request Validation**: Zod schemas for runtime type checking and validation
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **File Upload API**: Secure image upload with type validation and size limits

### Development Workflow
- **Hot Reload**: Vite development server with Express middleware integration
- **Type Safety**: Full TypeScript coverage from database schema to frontend components
- **Code Organization**: Clear separation between client, server, and shared code
- **Build Process**: Optimized production builds with static asset generation

## External Dependencies

### UI and Styling
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: For component variant management

### Backend Services
- **Neon Database**: Serverless PostgreSQL database provider
- **Bcryptjs**: Password hashing and verification
- **Multer**: File upload middleware for Express
- **Connect PG Simple**: PostgreSQL session store (configured but not actively used)

### Development Tools
- **Vite**: Build tool and development server
- **TSX**: TypeScript execution environment
- **ESBuild**: Fast JavaScript bundler for production builds
- **Drizzle Kit**: Database migration and introspection tool

### Validation and Forms
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Performance-oriented form library
- **Hookform Resolvers**: Integration between React Hook Form and Zod

### State Management
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates
- **Date-fns**: Date manipulation and formatting utilities