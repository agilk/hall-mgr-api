# Backend Technical Specification
# Exam Supervision Management System

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Design](#api-design)
6. [Authentication & Authorization](#authentication--authorization)
7. [Module Structure](#module-structure)
8. [Implementation Details](#implementation-details)
9. [Code Quality](#code-quality)
10. [Testing Strategy](#testing-strategy)
11. [Deployment](#deployment)

---

## Overview

The Exam Supervision Management System backend is a RESTful API built with NestJS that manages exam supervisors, their assignments, and real-time exam oversight. The system integrates with an external authorization service and provides role-based access control.

### Key Features
- External authentication service integration
- Role-based access control (RBAC)
- Real-time monitoring via WebSockets
- File upload and management
- Comprehensive audit logging
- Email and in-app notifications
- 2FA support (TOTP)

---

## Technology Stack

### Core Framework
- **NestJS v11.x**: Progressive Node.js framework
- **TypeScript v5.x**: Type-safe JavaScript
- **Node.js v18+**: Runtime environment

### Database & ORM
- **PostgreSQL v14+**: Primary database
- **Sequelize v6.x**: ORM for database operations
  - **sequelize-typescript**: TypeScript decorators for models
  - **pg**: PostgreSQL driver
  - **pg-hstore**: Support for PostgreSQL hstore data type

**Note**: Current implementation uses TypeORM. Migration to Sequelize is recommended.

### Logging
- **Winston v3.x**: Logging framework
  - **winston-daily-rotate-file**: Log rotation
  - Custom formatters for JSON and pretty-print
  - Multiple transports (console, file, error file)

### Authentication & Security
- **@nestjs/passport**: Authentication middleware
- **passport-jwt**: JWT strategy
- **bcrypt**: Password hashing
- **speakeasy**: TOTP for 2FA
- **qrcode**: QR code generation for 2FA setup

### Validation & Transformation
- **class-validator**: DTO validation
- **class-transformer**: Object transformation

### API Documentation
- **@nestjs/swagger**: OpenAPI/Swagger documentation
- **swagger-ui-express**: Swagger UI

### Real-time Communication
- **@nestjs/websockets**: WebSocket support
- **socket.io**: Real-time bi-directional communication

### File Upload
- **multer**: Multipart/form-data handling
- **@nestjs/platform-express**: Express adapter for file uploads

### Code Quality
- **ESLint**: Linting
  - @typescript-eslint/parser
  - @typescript-eslint/eslint-plugin
- **Prettier**: Code formatting
  - eslint-config-prettier
  - eslint-plugin-prettier

### Testing
- **Jest**: Testing framework
- **@nestjs/testing**: NestJS testing utilities
- **supertest**: HTTP testing

### Environment & Configuration
- **@nestjs/config**: Configuration management
- **dotenv**: Environment variables

---

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         API Layer (Controllers)          │
│  - HTTP Endpoints                        │
│  - WebSocket Gateways                    │
│  - Request Validation                    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│       Business Logic (Services)          │
│  - Business Rules                        │
│  - Data Processing                       │
│  - External Service Integration          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Data Access (Repositories)       │
│  - Sequelize Models                      │
│  - Database Operations                   │
│  - Query Building                        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│            PostgreSQL Database           │
└─────────────────────────────────────────┘
```

### Module Architecture

```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module
│
├── config/                    # Configuration
│   ├── database.config.ts     # Sequelize configuration
│   ├── auth.config.ts         # Auth service config
│   ├── jwt.config.ts          # JWT configuration
│   └── winston.config.ts      # Winston logger config
│
├── common/                    # Shared resources
│   ├── decorators/            # Custom decorators
│   │   ├── roles.decorator.ts
│   │   ├── current-user.decorator.ts
│   │   └── api-docs.decorator.ts
│   ├── guards/                # Guards
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── 2fa.guard.ts
│   ├── interceptors/          # Interceptors
│   │   ├── logging.interceptor.ts
│   │   ├── transform.interceptor.ts
│   │   └── timeout.interceptor.ts
│   ├── filters/               # Exception filters
│   │   ├── http-exception.filter.ts
│   │   └── all-exceptions.filter.ts
│   ├── pipes/                 # Custom pipes
│   │   └── validation.pipe.ts
│   └── utils/                 # Utility functions
│       ├── hash.util.ts
│       └── pagination.util.ts
│
├── models/                    # Sequelize models
│   ├── user.model.ts
│   ├── building.model.ts
│   ├── hall.model.ts
│   ├── room.model.ts
│   ├── exam.model.ts
│   ├── assignment.model.ts
│   ├── attendance.model.ts
│   ├── violation.model.ts
│   ├── feedback.model.ts
│   ├── notification.model.ts
│   ├── document.model.ts
│   └── audit-log.model.ts
│
├── modules/                   # Feature modules
│   ├── auth/                  # Authentication
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   │
│   ├── users/                 # User management
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   ├── buildings/             # Building management
│   │   ├── buildings.module.ts
│   │   ├── buildings.controller.ts
│   │   ├── buildings.service.ts
│   │   └── dto/
│   │
│   ├── halls/                 # Hall management
│   ├── rooms/                 # Room management
│   ├── exams/                 # Exam management
│   ├── assignments/           # Assignment management
│   ├── attendance/            # Attendance tracking
│   ├── violations/            # Violation reporting
│   ├── feedback/              # Feedback system
│   ├── notifications/         # Notification system
│   ├── documents/             # Document management
│   ├── monitoring/            # Real-time monitoring (WebSocket)
│   ├── audit/                 # Audit logging
│   └── external-auth/         # External auth service client
│
└── database/                  # Database related
    ├── migrations/            # Sequelize migrations
    ├── seeders/               # Database seeders
    └── database.providers.ts  # Sequelize providers
```

---

## Database Schema

### Users Table
```typescript
// models/user.model.ts
@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  @Column({ unique: true })
  externalUserId: string; // From external auth service

  @Column
  username: string;

  @Column
  fullName: string;

  @Column
  firstName: string;

  @Column
  middleName: string;

  @Column
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column
  phone: string;

  @Column
  personalId: string;

  @Column({ type: DataType.ENUM('male', 'female', 'other') })
  gender: string;

  @Column({ type: DataType.DATE })
  birthday: Date;

  @Column
  profilePhoto: string;

  @Column({ defaultValue: true })
  isActive: boolean;

  @Column({ defaultValue: false })
  isApproved: boolean; // For supervisor approval

  @Column({ defaultValue: false })
  mfaEnabled: boolean;

  @Column
  mfaSecret: string;

  @Column({ type: DataType.JSONB })
  roles: string[]; // ['supervisor', 'building_manager', 'exam_director']

  @HasMany(() => Assignment)
  assignments: Assignment[];

  @BelongsToMany(() => Building, () => BuildingManager)
  managedBuildings: Building[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### Buildings Table
```typescript
@Table({
  tableName: 'buildings',
  timestamps: true,
})
export class Building extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  @Column
  name: string;

  @Column
  code: string;

  @Column
  address: string;

  @Column
  description: string;

  @Column({ defaultValue: true })
  isActive: boolean;

  @HasMany(() => Hall)
  halls: Hall[];

  @BelongsToMany(() => User, () => BuildingManager)
  managers: User[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### Halls Table
```typescript
@Table({
  tableName: 'halls',
  timestamps: true,
})
export class Hall extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  @ForeignKey(() => Building)
  @Column
  buildingId: number;

  @BelongsTo(() => Building)
  building: Building;

  @Column
  name: string;

  @Column
  floor: number;

  @Column
  description: string;

  @HasMany(() => Room)
  rooms: Room[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### Rooms Table
```typescript
@Table({
  tableName: 'rooms',
  timestamps: true,
})
export class Room extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  @ForeignKey(() => Hall)
  @Column
  hallId: number;

  @BelongsTo(() => Hall)
  hall: Hall;

  @Column
  name: string;

  @Column
  capacity: number;

  @Column
  description: string;

  @HasMany(() => Assignment)
  assignments: Assignment[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### Exams Table
```typescript
@Table({
  tableName: 'exams',
  timestamps: true,
})
export class Exam extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  @Column
  title: string;

  @Column
  code: string;

  @Column({ type: DataType.TEXT })
  description: string;

  @Column({ type: DataType.DATE })
  startTime: Date;

  @Column({ type: DataType.DATE })
  endTime: Date;

  @Column({ type: DataType.ENUM('scheduled', 'in_progress', 'completed', 'cancelled') })
  status: string;

  @HasMany(() => Assignment)
  assignments: Assignment[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### Assignments Table
```typescript
@Table({
  tableName: 'assignments',
  timestamps: true,
})
export class Assignment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  @ForeignKey(() => Exam)
  @Column
  examId: number;

  @BelongsTo(() => Exam)
  exam: Exam;

  @ForeignKey(() => Room)
  @Column
  roomId: number;

  @BelongsTo(() => Room)
  room: Room;

  @ForeignKey(() => User)
  @Column
  supervisorId: number;

  @BelongsTo(() => User)
  supervisor: User;

  @Column({ type: DataType.ENUM('offered', 'accepted', 'rejected', 'confirmed', 'completed', 'no_show', 'no_supervisor_needed') })
  status: string;

  @Column({ type: DataType.DATE })
  offerSentAt: Date;

  @Column({ type: DataType.DATE })
  respondedAt: Date;

  @Column({ type: DataType.DATE })
  checkInTime: Date;

  @Column({ type: DataType.DATE })
  checkOutTime: Date;

  @Column({ type: DataType.TEXT })
  notes: string;

  @HasMany(() => Attendance)
  attendanceRecords: Attendance[];

  @HasMany(() => Violation)
  violations: Violation[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### Attendance Table
```typescript
@Table({
  tableName: 'attendance',
  timestamps: true,
})
export class Attendance extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  @ForeignKey(() => Assignment)
  @Column
  assignmentId: number;

  @BelongsTo(() => Assignment)
  assignment: Assignment;

  @Column
  participantName: string;

  @Column
  participantId: string;

  @Column
  seatNumber: string;

  @Column({ type: DataType.ENUM('present', 'absent', 'late', 'excused') })
  status: string;

  @Column({ type: DataType.DATE })
  markedAt: Date;

  @Column({ type: DataType.TEXT })
  notes: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### Violations Table
```typescript
@Table({
  tableName: 'violations',
  timestamps: true,
})
export class Violation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  @ForeignKey(() => Assignment)
  @Column
  assignmentId: number;

  @BelongsTo(() => Assignment)
  assignment: Assignment;

  @Column({ type: DataType.ENUM('cheating', 'phone_use', 'talking', 'unauthorized_material', 'other') })
  violationType: string;

  @Column
  participantName: string;

  @Column
  participantId: string;

  @Column({ type: DataType.TEXT })
  description: string;

  @Column({ type: DataType.DATE })
  occurredAt: Date;

  @Column({ type: DataType.ENUM('reported', 'under_review', 'confirmed', 'dismissed') })
  status: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### Feedback Table
```typescript
@Table({
  tableName: 'feedback',
  timestamps: true,
})
export class Feedback extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  @ForeignKey(() => Assignment)
  @Column
  assignmentId: number;

  @BelongsTo(() => Assignment)
  assignment: Assignment;

  @ForeignKey(() => User)
  @Column
  fromUserId: number;

  @BelongsTo(() => User, 'fromUserId')
  fromUser: User;

  @ForeignKey(() => User)
  @Column
  toUserId: number;

  @BelongsTo(() => User, 'toUserId')
  toUser: User;

  @Column({ type: DataType.ENUM('supervisor_to_manager', 'manager_to_supervisor') })
  feedbackType: string;

  @Column({ type: DataType.TEXT })
  message: string;

  @Column({ defaultValue: false })
  isRead: boolean;

  @Column({ type: DataType.DATE })
  readAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### Notifications Table
```typescript
@Table({
  tableName: 'notifications',
  timestamps: true,
})
export class Notification extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column
  title: string;

  @Column({ type: DataType.TEXT })
  message: string;

  @Column({ type: DataType.ENUM('info', 'warning', 'success', 'error') })
  type: string;

  @Column({ defaultValue: false })
  isRead: boolean;

  @Column({ type: DataType.DATE })
  readAt: Date;

  @Column({ type: DataType.JSONB })
  metadata: object;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### Documents Table
```typescript
@Table({
  tableName: 'documents',
  timestamps: true,
})
export class Document extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  @ForeignKey(() => Exam)
  @Column
  examId: number;

  @BelongsTo(() => Exam)
  exam: Exam;

  @Column
  filename: string;

  @Column
  originalName: string;

  @Column
  mimeType: string;

  @Column
  fileSize: number;

  @Column
  filePath: string;

  @Column({ type: DataType.ENUM('exam_instructions', 'exam_paper', 'other') })
  documentType: string;

  @ForeignKey(() => User)
  @Column
  uploadedById: number;

  @BelongsTo(() => User)
  uploadedBy: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
```

### Audit Logs Table
```typescript
@Table({
  tableName: 'audit_logs',
  timestamps: true,
})
export class AuditLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  uid: string;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column
  action: string; // e.g., 'user.created', 'assignment.updated'

  @Column
  entity: string; // e.g., 'User', 'Assignment'

  @Column
  entityId: number;

  @Column({ type: DataType.JSONB })
  oldValue: object;

  @Column({ type: DataType.JSONB })
  newValue: object;

  @Column
  ipAddress: string;

  @Column
  userAgent: string;

  @CreatedAt
  createdAt: Date;
}
```

---

## API Design

### API Versioning
- Base URL: `/api/v1`
- Version in URL path

### Response Format

#### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": []
  },
  "timestamp": "2025-11-14T10:30:00Z"
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  },
  "timestamp": "2025-11-14T10:30:00Z"
}
```

### REST API Endpoints

#### Authentication
```
POST   /api/v1/auth/login              # Login
POST   /api/v1/auth/register           # Register new user
POST   /api/v1/auth/refresh            # Refresh access token
POST   /api/v1/auth/logout             # Logout
POST   /api/v1/auth/verify-email       # Verify email
POST   /api/v1/auth/forgot-password    # Request password reset
POST   /api/v1/auth/reset-password     # Reset password
POST   /api/v1/auth/2fa/setup          # Setup 2FA
POST   /api/v1/auth/2fa/verify         # Verify 2FA token
POST   /api/v1/auth/2fa/disable        # Disable 2FA
```

#### Users
```
GET    /api/v1/users                   # List users (paginated)
GET    /api/v1/users/:id               # Get user by ID
POST   /api/v1/users                   # Create user (admin)
PATCH  /api/v1/users/:id               # Update user
DELETE /api/v1/users/:id               # Delete user (soft delete)
GET    /api/v1/users/me                # Get current user
PATCH  /api/v1/users/me                # Update current user
POST   /api/v1/users/:id/approve       # Approve supervisor
POST   /api/v1/users/:id/deactivate    # Deactivate user
POST   /api/v1/users/:id/photo         # Upload profile photo
```

#### Buildings
```
GET    /api/v1/buildings               # List buildings
GET    /api/v1/buildings/:id           # Get building
POST   /api/v1/buildings               # Create building
PATCH  /api/v1/buildings/:id           # Update building
DELETE /api/v1/buildings/:id           # Delete building
GET    /api/v1/buildings/:id/halls     # Get halls in building
POST   /api/v1/buildings/:id/managers  # Assign manager to building
DELETE /api/v1/buildings/:id/managers/:userId # Remove manager
```

#### Halls
```
GET    /api/v1/halls                   # List halls
GET    /api/v1/halls/:id               # Get hall
POST   /api/v1/halls                   # Create hall
PATCH  /api/v1/halls/:id               # Update hall
DELETE /api/v1/halls/:id               # Delete hall
GET    /api/v1/halls/:id/rooms         # Get rooms in hall
```

#### Rooms
```
GET    /api/v1/rooms                   # List rooms
GET    /api/v1/rooms/:id               # Get room
POST   /api/v1/rooms                   # Create room
PATCH  /api/v1/rooms/:id               # Update room
DELETE /api/v1/rooms/:id               # Delete room
```

#### Exams
```
GET    /api/v1/exams                   # List exams
GET    /api/v1/exams/:id               # Get exam
POST   /api/v1/exams                   # Create exam
PATCH  /api/v1/exams/:id               # Update exam
DELETE /api/v1/exams/:id               # Delete exam
GET    /api/v1/exams/:id/assignments   # Get exam assignments
POST   /api/v1/exams/:id/documents     # Upload exam document
GET    /api/v1/exams/:id/documents     # List exam documents
```

#### Assignments
```
GET    /api/v1/assignments             # List assignments
GET    /api/v1/assignments/:id         # Get assignment
POST   /api/v1/assignments             # Create assignment
PATCH  /api/v1/assignments/:id         # Update assignment
DELETE /api/v1/assignments/:id         # Delete assignment
POST   /api/v1/assignments/:id/accept  # Accept assignment offer
POST   /api/v1/assignments/:id/reject  # Reject assignment offer
POST   /api/v1/assignments/:id/checkin # Check in to assignment
POST   /api/v1/assignments/:id/checkout # Check out from assignment
POST   /api/v1/assignments/:id/no-supervisor # Mark as no supervisor needed
GET    /api/v1/assignments/my          # Get my assignments
```

#### Attendance
```
GET    /api/v1/attendance              # List attendance records
GET    /api/v1/attendance/:id          # Get attendance record
POST   /api/v1/attendance              # Mark attendance
PATCH  /api/v1/attendance/:id          # Update attendance
DELETE /api/v1/attendance/:id          # Delete attendance record
GET    /api/v1/assignments/:id/attendance # Get assignment attendance
```

#### Violations
```
GET    /api/v1/violations              # List violations
GET    /api/v1/violations/:id          # Get violation
POST   /api/v1/violations              # Report violation
PATCH  /api/v1/violations/:id          # Update violation
DELETE /api/v1/violations/:id          # Delete violation
GET    /api/v1/assignments/:id/violations # Get assignment violations
```

#### Feedback
```
GET    /api/v1/feedback                # List feedback
GET    /api/v1/feedback/:id            # Get feedback
POST   /api/v1/feedback                # Submit feedback
PATCH  /api/v1/feedback/:id/read       # Mark as read
DELETE /api/v1/feedback/:id            # Delete feedback
GET    /api/v1/feedback/sent           # Get sent feedback
GET    /api/v1/feedback/received       # Get received feedback
```

#### Notifications
```
GET    /api/v1/notifications           # List notifications
GET    /api/v1/notifications/:id       # Get notification
PATCH  /api/v1/notifications/:id/read  # Mark as read
PATCH  /api/v1/notifications/read-all  # Mark all as read
DELETE /api/v1/notifications/:id       # Delete notification
```

#### Audit Logs
```
GET    /api/v1/audit-logs              # List audit logs (admin only)
GET    /api/v1/audit-logs/:id          # Get audit log
GET    /api/v1/audit-logs/user/:userId # Get user audit logs
GET    /api/v1/audit-logs/entity/:entity/:entityId # Get entity audit logs
```

#### Monitoring (WebSocket)
```
WS     /api/v1/monitoring              # WebSocket connection for real-time monitoring
       Events:
         - exam.started
         - exam.ended
         - supervisor.checkin
         - supervisor.checkout
         - violation.reported
         - attendance.marked
```

---

## Authentication & Authorization

### JWT Token Strategy

#### Access Token
- **Lifetime**: 30 minutes
- **Contains**: userId, username, roles, externalUserId
- **Used for**: API authentication

#### Refresh Token
- **Lifetime**: 10 days
- **Contains**: userId, tokenId
- **Used for**: Generating new access tokens

### External Auth Service Integration

```typescript
// modules/external-auth/external-auth.service.ts
@Injectable()
export class ExternalAuthService {
  async login(username: string, password: string, roleUid: string) {
    // Call external auth service
    const response = await this.httpService.post(
      `${this.authServiceUrl}/api/mqm-app-auth/login`,
      { username, password, roleUid },
      { headers: { 'X-API-Key': this.apiKey } }
    );

    // Store user info in local database
    await this.syncUser(response.data.user);

    return response.data;
  }

  async validateToken(token: string) {
    // Validate token with external service
  }

  async syncUser(externalUser: any) {
    // Sync user data to local database
  }
}
```

### Role-Based Access Control

#### Roles
1. **Supervisor/Volunteer**
   - Register and manage profile
   - View and respond to assignments
   - Log exam activities
   - Submit feedback

2. **Building Manager**
   - All supervisor permissions
   - Manage supervisors in assigned buildings
   - Create/manage assignments
   - Real-time monitoring
   - Respond to feedback

3. **Exam Director**
   - All building manager permissions (system-wide)
   - Approve/deactivate supervisors
   - System-wide statistics
   - Upload exam documents
   - Access audit logs

#### Permission Decorator
```typescript
// common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Usage in controller:
@Roles('exam_director')
@Get('audit-logs')
async getAuditLogs() {
  // Only accessible by exam directors
}
```

#### Roles Guard
```typescript
// common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

### 2FA Implementation

```typescript
// modules/auth/auth.service.ts
async setup2FA(userId: number) {
  const secret = speakeasy.generateSecret({
    name: 'Exam Supervision',
    issuer: 'Exam Management System',
  });

  await this.usersService.update(userId, {
    mfaSecret: secret.base32,
  });

  const qrCode = await qrcode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode,
  };
}

async verify2FA(userId: number, token: string): Promise<boolean> {
  const user = await this.usersService.findById(userId);

  return speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
  });
}
```

---

## Module Structure

### Auth Module
```typescript
// modules/auth/auth.module.ts
@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '30m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ExternalAuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

### Users Module
```typescript
// modules/users/users.module.ts
@Module({
  imports: [SequelizeModule.forFeature([User, Building])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

## Implementation Details

### Sequelize Configuration

```typescript
// config/database.config.ts
import { SequelizeModuleOptions } from '@nestjs/sequelize';

export const databaseConfig: SequelizeModuleOptions = {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  models: [__dirname + '/../models/**/*.model.ts'],
  autoLoadModels: true,
  synchronize: false, // Use migrations in production
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
```

### Winston Logger Configuration

```typescript
// config/winston.config.ts
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, trace }) => {
    return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
  }),
);

export const winstonConfig = {
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || 'info',
    }),

    // Daily rotate file transport for all logs
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    }),

    // Daily rotate file transport for errors
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    }),
  ],
};
```

### Custom Logger Service

```typescript
// common/services/logger.service.ts
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { winstonConfig } from '../../config/winston.config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger(winstonConfig);
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

