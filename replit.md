# CodeJira - ITIL & CMDB Integration Platform

## Overview
CodeJira is an ITIL (Information Technology Infrastructure Library) and CMDB (Configuration Management Database) integration platform built for Jira integration, supporting incident management, change management, and monitoring.

## Recent Changes
- **2025-09-21**: Initial project setup and configuration for Replit environment
- Fixed TypeScript configuration with proper Node.js and DOM types
- Updated Vite config to allow all hosts for Replit proxy support
- Set up PostgreSQL database with complete schema
- Created basic test server for environment verification
- Configured deployment settings for production

## User Preferences
- Language: English/Vietnamese documentation support
- Architecture: Full-stack TypeScript application
- Database: PostgreSQL with Drizzle ORM
- Frontend: React + Vite + Tailwind CSS + Radix UI

## Project Architecture

### Frontend (React)
- **Location**: `client/` directory
- **Build Tool**: Vite with React plugin
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: React Query for data fetching
- **Routing**: Wouter (lightweight routing)
- **Components**: Pre-built UI components in `client/src/components/ui/`

### Backend (Express + TypeScript)
- **Location**: `server/` directory
- **Runtime**: Node.js with tsx for TypeScript execution
- **Framework**: Express with TypeScript
- **Database**: Drizzle ORM with PostgreSQL
- **API**: RESTful API with validation using Zod schemas

### Database Schema
Successfully created tables:
- `users` - User authentication
- `configuration_items` - CMDB items with metadata
- `tickets` - ITIL tickets (Incident, Problem, Change)
- `ci_relationships` - Configuration item relationships
- `sla_metrics` - SLA tracking and breach monitoring

### Configuration Files
- `vite.config.ts` - Frontend build configuration with host allowance
- `drizzle.config.ts` - Database configuration
- `tsconfig.json` - TypeScript configuration with Node.js types
- `tailwind.config.ts` - Tailwind CSS configuration

## Current Status
- ✅ Database schema created and ready
- ✅ Basic server running on port 5000
- ✅ TypeScript configuration fixed
- ✅ Vite configuration updated for Replit proxy
- ✅ Deployment configuration set for autoscale
- ⚠️ NPM package installation challenges (using alternative approaches)
- 🔄 Working on full TypeScript application setup

## Development Setup
- Database URL: Available via environment variables
- Port: 5000 (configured for Replit environment)
- Host: 0.0.0.0 with allowedHosts: true

## API Endpoints (Planned)
- `/api/health` - Health check
- `/api/cis` - Configuration items CRUD
- `/api/tickets` - Ticket management
- `/api/sla-metrics` - SLA tracking
- `/api/dashboard` - Dashboard data aggregation

## Known Issues
- NPM package installation timeouts (working around with alternatives)
- Some TypeScript diagnostics remaining (5 minor issues)

## Next Steps
1. Complete TypeScript application setup
2. Test frontend-backend integration
3. Implement authentication
4. Add Jira integration features