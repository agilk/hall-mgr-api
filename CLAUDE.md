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

#### 4. Core Feature Modules ✅ FULLY IMPLEMENTED
**Status**: Production-ready

All core feature modules have been implemented with full CRUD operations:

**Implemented Modules:**
- **Users Module** - Complete user management with role-based access
- **Buildings Module** - Building management with soft delete support
- **Halls Module** - Hall management with building relationships
- **Rooms Module** - Room management with hall and building relationships
- **Exams Module** - Exam scheduling and status management
- **Assignments Module** - Supervisor-to-room assignments with workflow
- **Attendance Module** - Participant attendance tracking
- **Violations Module** - Exam rule violation reporting and resolution
- **Feedback Module** - Two-way communication with tree structure support
- **Notifications Module** - System notification management
- **Documents Module** - File metadata management
- **Audit Logs Module** - Complete audit trail for all actions

**API Endpoints:**
Each module provides RESTful endpoints following the pattern `/api/v1/{module}`

**Files:**
```
src/modules/users/
src/modules/buildings/
src/modules/halls/
src/modules/rooms/
src/modules/exams/
src/modules/assignments/
src/modules/attendance/
src/modules/violations/
src/modules/feedback/
src/modules/notifications/
src/modules/documents/
src/modules/audit-logs/
```

#### 5. TypeORM Optimizations ✅ FULLY IMPLEMENTED
**Status**: Production-ready

Complete TypeORM optimization implementation with migrations, transaction patterns, and query optimizations:

**Implementation Details:**

**A. Migration System**
- Created `src/data-source.ts` for TypeORM CLI configuration
- Added migration scripts to package.json:
  - `npm run migration:generate` - Generate migrations from entity changes
  - `npm run migration:create` - Create empty migration
  - `npm run migration:run` - Run pending migrations
  - `npm run migration:revert` - Rollback last migration
  - `npm run migration:show` - Show migration status
- Updated app.module.ts to use migrations in production
- Added `DB_SYNCHRONIZE` environment variable for controlled schema sync

**B. Transaction Management**
- Created `TransactionUtil` class for clean transaction handling
- Methods:
  - `runInTransaction()` - Execute work within a transaction
  - `runWithQueryRunner()` - Use existing query runner
  - `savepoint()` - Create savepoints for partial rollbacks
- Updated SyncService to use TransactionUtil
- Created `@Transactional()` decorator for controller methods
- Created `TransactionInterceptor` for automatic transaction wrapping

**C. Query Optimizations**
- Added database indexes to frequently queried entities:
  - Assignment: Composite indexes on (supervisor_id, status), (exam_id, room_id), (status, created_at)
  - Attendance: Composite indexes on (exam_id, room_id), (participant_name), (status, exam_id)
- Optimized service methods to avoid N+1 queries:
  - Use `repository.update()` for simple field updates instead of loading full entity
  - Reduced duplicate queries in update operations
- Created comprehensive query optimization guide

**Configuration:**
```bash
# Database Configuration
DB_SYNCHRONIZE=false  # Use migrations instead of auto-sync
```

**Files:**
```
src/data-source.ts
src/migrations/README.md
src/common/utils/transaction.util.ts
src/common/decorators/transactional.decorator.ts
src/common/interceptors/transaction.interceptor.ts
QUERY_OPTIMIZATION_GUIDE.md
```

**Migration Workflow:**
1. Development: Set `DB_SYNCHRONIZE=true` or `NODE_ENV=development`
2. Make entity changes
3. Generate migration: `npm run migration:generate -- src/migrations/DescriptiveName`
4. Review and commit migration
5. Production: Run `npm run migration:run` before app startup

### ⏳ Pending Features

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
8. **QUERY_OPTIMIZATION_GUIDE.md** - TypeORM query optimization best practices
9. **CLAUDE.md** - This file - project status and Claude context

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

### Database Migrations

The application uses TypeORM migrations for production deployments. In development, you can optionally use `DB_SYNCHRONIZE=true` for rapid prototyping.

