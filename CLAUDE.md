# CLAUDE.md - Exam Supervision Management System

## Project Overview

This is a comprehensive exam supervision management system built with NestJS, designed to streamline the management of exam supervisors, their assignments, and real-time exam oversight. The system integrates with external services for authentication and exam data synchronization.

## Current Implementation Status

### ✅ Completed Features

#### 1. Project Setup & Database Schema
- NestJS project initialized with TypeORM
- PostgreSQL database configuration
- Complete entity models defined:
  - User, Building, Hall, Room, Exam
  - Assignment, Attendance, Violation
  - Feedback, Notification, Document, AuditLog
  - Participant, SyncLog (for synchronization)

#### 2. Data Synchronization System ✅ FULLY IMPLEMENTED
**Status**: Production-ready

The system now includes automated synchronization with an external exam management system:

**Implementation Details:**
- **Entities Created:**
  - `Participant` - Stores synced room participant data
  - `SyncLog` - Tracks synchronization history and status
  - Updated `Building` entity with external sync fields (external_id, sync_status, etc.)
  - Updated `Room` entity with external sync fields

- **Services:**
  - `ExternalHallApiService` - HTTP client for external exam management API
  - `SyncService` - Main synchronization service with automated scheduling

- **Scheduled Jobs:**
  - **2:00 AM Daily** - Syncs exam halls and rooms from external system
  - **3:00 AM Daily** - Syncs room participants for 3 days ahead (today, tomorrow, day after tomorrow)

- **API Endpoints:**
  - `POST /api/v1/sync/exam-halls` - Manual halls/rooms sync
  - `POST /api/v1/sync/participants/:date` - Manual sync for specific date
  - `POST /api/v1/sync/participants/next-3-days` - Manual sync for next 3 days
  - `GET /api/v1/sync/status` - Get sync status

- **Features:**
  - Transaction-based sync for data consistency
  - Sync logging and status tracking
  - Error handling and recovery
  - Manual trigger endpoints for on-demand synchronization

**Configuration:**
```bash
# Environment variables required
EXTERNAL_HALL_API_URL=https://exam-system.example.com
EXTERNAL_HALL_API_TOKEN=your-jwt-token-here
```

**Files:**
```
src/entities/participant.entity.ts
src/entities/sync-log.entity.ts
src/sync/external-hall-api.service.ts
src/sync/sync.service.ts
src/sync/sync.controller.ts
src/sync/sync.module.ts
```

#### 3. Authentication & Authorization ✅ FULLY IMPLEMENTED
**Status**: Production-ready

The system now includes complete authentication and authorization:

**Implementation Details:**
- **Auth Module:**
  - JWT-based authentication with Passport
  - Token refresh mechanism
  - 2FA (Two-Factor Authentication) with Speakeasy
  - QR code generation for 2FA setup
  - Global JWT guard with @Public decorator support

- **Security Features:**
  - Password hashing with bcrypt
  - JWT access tokens (configurable lifetime, default: 30m)
  - JWT refresh tokens (configurable lifetime, default: 240h)
  - 2FA with TOTP (Time-based One-Time Password)
  - Role-based access control (RBAC) infrastructure

- **API Endpoints:**
  - `POST /api/v1/auth/register` - User registration
  - `POST /api/v1/auth/login` - User login (with 2FA support)
  - `POST /api/v1/auth/refresh` - Refresh access token
  - `POST /api/v1/auth/logout` - Logout (client-side)
  - `POST /api/v1/auth/2fa/setup` - Setup 2FA (returns QR code)
  - `POST /api/v1/auth/2fa/verify` - Verify 2FA code
  - `POST /api/v1/auth/2fa/disable` - Disable 2FA
  - `GET /api/v1/auth/me` - Get current user profile

- **Guards & Decorators:**
  - `JwtAuthGuard` - Global JWT authentication guard
  - `RolesGuard` - Role-based authorization guard
  - `@Public()` - Mark endpoints as public (skip auth)
  - `@Roles()` - Require specific roles
  - `@CurrentUser()` - Inject current user into controller