### Audit Logging Interceptor

```typescript
// common/interceptors/audit-log.interceptor.ts
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    @InjectModel(AuditLog)
    private auditLogModel: typeof AuditLog,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body, ip, headers } = request;

    return next.handle().pipe(
      tap(async (response) => {
        // Log only specific actions (CREATE, UPDATE, DELETE)
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
          await this.auditLogModel.create({
            userId: user?.id,
            action: `${method} ${url}`,
            entity: this.extractEntity(url),
            entityId: response?.id,
            newValue: method === 'DELETE' ? null : response,
            ipAddress: ip,
            userAgent: headers['user-agent'],
          });
        }
      }),
    );
  }

  private extractEntity(url: string): string {
    // Extract entity name from URL
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 2] || parts[parts.length - 1];
  }
}
```

### File Upload Configuration

```typescript
// common/utils/file-upload.util.ts
import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
      return cb(new Error('Only image and PDF files are allowed!'), false);
    }
    cb(null, true);
  },
};
```

### WebSocket Gateway for Real-time Monitoring

```typescript
// modules/monitoring/monitoring.gateway.ts
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MonitoringGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('MonitoringGateway');
  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = await this.jwtService.verifyAsync(token);

      this.connectedUsers.set(client.id, payload.userId);
      this.logger.log(`User ${payload.userId} connected`);

      client.join(`user:${payload.userId}`);

      // Join building rooms for building managers
      if (payload.roles.includes('building_manager')) {
        // Get user's managed buildings and join those rooms
      }
    } catch (error) {
      this.logger.error('WebSocket authentication failed', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    this.connectedUsers.delete(client.id);
    this.logger.log(`User ${userId} disconnected`);
  }

  @SubscribeMessage('exam.checkin')
  async handleCheckin(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    // Handle supervisor check-in
    this.server.to(`building:${data.buildingId}`).emit('supervisor.checkin', data);
  }

  // Emit events from services
  emitViolation(buildingId: number, violation: any) {
    this.server.to(`building:${buildingId}`).emit('violation.reported', violation);
  }
}
```