**Migration Commands:**
```bash
# Generate migration from entity changes
npm run migration:generate -- src/migrations/DescriptiveName

# Create empty migration
npm run migration:create -- src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

See `src/migrations/README.md` for detailed migration workflow.

## Recent Changes

### Latest Update (Current Session)
**Date**: 2025-11-14

**Implemented: TypeORM Optimizations - Migrations, Transactions & Query Performance**

Completed comprehensive TypeORM optimizations for production-ready performance:

**A. Migration System:**
- Created `src/data-source.ts` for TypeORM CLI
- Added 5 migration scripts to package.json (generate, create, run, revert, show)
- Updated app.module.ts to support both dev sync and production migrations
- Added `DB_SYNCHRONIZE` environment variable
- Created comprehensive migration workflow documentation

**B. Transaction Patterns:**
- Created `TransactionUtil` class with 3 methods:
  - `runInTransaction()` - Main transaction wrapper
  - `runWithQueryRunner()` - Nested transaction support
  - `savepoint()` - Partial rollback capability
- Refactored SyncService to use TransactionUtil (cleaner, more maintainable)
- Created `@Transactional()` decorator for controller methods
- Created `TransactionInterceptor` for automatic transaction handling

**C. Query Optimizations:**
- Added database indexes to Assignment entity (3 indexes)
- Added database indexes to Attendance entity (3 indexes)
- Optimized AssignmentsService:
  - `updateStatus()` - Use update() instead of double load
  - `recordArrival()` - Direct update, single load
  - `recordDeparture()` - Direct update, single load
- Optimized AttendanceService:
  - `markStatus()` - Use update() instead of double load
- Created `QUERY_OPTIMIZATION_GUIDE.md` with comprehensive best practices

**Changes:**
```
Created:
- src/data-source.ts
- src/migrations/README.md
- src/common/utils/transaction.util.ts
- src/common/decorators/transactional.decorator.ts
- src/common/interceptors/transaction.interceptor.ts
- QUERY_OPTIMIZATION_GUIDE.md

Modified:
- package.json (added 5 migration scripts)
- .env.example (added DB_SYNCHRONIZE)
- src/app.module.ts (migration support)
- src/sync/sync.service.ts (use TransactionUtil)
- src/modules/assignments/assignments.service.ts (query optimizations)
- src/modules/attendance/attendance.service.ts (query optimizations)
- src/entities/assignment.entity.ts (added indexes)
- src/entities/attendance.entity.ts (added indexes)

Documentation Updated:
- CLAUDE.md (added TypeORM Optimizations section)
```

**Performance Improvements:**
- Reduced N+1 queries in update operations (3 queries → 2 queries)
- Added composite indexes for common query patterns
- Cleaner transaction management with TransactionUtil
- Production-ready migration workflow

**Commits:**
- (Pending) Add TypeORM optimizations: migrations, transactions, and query performance

### Previous Update (Core Feature Modules)
**Date**: 2025-11-14

**Implemented: All Core Feature Modules**

Completed implementation of all core feature modules with full CRUD operations for Users, Buildings, Halls, Rooms, Exams, Assignments, Attendance, Violations, Feedback, Notifications, Documents, and Audit Logs modules.

## Next Steps

### Immediate Priorities

1. **Testing** (High Priority)
   - Unit tests for all core modules
   - Integration tests for API endpoints
   - E2E tests for critical workflows
   - Unit tests for sync service
   - Integration tests for external API

2. **Advanced Features** (Medium Priority)
   - WebSocket gateway for real-time monitoring
   - Real-time event broadcasting
   - Email notifications integration
   - File upload handling for documents module

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
2. **Modules**: All core feature modules are in `src/modules/` and fully functional
3. **Synchronization**: The sync system is in `src/sync/` and is production-ready
4. **Environment**: All configuration uses environment variables from `.env`
5. **Documentation**: Keep all `.md` files updated when making changes
6. **Migrations**: Use migrations for schema changes, never use `synchronize: true` in production
7. **Transactions**: Use `TransactionUtil` from `src/common/utils/transaction.util.ts`
8. **Query Optimization**: Follow patterns in `QUERY_OPTIMIZATION_GUIDE.md`

### Code Style:
- Use NestJS best practices
- Follow TypeORM conventions
- Use DTOs for request/response validation
- Implement proper error handling
- Add logging for critical operations
- Use `repository.update()` for simple field updates (avoid loading full entity)
- Add indexes to frequently queried columns
- Use `TransactionUtil.runInTransaction()` for multi-step operations

### Testing:
- Unit tests: `*.spec.ts` files alongside source
- E2E tests: `test/` directory
- Run tests: `npm test`

### Important Constraints:
- Never expose sensitive data in logs or errors
- Always use transactions for multi-step database operations
- Validate all external API responses
- Handle external API failures gracefully
- Never use `synchronize: true` in production
- Always add indexes to foreign keys and frequently queried columns
- Avoid N+1 queries - load relations explicitly or use update() for simple changes

## References

- **NestJS Documentation**: https://docs.nestjs.com/
- **TypeORM Documentation**: https://typeorm.io/
- **External Auth Service API**: See `API_DOCUMENTATION.md`
- **External Hall API**: See `DATA_SYNCHRONIZATION_STRATEGY.md`

---

**Last Updated**: 2025-11-14
**Status**: Active Development
**Phase**: Core Features Complete - Moving to Advanced Features & Testing
