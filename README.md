# Exam Supervision Web Application - Backend API

A comprehensive exam supervision management system built with NestJS, designed to streamline the management of exam supervisors, their assignments, and real-time exam oversight.

## Features

- **Role-Based Access Control (RBAC)**: Three user roles - Supervisor/Volunteer, Building Manager, and Exam Director
- **External Authorization Service Integration**: Secure authentication with external auth service
- **2FA Support**: Google Authenticator (TOTP) integration
- **Real-Time Monitoring**: WebSocket-based real-time exam monitoring
- **Assignment Management**: Complete workflow for supervisor assignments
- **Attendance Tracking**: Mark and track participant attendance
- **Violation Reporting**: Report and track exam rule violations
- **Feedback System**: Two-way communication between supervisors and managers
- **Notification System**: In-app and email notifications
- **Audit Logging**: Complete audit trail of all critical actions
- **File Management**: Upload and manage profile photos and exam documents

## Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: External Auth Service + JWT
- **2FA**: Speakeasy (TOTP)
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- External Authorization Service (see API_DOCUMENTATION.md)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hall-mgr-api
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Create PostgreSQL database
createdb exam_supervision

# Run migrations (when TypeORM sync is disabled)
npm run migration:run
```

## Configuration

### Environment Variables

Key configuration variables in `.env`:

- `PORT`: Server port (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`: Database configuration
- `AUTH_SERVICE_URL`: External authorization service URL
- `AUTH_SERVICE_API_KEY`: API key for authorization service
- `JWT_SECRET`: JWT signing secret
- `SMTP_*`: Email configuration for notifications

See `.env.example` for complete list.

### External Authorization Service

This system integrates with an external authorization service for user authentication and authorization. See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API documentation.

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

### Docker
```bash
docker-compose up -d
```

## API Documentation

Once the application is running, access the Swagger documentation at:

```
http://localhost:3000/api/docs
```

## Database Schema

The system uses the following main entities:

- **User**: User profiles linked to external auth service
- **Building**: Exam buildings
- **Hall**: Halls within buildings
- **Room**: Rooms within halls
- **Exam**: Exam sessions
- **Assignment**: Supervisor assignments to rooms
- **Attendance**: Participant attendance records
- **Violation**: Rule violation reports
- **Feedback**: Supervisor and manager feedback
- **Notification**: System notifications
- **Document**: Uploaded documents
- **AuditLog**: Complete audit trail

## User Roles & Permissions

### Supervisor/Volunteer
- Register and manage profile
- View and accept/reject assignment offers
- Log exam day activities (timestamps, attendance, violations)
- Submit feedback
- View assignment history

### Building Manager
- All supervisor permissions
- Manage supervisors in assigned buildings
- Create/manage room assignments
- Mark rooms as "no supervisor needed"
- View real-time monitoring for buildings
- Respond to supervisor feedback

### Exam Director
- All building manager permissions (system-wide)
- Approve/deactivate supervisors
- View system-wide statistics
- Upload exam documents
- Message supervisors
- Access full audit logs

## Development

### Project Structure
```
src/
├── entities/          # TypeORM entities
├── config/           # Configuration files
├── common/           # Shared utilities, guards, decorators
├── modules/          # Feature modules (to be implemented)
│   ├── auth/
│   ├── users/
│   ├── buildings/
│   ├── assignments/
│   ├── monitoring/
│   └── ...
├── app.module.ts     # Root module
└── main.ts          # Application entry point
```

### Scripts

- `npm run build`: Build the application
- `npm run start`: Start the application
- `npm run start:dev`: Start in development mode with watch
- `npm run start:debug`: Start in debug mode
- `npm run lint`: Lint the code
- `npm run test`: Run unit tests
- `npm run test:e2e`: Run end-to-end tests
- `npm run test:cov`: Run tests with coverage

## Security

- HTTPS required in production
- 2FA mandatory for Building Managers and Exam Directors
- All tokens validated with external auth service
- API key protection for auth service integration
- Comprehensive audit logging
- Input validation and sanitization

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

ISC

## Support

For issues and questions, please contact the development team.
