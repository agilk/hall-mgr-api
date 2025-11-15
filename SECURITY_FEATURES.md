# Security Features

This document describes the security features implemented in the Exam Supervision Management API.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Rate Limiting](#rate-limiting)
3. [Security Headers (Helmet)](#security-headers-helmet)
4. [CORS Configuration](#cors-configuration)
5. [Input Validation](#input-validation)
6. [Password Security](#password-security)
7. [Two-Factor Authentication](#two-factor-authentication)
8. [Audit Logging](#audit-logging)
9. [Best Practices](#best-practices)

## Authentication & Authorization

### JWT-Based Authentication

The API uses JSON Web Tokens (JWT) for stateless authentication:

- **Access Token**: Short-lived (default: 30 minutes)
- **Refresh Token**: Long-lived (default: 240 hours / 10 days)

**Configuration:**
```env
JWT_SECRET=your-secret-key-change-this-in-production
ACCESS_TOKEN_LIFETIME=30m
REFRESH_TOKEN_LIFETIME=240h
```

### Role-Based Access Control (RBAC)

Three user roles with hierarchical permissions:

1. **SUPERVISOR** - Basic access to assigned exams and rooms
2. **BUILDING_MANAGER** - Manage buildings, halls, and supervisors
3. **EXAM_DIRECTOR** - Full system access

**Usage in Controllers:**
```typescript
@Roles(UserRole.EXAM_DIRECTOR)
@Delete(':id')
async remove(@Param('id') id: string) {
  // Only EXAM_DIRECTOR can access this endpoint
}
```

### Protected Endpoints

By default, all endpoints require authentication. Use `@Public()` decorator for public endpoints:

```typescript
@Public()
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // Public endpoint
}
```

## Rate Limiting

### Global Rate Limiting

**Default Configuration:**
- **100 requests per minute** per IP address
- Time window: 60 seconds (1 minute)

**Configuration in app.module.ts:**
```typescript
ThrottlerModule.forRoot([
  {
    ttl: 60000, // 1 minute in milliseconds
    limit: 100, // Maximum requests per ttl
  },
]),
```

### Custom Rate Limits

Override rate limits for specific endpoints:

```typescript
import { CustomThrottle } from '../common/decorators/throttle.decorator';

// Allow only 5 login attempts per minute
@CustomThrottle(5, 60)
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // Limited to 5 requests per minute
}
```

### Skip Rate Limiting

Exclude endpoints from rate limiting:

```typescript
import { SkipThrottle } from '../common/decorators/skip-throttle.decorator';

@SkipThrottle()
@Get('health')
async checkHealth() {
  // Not subject to rate limiting
}
```

### Rate Limiting by Endpoint

Different endpoints can have different limits:

| Endpoint | Limit | Time Window | Reason |
|----------|-------|-------------|--------|
| `POST /auth/login` | 5 | 1 minute | Prevent brute force |
| `POST /auth/register` | 3 | 5 minutes | Prevent spam registration |
| `POST /documents/upload` | 10 | 1 minute | Limit file uploads |
| `GET /api/*` (default) | 100 | 1 minute | General protection |

### Rate Limit Response

When rate limit is exceeded, the API returns HTTP 429:

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "error": "Too Many Requests"
}
```

Response headers include:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the limit resets (Unix timestamp)

## Security Headers (Helmet)

The API uses [Helmet](https://helmetjs.github.io/) middleware to set secure HTTP headers.

### Implemented Headers

1. **Content-Security-Policy (CSP)**
   - Controls which resources can be loaded
   - Prevents XSS attacks
   - Configured for API + Swagger UI

2. **X-Content-Type-Options**
   - Set to `nosniff`
   - Prevents MIME type sniffing

3. **X-Frame-Options**
   - Set to `SAMEORIGIN`
   - Prevents clickjacking attacks

4. **X-XSS-Protection**
   - Set to `1; mode=block`
   - Enables browser XSS filtering

5. **Strict-Transport-Security (HSTS)**
   - Forces HTTPS connections
   - `max-age=31536000` (1 year)

6. **Referrer-Policy**
   - Set to `no-referrer`
   - Prevents referrer leakage

### Configuration

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
        imgSrc: [`'self'`, 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
```

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is configured to control which domains can access the API.

### Configuration

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 3600, // Cache preflight for 1 hour
});
```

### Production CORS

For production, set the `CORS_ORIGIN` environment variable:

```env
# Single origin
CORS_ORIGIN=https://exam.example.com

# Multiple origins (comma-separated)
CORS_ORIGIN=https://exam.example.com,https://admin.example.com
```

## Input Validation

### Automatic Validation

All DTOs are automatically validated using `class-validator`:

```typescript
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

### Validation Pipeline

Configured in `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Strip unknown properties
    transform: true, // Transform to DTO classes
    forbidNonWhitelisted: true, // Reject unknown properties
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### Validation Errors

Invalid input returns HTTP 400 with detailed errors:

```json
{
  "statusCode": 400,
  "message": [
    "username should not be empty",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

## Password Security

### Hashing

Passwords are hashed using bcrypt with salt rounds:

```typescript
const hashedPassword = await bcrypt.hash(password, 10);
```

### Password Requirements

Enforced via validation:

- Minimum length: 6 characters
- Should include uppercase, lowercase, numbers, and special characters (recommended)

### Password Storage

- Passwords are NEVER stored in plaintext
- Passwords are NEVER logged or exposed in responses
- Password fields are excluded from all API responses

## Two-Factor Authentication

### TOTP-Based 2FA

- Uses Time-based One-Time Password (TOTP)
- Compatible with Google Authenticator, Authy, etc.
- 6-digit codes, 30-second time window

### 2FA Setup Flow

1. User calls `POST /auth/2fa/setup`
2. API returns QR code and secret
3. User scans QR code with authenticator app
4. User verifies setup with `POST /auth/2fa/verify`

### 2FA Login Flow

1. User submits credentials to `POST /auth/login`
2. If 2FA enabled, API returns `requiresMfa: true` with temp token
3. User submits OTP code to `POST /auth/2fa/verify` with temp token
4. API validates OTP and returns access/refresh tokens

### Disable 2FA

Users can disable 2FA with `POST /auth/2fa/disable` (requires valid OTP).

## Audit Logging

### What is Logged

All critical actions are logged in the `audit_logs` table:

- User logins and logouts
- CRUD operations on all entities
- Permission changes
- File uploads and deletions
- Configuration changes

### Audit Log Fields

- `userId` - Who performed the action
- `action` - What action was performed
- `entityType` - What entity was affected
- `entityId` - Which specific record
- `changes` - Before/after values (JSON)
- `ipAddress` - Request IP address
- `userAgent` - Client information
- `timestamp` - When it happened

### Accessing Audit Logs

Only `EXAM_DIRECTOR` can access audit logs:

```http
GET /api/v1/audit-logs?userId=5&action=DELETE
```

## Best Practices

### 1. Use HTTPS in Production

Always use HTTPS in production. Never send credentials over HTTP.

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... other SSL config
}
```

### 2. Rotate JWT Secrets Regularly

Change `JWT_SECRET` periodically and invalidate old tokens.

### 3. Enable 2FA for Sensitive Accounts

Require 2FA for:
- EXAM_DIRECTOR accounts
- BUILDING_MANAGER accounts
- Production system access

### 4. Monitor Rate Limiting

Track rate limit violations to detect:
- Brute force attempts
- DDoS attacks
- Misbehaving clients

### 5. Review Audit Logs

Regularly review audit logs for:
- Unauthorized access attempts
- Suspicious activity patterns
- Compliance requirements

### 6. Keep Dependencies Updated

Regularly update dependencies to patch security vulnerabilities:

```bash
npm audit
npm audit fix
```

### 7. Use Strong Passwords

Enforce strong password policies:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No common passwords or dictionary words

### 8. Implement Account Lockout

After multiple failed login attempts:
- Lock account temporarily
- Require password reset
- Notify user via email

### 9. Sanitize User Input

Always validate and sanitize user input:
- Use DTOs with class-validator
- Escape special characters
- Prevent SQL injection (use TypeORM parameterized queries)

### 10. Secure File Uploads

For file uploads:
- Validate file types
- Limit file sizes (10MB default)
- Scan for malware (recommended for production)
- Store files outside web root

## Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong, random value
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Review and adjust rate limits
- [ ] Enable 2FA for admin accounts
- [ ] Set up monitoring and alerting
- [ ] Regular database backups
- [ ] Implement log rotation
- [ ] Review and test security headers
- [ ] Scan for vulnerabilities (`npm audit`)
- [ ] Set up intrusion detection (fail2ban, etc.)
- [ ] Document incident response procedures

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com. Do not create public GitHub issues for security vulnerabilities.

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

**Last Updated**: 2025-11-14
**Version**: 1.0
