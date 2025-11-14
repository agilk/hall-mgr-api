# System Architecture Overview
# Exam Supervision Management System

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture Diagram](#architecture-diagram)
4. [Technology Stack Summary](#technology-stack-summary)
5. [System Components](#system-components)
6. [Data Flow](#data-flow)
7. [Security Architecture](#security-architecture)
8. [Scalability & Performance](#scalability--performance)
9. [Deployment Architecture](#deployment-architecture)
10. [Integration Points](#integration-points)

---

## Executive Summary

The Exam Supervision Management System is a full-stack web application designed to streamline the management of exam supervisors, their assignments, and real-time exam oversight. The system provides:

- **Role-Based Access Control** for three user types
- **Real-Time Monitoring** capabilities via WebSocket
- **External Authentication** integration
- **Comprehensive Audit Trail** for compliance
- **Responsive Web Interface** with PWA capabilities

### Key Metrics
- **Expected Users**: 500-1000 concurrent users during exam periods
- **Response Time**: < 200ms for API calls
- **Uptime**: 99.9% SLA
- **Data Retention**: 7 years for audit logs

---

## System Overview

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client Layer                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Vue 3.5 Frontend (SPA)                                   │   │
│  │  - Responsive UI with Tailwind CSS                        │   │
│  │  - State Management (Pinia)                               │   │
│  │  - Real-time Updates (Socket.io)                          │   │
│  │  - PWA Support                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌──────────────────────────────────────────────────────────────────┐
│                      Application Layer                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  NestJS Backend API                                       │   │
│  │  - RESTful API Endpoints                                  │   │
│  │  - WebSocket Gateway                                      │   │
│  │  - Authentication & Authorization                         │   │
│  │  - Business Logic                                         │   │
│  │  - Logging (Winston)                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                       Data Layer                                  │
│  ┌────────────────────┐    ┌────────────────────┐               │
│  │  PostgreSQL 14+     │    │  Redis (Cache)     │               │
│  │  - Primary Database │    │  - Session Store   │               │
│  │  - Sequelize ORM    │    │  - Rate Limiting   │               │
│  └────────────────────┘    └────────────────────┘               │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    External Services                              │
│  ┌────────────────────┐    ┌────────────────────┐               │
│  │  Auth Service       │    │  SMTP Server       │               │
│  │  - User Auth        │    │  - Email Notif.    │               │
│  │  - 2FA              │    │                    │               │
│  └────────────────────┘    └────────────────────┘               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Architecture Diagram

### Detailed Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             FRONTEND (Vue 3.5)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐    │
│  │   Components    │  │    Pinia        │  │   Vue Router        │    │
│  │   - UI Layer    │  │    Stores       │  │   - Route Guards    │    │
│  │   - Views       │  │    - auth       │  │   - Lazy Loading    │    │
│  │   - Layouts     │  │    - user       │  │                     │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘    │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐    │
│  │   Services      │  │   Composables   │  │   WebSocket         │    │
│  │   - API Client  │  │   - useAuth     │  │   - Socket.io       │    │
│  │   - Axios       │  │   - useForm     │  │   - Real-time       │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘    │
│                                                                          │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ HTTP/WebSocket
┌──────────────────────────────────┴──────────────────────────────────────┐
│                             BACKEND (NestJS)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                        API Gateway                              │    │
│  │  - Controllers (REST Endpoints)                                 │    │
│  │  - WebSocket Gateway (Real-time)                                │    │
│  │  - Request Validation (class-validator)                         │    │
│  │  - API Documentation (Swagger)                                  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                 ↓                                        │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                      Middleware Layer                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │    │
│  │  │ Auth Guard   │  │ Roles Guard  │  │ Logging          │     │    │
│  │  │ - JWT        │  │ - RBAC       │  │ - Winston        │     │    │
│  │  │ - 2FA        │  │ - Permissions│  │ - Audit Trail    │     │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘     │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                 ↓                                        │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                      Business Logic Layer                       │    │
│  │  ┌─────────────────────────────────────────────────────────┐   │    │
│  │  │                    Services                              │   │    │
│  │  │  - AuthService          - AssignmentsService            │   │    │
│  │  │  - UsersService         - ExamsService                  │   │    │
│  │  │  - BuildingsService     - AttendanceService             │   │    │
│  │  │  - ViolationsService    - FeedbackService               │   │    │
│  │  │  - NotificationsService - AuditService                  │   │    │
│  │  └─────────────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                 ↓                                        │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                      Data Access Layer                          │    │
│  │  ┌─────────────────────────────────────────────────────────┐   │    │
│  │  │              Sequelize ORM                               │   │    │
│  │  │  - Models (TypeScript)                                   │   │    │
│  │  │  - Migrations                                            │   │    │
│  │  │  - Repositories                                          │   │    │
│  │  └─────────────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────────┐
│                          DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐         ┌─────────────────────┐               │
│  │   PostgreSQL 14+    │         │      Redis          │               │
│  │                     │         │                     │               │
│  │  - Users            │         │  - Sessions         │               │
│  │  - Buildings        │         │  - Cache            │               │
│  │  - Exams            │         │  - Rate Limiting    │               │
│  │  - Assignments      │         │  - WebSocket State  │               │
│  │  - Attendance       │         │                     │               │
│  │  - Violations       │         │                     │               │
│  │  - Feedback         │         │                     │               │
│  │  - Notifications    │         │                     │               │
│  │  - Audit Logs       │         │                     │               │
│  │                     │         │                     │               │
│  └─────────────────────┘         └─────────────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Summary

### Frontend Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Vue | 3.5 | UI framework with Composition API |
| Build Tool | Vite | 6.x | Fast build tool and dev server |
| Language | TypeScript | 5.x | Type-safe JavaScript |
| State Management | Pinia | 2.x | Official Vue state management |
| Routing | Vue Router | 4.x | Client-side routing |
| Styling | Tailwind CSS | 4.x | Utility-first CSS framework |
| UI Components | Headless UI | 1.x | Unstyled accessible components |
| Icons | Heroicons | 2.x | SVG icons |
| HTTP Client | Axios | 1.x | Promise-based HTTP client |
| WebSocket | Socket.io Client | 4.x | Real-time communication |
| Form Validation | VeeValidate | 4.x | Form validation |
| Schema Validation | Yup | 1.x | Object schema validation |
| Date Utilities | date-fns | 4.x | Modern date utility library |
| Notifications | vue-toastification | 2.x | Toast notifications |
| Charts | Chart.js | 4.x | Data visualization |
| Testing | Vitest | 2.x | Unit testing framework |
| E2E Testing | Playwright | 1.x | End-to-end testing |
| Linting | ESLint | 9.x | Code linting |
| Formatting | Prettier | 3.x | Code formatting |

### Backend Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | NestJS | 11.x | Progressive Node.js framework |
| Runtime | Node.js | 18+ | JavaScript runtime |
| Language | TypeScript | 5.x | Type-safe JavaScript |
| Database | PostgreSQL | 14+ | Relational database |
| ORM | Sequelize | 6.x | TypeScript ORM for SQL databases |
| Cache | Redis | 7.x | In-memory data store |
| Authentication | Passport | 0.7 | Authentication middleware |
| JWT | @nestjs/jwt | 11.x | JWT token handling |
| 2FA | Speakeasy | 2.x | TOTP for two-factor auth |
| Hashing | bcrypt | 6.x | Password hashing |
| Logging | Winston | 3.x | Logging library |
| Validation | class-validator | 0.14 | DTO validation |
| Transformation | class-transformer | 0.5 | Object transformation |
| API Docs | Swagger | 11.x | OpenAPI documentation |
| WebSocket | Socket.io | 4.x | Real-time bi-directional communication |
| File Upload | Multer | 1.x | Multipart/form-data handling |
| Testing | Jest | 29.x | Testing framework |
| Linting | ESLint | 9.x | Code linting |
| Formatting | Prettier | 3.x | Code formatting |

---

## System Components

### 1. Frontend Application

**Purpose**: User interface for all system users

**Key Features**:
- Responsive design (mobile, tablet, desktop)
- Role-based dashboards
- Real-time updates
- Offline capabilities (PWA)
- Accessibility compliant

**Main Modules**:
- Authentication & Registration
- Dashboard (role-specific)
- Profile Management
- Assignment Management
- Exam Monitoring
- Attendance Tracking
- Violation Reporting
- Feedback System
- Notifications

### 2. Backend API

**Purpose**: Business logic and data management

**Key Features**:
- RESTful API design
- WebSocket support for real-time features
- Role-based access control
- Comprehensive logging
- API documentation (Swagger)
- Input validation
- Error handling

**Main Modules**:
- Authentication Module
- Users Module
- Buildings Module
- Exams Module
- Assignments Module
- Attendance Module
- Violations Module
- Feedback Module
- Notifications Module
- Monitoring Module (WebSocket)
- Audit Module

### 3. Database

**Purpose**: Persistent data storage

**Schema**:
- 12 main entities
- Relational data model
- Normalized structure
- Indexed for performance
- Audit trail support

**Key Tables**:
- users
- buildings, halls, rooms
- exams
- assignments
- attendance
- violations
- feedback
- notifications
- documents
- audit_logs

### 4. External Services Integration

**External Auth Service**:
- User authentication
- Role management
- MFA support
- Token validation

**Email Service (SMTP)**:
- Notification emails
- Password reset emails
- Assignment notifications
- System alerts

---

## Data Flow

### 1. Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Enter credentials
     ↓
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 2. POST /auth/login
       ↓
┌──────────────┐
│  Backend API │
└──────┬───────┘
       │ 3. Validate with external auth service
       ↓
┌────────────────────┐
│  External Auth     │
│  Service           │
└──────┬─────────────┘
       │ 4. Return user data + tokens
       ↓
┌──────────────┐
│  Backend API │
│  - Sync user │
│  - Generate  │
│    JWT       │
└──────┬───────┘
       │ 5. Return tokens + user data
       ↓
┌─────────────┐
│  Frontend   │
│  - Store    │
│    tokens   │
│  - Update   │
│    state    │
└──────┬──────┘
       │ 6. Redirect to dashboard
       ↓
┌─────────┐
│  User   │
└─────────┘
```

### 2. Assignment Acceptance Flow

```
┌─────────┐
│  Super- │
│  visor  │
└────┬────┘
     │ 1. Click "Accept Assignment"
     ↓
┌─────────────┐
│  Frontend   │
│  Pinia      │
│  Store      │
└──────┬──────┘
       │ 2. POST /assignments/:id/accept
       │    (with JWT token)
       ↓
┌──────────────┐
│  Backend API │
│  - Auth      │
│    Guard     │
│  - Roles     │
│    Guard     │
└──────┬───────┘
       │ 3. Validate permissions
       ↓
┌──────────────┐
│  Assignment  │
│  Service     │
└──────┬───────┘
       │ 4. Update assignment status
       ↓
┌──────────────┐
│  Database    │
│  (Sequelize) │
└──────┬───────┘
       │ 5. Return updated assignment
       ↓
┌──────────────┐
│  Backend API │
│  - Audit Log │
│  - Notify    │
│    Manager   │
└──────┬───────┘
       │ 6. Return success response
       ↓
┌─────────────┐
│  Frontend   │
│  - Update   │
│    state    │
│  - Show     │
│    toast    │
└──────┬──────┘
       │ 7. UI reflects change
       ↓
┌─────────┐
│  Super- │
│  visor  │
└─────────┘
```

### 3. Real-time Monitoring Flow

```
┌──────────────┐
│  Building    │
│  Manager     │
└──────┬───────┘
       │ 1. Open monitoring dashboard
       ↓
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 2. Establish WebSocket connection
       │    (with JWT token)
       ↓
┌──────────────┐
│  Backend     │
│  WebSocket   │
│  Gateway     │
└──────┬───────┘
       │ 3. Authenticate & join building room
       ↓
       │ 4. Listen for events:
       │    - supervisor.checkin
       │    - supervisor.checkout
       │    - violation.reported
       │    - attendance.marked
       │
       │ MEANWHILE...
       │
┌─────────┐
│  Super- │
│  visor  │
└────┬────┘
     │ 5. Checks in to assignment
     ↓
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 6. POST /assignments/:id/checkin
       ↓
┌──────────────┐
│  Backend     │
│  Service     │
└──────┬───────┘
       │ 7. Update database
       ↓
┌──────────────┐
│  WebSocket   │
│  Gateway     │
└──────┬───────┘
       │ 8. Emit 'supervisor.checkin' event
       │    to building room
       ↓
┌─────────────┐
│  Frontend   │
│  (Manager)  │
└──────┬──────┘
       │ 9. Receive event & update UI
       ↓
┌──────────────┐
│  Building    │
│  Manager     │
│  - Sees      │
│    real-time │
│    update    │
└──────────────┘
```

---

## Security Architecture

### 1. Authentication & Authorization

```
┌──────────────────────────────────────────────────────────┐
│                  Authentication Layers                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Layer 1: External Auth Service                          │
│  ├─ Username/Password validation                         │
│  ├─ Role verification                                    │
│  ├─ MFA (TOTP) for managers and directors                │
│  └─ Token generation                                     │
│                                                           │
│  Layer 2: JWT Tokens                                     │
│  ├─ Access Token (30 min)                                │
│  ├─ Refresh Token (10 days)                              │
│  ├─ Signed with secret key                               │
│  └─ Includes user ID, roles, permissions                 │
│                                                           │
│  Layer 3: Route Guards (Backend)                         │
│  ├─ JWT Authentication Guard                             │
│  ├─ Roles Guard (RBAC)                                   │
│  ├─ 2FA Verification Guard                               │
│  └─ Rate Limiting                                        │
│                                                           │
│  Layer 4: Route Guards (Frontend)                        │
│  ├─ Auth Guard (requires login)                          │
│  ├─ Role Guard (requires specific role)                  │
│  └─ Token refresh logic                                  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 2. Data Security

**Encryption**:
- All passwords hashed with bcrypt (cost factor 10)
- JWT tokens signed with HS256
- HTTPS/TLS for all communications
- Database encryption at rest

**Validation**:
- Input validation with class-validator
- SQL injection prevention (Sequelize parameterized queries)
- XSS prevention (sanitized inputs)
- CSRF protection

**Access Control**:
- Role-Based Access Control (RBAC)
- Resource-level permissions
- Building-level isolation for managers

### 3. Audit Trail

**Logged Actions**:
- User login/logout
- Password changes
- Profile updates
- Assignment creation/modification
- Attendance marking
- Violation reporting
- Administrative actions

**Audit Log Fields**:
- User ID
- Action type
- Entity type & ID
- Old value
- New value
- IP address
- User agent
- Timestamp

---

## Scalability & Performance

### Horizontal Scalability

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                     (Nginx/HAProxy)                      │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ↓           ↓           ↓
   ┌────────┐  ┌────────┐  ┌────────┐
   │ API    │  │ API    │  │ API    │
   │ Server │  │ Server │  │ Server │
   │ 1      │  │ 2      │  │ N      │
   └────────┘  └────────┘  └────────┘
        │           │           │
        └───────────┼───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ↓                       ↓
   ┌─────────┐          ┌─────────────┐
   │ PostgreSQL         │  Redis      │
   │ (Primary/          │  (Cache &   │
   │  Replica)          │   Session)  │
   └─────────┘          └─────────────┘
```

### Performance Optimizations

**Backend**:
- Database indexing on frequently queried columns
- Redis caching for frequently accessed data
- Connection pooling (max 10 connections)
- Query optimization
- Pagination for large datasets
- Background jobs for heavy tasks

**Frontend**:
- Code splitting & lazy loading
- Asset optimization (images, fonts)
- Service worker for offline support
- Virtual scrolling for large lists
- Debouncing/throttling for user inputs
- CDN for static assets

**Database**:
- Proper indexing strategy
- Query optimization
- Read replicas for scalability
- Partitioning for large tables (audit logs)
- Regular vacuum and analyze

### Caching Strategy

```
┌──────────────────────────────────────────────────────────┐
│                    Caching Layers                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Browser Cache                                           │
│  ├─ Static assets (CSS, JS, images)                      │
│  ├─ Service Worker cache                                 │
│  └─ Local Storage (user preferences)                     │
│                                                           │
│  Application Cache (Redis)                               │
│  ├─ User sessions (TTL: 10 days)                         │
│  ├─ Frequently accessed data (TTL: 1 hour)               │
│  │  - Building/Hall/Room lists                           │
│  │  - User profile data                                  │
│  └─ Rate limiting counters (TTL: 1 minute)               │
│                                                           │
│  Database Query Cache                                    │
│  └─ PostgreSQL query result cache                        │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                     Cloudflare / CDN                             │
│                  - DDoS Protection                               │
│                  - SSL/TLS Termination                           │
│                  - Static Asset Caching                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                     Load Balancer                                │
│                  - Nginx / HAProxy                               │
│                  - SSL Termination                               │
│                  - Request Routing                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ↓                   ↓                   ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Frontend    │    │  Frontend    │    │  Frontend    │
│  (Nginx)     │    │  (Nginx)     │    │  (Nginx)     │
│  Container 1 │    │  Container 2 │    │  Container N │
└──────────────┘    └──────────────┘    └──────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ↓                   ↓                   ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Backend API │    │  Backend API │    │  Backend API │
│  (NestJS)    │    │  (NestJS)    │    │  (NestJS)    │
│  Container 1 │    │  Container 2 │    │  Container N │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ↓                                       ↓
┌──────────────────┐                   ┌──────────────────┐
│  PostgreSQL      │                   │  Redis           │
│  - Primary       │                   │  - Master        │
│  - Replicas      │                   │  - Sentinel      │
│  - Backup        │                   │                  │
└──────────────────┘                   └──────────────────┘
```

### Container Architecture (Docker)

```yaml
# docker-compose.production.yml

services:
  frontend:
    image: exam-supervision-frontend:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  backend:
    image: exam-supervision-backend:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  postgres:
    image: postgres:14-alpine
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

  redis:
    image: redis:7-alpine
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### CI/CD Pipeline

```
┌──────────────┐
│  Developer   │
│  Commits Code│
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Git Push    │
│  to GitHub   │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────┐
│  CI Pipeline (GitHub Actions)    │
│  1. Lint code (ESLint, Prettier) │
│  2. Type check (TypeScript)      │
│  3. Run tests (Vitest, Jest)     │
│  4. Build application            │
│  5. Security scan                │
└──────┬───────────────────────────┘
       │
       ↓ (if tests pass)
┌──────────────────────────────────┐
│  Build Docker Images             │
│  - Frontend image                │
│  - Backend image                 │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│  Push to Container Registry      │
│  - Docker Hub / ECR              │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│  Deploy to Staging               │
│  - Run integration tests         │
│  - Manual approval               │
└──────┬───────────────────────────┘
       │
       ↓ (if approved)
┌──────────────────────────────────┐
│  Deploy to Production            │
│  - Rolling update                │
│  - Health checks                 │
│  - Rollback on failure           │
└──────────────────────────────────┘
```

---

## Integration Points

### 1. External Auth Service Integration

**Purpose**: User authentication and authorization

**Integration Method**: REST API

**Endpoints Used**:
- `POST /api/mqm-app-auth/login` - User login
- `POST /api/mqm-app-auth/mfa-setup` - Setup 2FA
- `POST /api/mqm-app-auth/mfa-verify` - Verify 2FA
- `POST /api/users/` - Create user
- `POST /api/users/activate` - Activate user
- `GET /api/users/token/access` - Refresh token

**Authentication**:
- API Key in headers: `X-API-Key`
- Bearer token for user endpoints

**Data Sync**:
- User data synced to local database
- Roles stored locally for RBAC
- Token validation cached

### 2. Email Service (SMTP)

**Purpose**: Send email notifications

**Integration Method**: SMTP

**Email Types**:
- Assignment notifications
- Password reset
- Account activation
- Violation alerts
- Feedback notifications
- System announcements

**Configuration**:
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=***
SMTP_FROM=Exam Supervision <noreply@example.com>
```

### 3. File Storage

**Purpose**: Store uploaded files

**Options**:
1. **Local Storage** (Development)
   - Files stored in `./uploads` directory
   - Served via Express static middleware

2. **Cloud Storage** (Production)
   - AWS S3 / Azure Blob Storage / Google Cloud Storage
   - Signed URLs for secure access
   - CDN integration for performance

### 4. Monitoring & Logging

**Application Monitoring**:
- Winston logs to files
- Log aggregation (ELK Stack / Datadog / New Relic)
- Error tracking (Sentry)

**Infrastructure Monitoring**:
- Server metrics (CPU, memory, disk)
- Database metrics (connections, queries)
- Application metrics (response time, error rate)

**Alerts**:
- High error rate
- Server down
- Database connection issues
- High latency

---

## Disaster Recovery

### Backup Strategy

**Database Backups**:
- Full backup: Daily at 2 AM
- Incremental backup: Every 6 hours
- Retention: 30 days
- Stored in separate location/cloud

**Application Backups**:
- Docker images versioned and stored
- Configuration files in version control
- Uploaded files backed up to cloud storage

### Recovery Procedures

**RTO (Recovery Time Objective)**: 4 hours
**RPO (Recovery Point Objective)**: 6 hours

**Steps**:
1. Restore database from backup
2. Deploy latest stable Docker images
3. Restore uploaded files from backup
4. Verify system functionality
5. Resume operations

---

## Monitoring & Observability

### Key Metrics

**Application Metrics**:
- API response time (p50, p95, p99)
- Request rate
- Error rate
- Active users
- WebSocket connections

**Business Metrics**:
- Active assignments
- Supervisor check-ins
- Violations reported
- User registrations

**Infrastructure Metrics**:
- CPU usage
- Memory usage
- Disk I/O
- Network traffic
- Database connections

### Logging Strategy

**Log Levels**:
- ERROR: Application errors
- WARN: Warning conditions
- INFO: Informational messages
- DEBUG: Debug information

**Log Format**:
```json
{
  "timestamp": "2025-11-14T10:30:00Z",
  "level": "info",
  "context": "AssignmentsService",
  "message": "Assignment created",
  "userId": 123,
  "assignmentId": 456,
  "metadata": {}
}
```

---

## Conclusion

This architecture provides a robust, scalable, and secure foundation for the Exam Supervision Management System. The separation of concerns, use of industry-standard technologies, and focus on security and performance ensure the system can handle current requirements while being flexible enough to accommodate future growth and changes.

### Next Steps

1. Review and approve architecture
2. Set up development environment
3. Implement Phase 1 (Backend foundation)
4. Implement Phase 2 (Frontend foundation)
5. Iterate on features
6. Testing and optimization
7. Deployment to production

### Success Criteria

- **Performance**: API response time < 200ms
- **Reliability**: 99.9% uptime
- **Security**: No critical vulnerabilities
- **Scalability**: Handle 1000+ concurrent users
- **Maintainability**: Clean, documented code
- **User Experience**: Intuitive, responsive interface