- **Configuration:**
```bash
# Environment variables required
JWT_SECRET=your-secret-key-change-this-in-production
ACCESS_TOKEN_LIFETIME=30m
REFRESH_TOKEN_LIFETIME=240h
APP_NAME=Exam Supervision System
```

**Files:**
```
src/modules/auth/auth.module.ts
src/modules/auth/auth.service.ts
src/modules/auth/auth.controller.ts
src/modules/auth/strategies/jwt.strategy.ts
src/modules/auth/guards/jwt-auth.guard.ts
src/modules/auth/guards/roles.guard.ts
src/modules/auth/dto/login.dto.ts
src/modules/auth/dto/register.dto.ts
src/modules/auth/dto/verify-2fa.dto.ts
src/common/decorators/current-user.decorator.ts
src/common/decorators/roles.decorator.ts
src/common/decorators/public.decorator.ts
```

### ⏳ Pending Features

#### Core Feature Modules
- [ ] Users module
- [ ] Buildings/Halls/Rooms modules
- [ ] Exams module
- [ ] Assignments module
- [ ] Attendance tracking module
- [ ] Violations module
- [ ] Feedback module
- [ ] Notifications module
- [ ] Documents module
- [ ] Audit logging module

#### Advanced Features
- [ ] WebSocket gateway for real-time monitoring
- [ ] Real-time event broadcasting
- [ ] Email notifications
- [ ] File upload handling
- [ ] Advanced search and filtering

#### Frontend
- [ ] Vue 3 application setup
- [ ] UI/UX implementation
- [ ] State management with Pinia
- [ ] Real-time updates integration

## Architecture

### Tech Stack
- **Backend**: NestJS (Node.js)
- **Database**: PostgreSQL with TypeORM
- **Scheduling**: @nestjs/schedule
- **HTTP Client**: @nestjs/axios
- **Authentication**: External Auth Service + JWT (pending)
- **2FA**: Speakeasy (TOTP) (pending)
- **API Documentation**: Swagger/OpenAPI (pending)
- **Validation**: class-validator, class-transformer

### Database Design

#### Synchronized Entities (from External System)
- **Buildings** - Exam halls with external_id tracking
- **Rooms** - Rooms with external_id tracking
- **Participants** - Room participants (synced for 3 days ahead)

#### Local Entities
- **Users** - Supervisors, managers, directors
- **Assignments** - Supervisor-to-room assignments
- **Attendance** - Participant attendance tracking
- **Violations** - Exam rule violations
- **Feedback** - Two-way communication
- **Notifications** - System notifications
- **Documents** - File management
- **AuditLog** - Complete audit trail
- **SyncLog** - Synchronization history

### External Integrations

1. **External Authorization Service** (Pending Implementation)
   - Base URL: `/api/mqm-app-auth`
   - User authentication and authorization
   - MFA support
   - See `API_DOCUMENTATION.md` for details

2. **External Exam Management System** ✅ IMPLEMENTED
   - Base URL: `/api/external-app/*`
   - Endpoints:
     - `GET /exam-halls` - Get all exam halls with rooms
     - `GET /hall-rooms/:hallId` - Get rooms by hall ID
     - `GET /room-participants/:examDate` - Get participants by date
   - See `DATA_SYNCHRONIZATION_STRATEGY.md` for details

## Documentation

### Available Documentation Files

1. **README.md** - Project overview, installation, and getting started
2. **API_DOCUMENTATION.md** - External API endpoints documentation (auth + sync)
3. **ARCHITECTURE_OVERVIEW.md** - High-level system architecture
4. **BACKEND_TECHNICAL_SPEC.md** - Detailed backend technical specifications
5. **FRONTEND_TECHNICAL_SPEC.md** - Frontend architecture and components
6. **DATA_SYNCHRONIZATION_STRATEGY.md** - Synchronization architecture and implementation
7. **IMPLEMENTATION_ROADMAP.md** - Development phases and timeline
8. **CLAUDE.md** - This file - project status and Claude context