---

## Code Quality

### ESLint Configuration

```json
// .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "tsconfig.json",
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint/eslint-plugin"],
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "root": true,
  "env": {
    "node": true,
    "jest": true
  },
  "ignorePatterns": [".eslintrc.js"],
  "rules": {
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "prettier/prettier": [
      "error",
      {
        "endOfLine": "auto"
      }
    ]
  }
}
```

### Prettier Configuration

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## Testing Strategy

### Unit Testing

```typescript
// modules/users/users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  let userModel: typeof User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get<typeof User>(getModelToken(User));
  });

  it('should create a user', async () => {
    const createUserDto = {
      username: 'testuser',
      email: 'test@example.com',
      fullName: 'Test User',
    };

    jest.spyOn(userModel, 'create').mockResolvedValue(createUserDto as any);

    const result = await service.create(createUserDto);
    expect(result).toEqual(createUserDto);
  });
});
```

### Integration Testing

```typescript
// modules/auth/auth.controller.spec.ts
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser',
        password: 'password123',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=exam_user
      - DB_PASSWORD=exam_password
      - DB_DATABASE=exam_supervision
    depends_on:
      - postgres
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=exam_user
      - POSTGRES_PASSWORD=exam_password
      - POSTGRES_DB=exam_supervision
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

volumes:
  postgres_data:
```

