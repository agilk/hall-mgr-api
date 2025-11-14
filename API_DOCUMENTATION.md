# Exam Supervision System - API Documentation

## Table of Contents
1. [External Authorization Service](#external-authorization-service)
2. [System API Endpoints](#system-api-endpoints)
3. [Authentication Flow](#authentication-flow)
4. [Role-Based Access Control](#role-based-access-control)

---

## External Authorization Service

This system integrates with an external authorization service for user authentication and authorization. The service URL is configured in the `.env` file under `AUTH_SERVICE_URL`.

### Configuration

```env
AUTH_SERVICE_URL=https://auth.example.com/api
AUTH_SERVICE_API_KEY=your-auth-service-api-key
```

### Authorization Service API Endpoints

#### 1. User Registration
**Endpoint:** `POST /auth/register`

**Headers:**
```
Content-Type: application/json
X-API-Key: {AUTH_SERVICE_API_KEY}
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePassword123!",
  "phone": "+1234567890",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "fatherName": "Michael",
    "dateOfBirth": "1990-01-15",
    "institution": "University XYZ",
    "specialty": "Computer Science",
    "contactDetails": "john@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid-user-id",
    "email": "user@example.com",
    "username": "johndoe",
    "requiresTwoFactor": false,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

---

#### 2. User Login
**Endpoint:** `POST /auth/login`

**Headers:**
```
Content-Type: application/json
X-API-Key: {AUTH_SERVICE_API_KEY}
```

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (Without 2FA):**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 86400,
    "user": {
      "userId": "uuid-user-id",
      "email": "user@example.com",
      "username": "johndoe",
      "roles": ["supervisor"]
    }
  }
}
```

**Response (With 2FA Enabled):**
```json
{
  "success": true,
  "requiresTwoFactor": true,
  "data": {
    "tempToken": "temporary-token-for-2fa",
    "expiresIn": 300
  }
}
```

---

#### 3. Verify 2FA Token
**Endpoint:** `POST /auth/verify-2fa`

**Headers:**
```
Content-Type: application/json
X-API-Key: {AUTH_SERVICE_API_KEY}
```

**Request Body:**
```json
{
  "tempToken": "temporary-token-from-login",
  "totpCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 86400,
    "user": {
      "userId": "uuid-user-id",
      "email": "user@example.com",
      "username": "johndoe",
      "roles": ["supervisor"]
    }
  }
}
```

---

#### 4. Enable 2FA
**Endpoint:** `POST /auth/enable-2fa`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {accessToken}
X-API-Key: {AUTH_SERVICE_API_KEY}
```

**Request Body:**
```json
{
  "userId": "uuid-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "secret": "base32-encoded-secret",
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "backupCodes": [
      "12345678",
      "87654321",
      "11223344"
    ]
  }
}
```

---

#### 5. Confirm 2FA Setup
**Endpoint:** `POST /auth/confirm-2fa`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {accessToken}
X-API-Key: {AUTH_SERVICE_API_KEY}
```

**Request Body:**
```json
{
  "userId": "uuid-user-id",
  "secret": "base32-encoded-secret",
  "totpCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

---

#### 6. Validate Access Token
**Endpoint:** `POST /auth/validate`

**Headers:**
```
Content-Type: application/json
X-API-Key: {AUTH_SERVICE_API_KEY}
```

**Request Body:**
```json
{
  "accessToken": "jwt-access-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "userId": "uuid-user-id",
      "email": "user@example.com",
      "username": "johndoe",
      "roles": ["supervisor", "building_manager"]
    },
    "expiresAt": "2025-01-16T10:30:00Z"
  }
}
```

---

#### 7. Refresh Access Token
**Endpoint:** `POST /auth/refresh`

**Headers:**
```
Content-Type: application/json
X-API-Key: {AUTH_SERVICE_API_KEY}
```

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-access-token",
    "refreshToken": "new-jwt-refresh-token",
    "expiresIn": 86400
  }
}
```

---

#### 8. Assign Role to User
**Endpoint:** `POST /auth/roles/assign`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {adminAccessToken}
X-API-Key: {AUTH_SERVICE_API_KEY}
```

**Request Body:**
```json
{
  "userId": "uuid-user-id",
  "role": "building_manager",
  "metadata": {
    "buildingId": "building-uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role assigned successfully"
}
```

---

#### 9. Revoke Role from User
**Endpoint:** `POST /auth/roles/revoke`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {adminAccessToken}
X-API-Key: {AUTH_SERVICE_API_KEY}
```

**Request Body:**
```json
{
  "userId": "uuid-user-id",
  "role": "building_manager"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role revoked successfully"
}
```

---

#### 10. Logout
**Endpoint:** `POST /auth/logout`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {accessToken}
X-API-Key: {AUTH_SERVICE_API_KEY}
```

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Authentication Flow

### 1. Registration Flow
```
User → POST /auth/register → Auth Service
     ← User Created
     ← requiresTwoFactor: false
```

### 2. Login Flow (Without 2FA)
```
User → POST /auth/login → Auth Service
     ← accessToken, refreshToken
```

### 3. Login Flow (With 2FA)
```
User → POST /auth/login → Auth Service
     ← tempToken, requiresTwoFactor: true

User → POST /auth/verify-2fa (with TOTP code) → Auth Service
     ← accessToken, refreshToken
```

### 4. Enable 2FA Flow
```
User → POST /auth/enable-2fa → Auth Service
     ← secret, qrCode, backupCodes

User → Scan QR Code with Google Authenticator
     → Enter TOTP code

User → POST /auth/confirm-2fa (with TOTP code) → Auth Service
     ← 2FA enabled successfully
```

---

## Role-Based Access Control

### Available Roles

1. **supervisor** - Exam supervisor/volunteer
2. **building_manager** - Building manager
3. **exam_director** - Exam director (admin)

### Role Permissions

#### Supervisor Role
- View own profile
- Update own profile
- View assignment offers
- Accept/reject assignments
- Log exam day activities (timestamps, attendance, violations)
- Submit feedback
- View own assignment history

#### Building Manager Role
- All supervisor permissions
- Manage supervisors in assigned building(s)
- Create/edit/delete room assignments
- Mark rooms as "no supervisor needed"
- View real-time monitoring for assigned building(s)
- Receive and respond to supervisor feedback
- View violation reports for assigned building(s)

#### Exam Director Role
- All building manager permissions (across all buildings)
- Approve/deactivate supervisors
- View system-wide statistics
- Upload exam documents
- Message supervisors
- Access full audit logs
- Manage buildings and halls

---

## Error Responses

All authorization service endpoints follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "specific error details"
    }
  }
}
```

### Common Error Codes

- `INVALID_CREDENTIALS` - Invalid username/email or password
- `USER_NOT_FOUND` - User does not exist
- `INVALID_TOKEN` - Access token is invalid or expired
- `INVALID_2FA_CODE` - 2FA TOTP code is incorrect
- `2FA_REQUIRED` - 2FA is enabled but code not provided
- `INSUFFICIENT_PERMISSIONS` - User lacks required role/permission
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVICE_UNAVAILABLE` - Auth service is down

---

## System API Endpoints

Documentation for the Exam Supervision System's own API endpoints will be available via Swagger UI at `/api/docs` when the application is running.

### Base URL
```
http://localhost:3000/api
```

### Swagger Documentation
```
http://localhost:3000/api/docs
```

---

## Integration Notes

1. **API Key Authentication**: All requests to the authorization service must include the `X-API-Key` header with the configured API key from `.env`.

2. **Token Storage**: Access tokens should be stored securely (e.g., HTTP-only cookies or secure storage). Refresh tokens should be stored separately.

3. **Token Refresh**: Implement automatic token refresh when access tokens expire using the refresh token.

4. **Role Synchronization**: User roles from the auth service should be synchronized with the local database for performance.

5. **Error Handling**: Implement proper error handling for all auth service responses, including network errors and service unavailability.

6. **Rate Limiting**: The auth service may implement rate limiting. Implement exponential backoff for retries.

7. **Audit Logging**: All authentication and authorization events should be logged in the audit log.

---

## Security Considerations

1. **HTTPS Only**: The authorization service should only be accessed over HTTPS in production.

2. **API Key Protection**: The `AUTH_SERVICE_API_KEY` must be kept secret and never exposed to clients.

3. **Token Validation**: Always validate tokens with the auth service before granting access to protected resources.

4. **2FA Enforcement**: 2FA should be mandatory for building managers and exam directors.

5. **Session Management**: Implement proper session timeout and logout functionality.

6. **CORS Configuration**: Configure CORS properly to allow only trusted frontend origins.