## Development Guide

### Environment Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure:
   - Database credentials
   - External Hall API URL and token
   - (Future) External Auth Service URL
4. Run development server: `npm run start:dev`

### Building the Project

```bash
npm run build
```

### Database Synchronization

The application uses TypeORM with `synchronize: true` in development, which automatically creates/updates database tables based on entities.

For production, migrations should be used:
```bash
npm run migration:generate
npm run migration:run
```

## Recent Changes

### Latest Update (Current Session)
**Date**: 2025-11-14

**Implemented: Authentication & Authorization Module (Phase 1, Week 2)**

Completed the full authentication and authorization system:
- Implemented JWT-based authentication with Passport
- Added token refresh mechanism
- Integrated 2FA (Two-Factor Authentication) with Speakeasy
- Created QR code generation for 2FA setup
- Added global JWT guard with @Public decorator support
- Implemented role-based access control infrastructure

**Changes:**
```
Modified:
- src/app.module.ts (added global JWT guard)
- src/app.controller.ts (added @Public decorator)
- src/modules/auth/guards/jwt-auth.guard.ts (enhanced with @Public support)
- src/modules/auth/auth.controller.ts (added @Public to public endpoints)

Created:
- src/common/decorators/public.decorator.ts

Documentation Updated:
- CLAUDE.md (marked authentication as completed)
```

**Commits:**
- (Pending) Complete Phase 1, Week 2: Authentication & Authorization Module

### Previous Update
**Date**: 2025-11-14

**Implemented: Daily Data Synchronization**

Added complete data synchronization system for external exam management integration:
- Created Participant and SyncLog entities
- Updated Building and Room entities with sync metadata
- Implemented ExternalHallApiService for API integration
- Created SyncService with automated scheduling
- Added manual trigger endpoints
- Configured daily sync jobs (2 AM for halls/rooms, 3 AM for participants)

## Next Steps

### Immediate Priorities

1. **Core Modules** (High Priority - Next Phase)
   - Users module with CRUD operations
   - Buildings/Halls/Rooms management
   - Exams module
   - Assignments workflow

3. **Testing** (Medium Priority)
   - Unit tests for sync service
   - Integration tests for external API
   - E2E tests for critical flows

### Future Enhancements

1. **Sync System Improvements**
   - Add unit tests for synchronization
   - Implement error notifications (email/webhook)
   - Create sync status dashboard (frontend)
   - Add performance monitoring
   - Implement webhook support for real-time sync

2. **Advanced Features**
   - WebSocket real-time monitoring
   - Email notifications
   - Advanced reporting and analytics
   - Mobile app support

## Notes for Claude/AI Assistants

### Working with this project:

1. **Database Schema**: All entities are in `src/entities/` using TypeORM decorators
2. **Modules**: New feature modules should be created in `src/modules/` (not yet created)
3. **Synchronization**: The sync system is in `src/sync/` and is production-ready
4. **Environment**: All configuration uses environment variables from `.env`
5. **Documentation**: Keep all `.md` files updated when making changes

### Code Style:
- Use NestJS best practices
- Follow TypeORM conventions
- Use DTOs for request/response validation
- Implement proper error handling
- Add logging for critical operations

### Testing:
- Unit tests: `*.spec.ts` files alongside source
- E2E tests: `test/` directory
- Run tests: `npm test`

### Important Constraints:
- Never expose sensitive data in logs or errors
- Always use transactions for multi-step database operations
- Validate all external API responses
- Handle external API failures gracefully

## References

- **NestJS Documentation**: https://docs.nestjs.com/
- **TypeORM Documentation**: https://typeorm.io/
- **External Auth Service API**: See `API_DOCUMENTATION.md`
- **External Hall API**: See `DATA_SYNCHRONIZATION_STRATEGY.md`

---

**Last Updated**: 2025-11-14
**Status**: Active Development
**Phase**: Foundation & Core Features