### Environment Variables

```bash
# .env.example
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=exam_user
DB_PASSWORD=exam_password
DB_DATABASE=exam_supervision

# JWT
JWT_SECRET=your-super-secret-jwt-key
ACCESS_TOKEN_LIFETIME=30m
REFRESH_TOKEN_LIFETIME=240h

# External Auth Service
AUTH_SERVICE_URL=https://auth.example.com
AUTH_SERVICE_API_KEY=your-api-key

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=smtp-password
SMTP_FROM=noreply@example.com

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
```

---

## Migration from TypeORM to Sequelize

### Steps

1. **Install Dependencies**
```bash
npm install --save sequelize sequelize-typescript pg pg-hstore
npm install --save-dev @types/sequelize
```

2. **Update Database Configuration**
```typescript
// app.module.ts
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot(databaseConfig),
    // ... other modules
  ],
})
export class AppModule {}
```

3. **Convert Entities to Models**
- Replace `@Entity()` with `@Table()`
- Replace `@PrimaryGeneratedColumn()` with `@PrimaryKey @AutoIncrement @Column`
- Replace `@Column()` decorators with Sequelize equivalents
- Replace `@ManyToOne`, `@OneToMany` with `@BelongsTo`, `@HasMany`

4. **Update Repositories**
- Replace TypeORM repository methods with Sequelize equivalents
- `find()` → `findAll()`
- `findOne()` → `findOne()`
- `save()` → `create()` or `update()`

5. **Create Migrations**
```bash
npx sequelize-cli migration:generate --name initial-schema
```

---

## Package.json Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^11.1.8",
    "@nestjs/config": "^4.0.2",
    "@nestjs/core": "^11.1.8",
    "@nestjs/jwt": "^11.0.1",
    "@nestjs/passport": "^11.0.5",
    "@nestjs/platform-express": "^11.1.8",
    "@nestjs/platform-socket.io": "^11.1.8",
    "@nestjs/sequelize": "^10.0.1",
    "@nestjs/swagger": "^11.2.1",
    "@nestjs/websockets": "^11.1.8",
    "bcrypt": "^6.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.2",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "pg": "^8.16.3",
    "pg-hstore": "^2.3.4",
    "qrcode": "^1.5.4",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2",
    "sequelize": "^6.37.5",
    "sequelize-typescript": "^2.1.7",
    "socket.io": "^4.8.1",
    "speakeasy": "^2.0.0",
    "winston": "^3.17.0",
    "winston-daily-rotate-file": "^5.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.10",
    "@nestjs/testing": "^11.1.8",
    "@types/bcrypt": "^6.0.0",
    "@types/express": "^5.0.5",
    "@types/jest": "^29.5.14",
    "@types/multer": "^1.4.12",
    "@types/node": "^24.10.1",
    "@types/passport-jwt": "^4.0.1",
    "@types/qrcode": "^1.5.6",
    "@types/sequelize": "^4.28.20",
    "@types/socket.io": "^3.0.2",
    "@types/speakeasy": "^2.0.10",
    "@types/supertest": "^6.0.2",
    "@typescript-eslint/eslint-plugin": "^8.16.0",
    "@typescript-eslint/parser": "^8.16.0",
    "eslint": "^9.16.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.2.1",
    "jest": "^29.7.0",
    "prettier": "^3.4.2",
    "sequelize-cli": "^6.6.2",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3"
  }
}
```

---

## Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- Setup NestJS project structure
- Install and configure Sequelize
- Setup Winston logger
- Configure ESLint & Prettier
- Create database models
- Setup migrations

### Phase 2: Core Features (Week 3-4)
- Implement authentication module
- Implement user management
- Implement building/hall/room management
- Implement exam management

### Phase 3: Assignment & Tracking (Week 5-6)
- Implement assignment module
- Implement attendance tracking
- Implement violation reporting
- Implement feedback system

### Phase 4: Advanced Features (Week 7-8)
- Implement real-time monitoring (WebSocket)
- Implement notification system
- Implement document management
- Implement audit logging

### Phase 5: Testing & Deployment (Week 9-10)
- Write unit tests
- Write integration tests
- Setup CI/CD pipeline
- Deploy to staging
- Production deployment

---

## Best Practices

1. **Use DTOs for Validation**
   - Create separate DTOs for create and update operations
   - Use class-validator decorators

2. **Service Layer Business Logic**
   - Keep controllers thin
   - Business logic in services
   - Reusable service methods

3. **Error Handling**
   - Use custom exception filters
   - Consistent error response format
   - Log all errors

4. **Security**
   - Validate all inputs
   - Use parameterized queries
   - Implement rate limiting
   - Enable CORS properly
   - Use helmet for security headers

5. **Logging**
   - Log all important actions
   - Include context in logs
   - Different log levels
   - Rotate logs

6. **Performance**
   - Use database indexes
   - Implement caching where appropriate
   - Paginate large datasets
   - Use database transactions

7. **Code Quality**
   - Follow NestJS conventions
   - Use TypeScript strict mode
   - Write tests
   - Code reviews

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Sequelize Documentation](https://sequelize.org/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Passport.js Documentation](http://www.passportjs.org/)
- [Socket.io Documentation](https://socket.io/docs/)
