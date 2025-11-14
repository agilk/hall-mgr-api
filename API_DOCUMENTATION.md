# API Documentation for Frontend Developers

Base URL: `/api`

## Table of Contents
1. [MQM App Authentication](#mqm-app-authentication)
2. [User Management](#user-management)
3. [Error Codes Reference](#error-codes-reference)

---

## MQM App Authentication

Base path: `/api/mqm-app-auth`

### 1. Login
**Endpoint:** `POST /api/mqm-app-auth/login`

**Description:** Authenticates a user with username, password, and role. If the user has MFA enabled, returns a temporary token for MFA verification.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)",
  "roleUid": "string (required)"
}
```

**Success Response (200):**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "accessExpires": "string (e.g., '30m')",
  "refreshExpires": "string (e.g., '240h')",
  "user": {
    "id": "number",
    "uid": "string",
    "username": "string",
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "mfaEnabled": "boolean"
  }
}
```

**Error Response (401):**
```json
{
  "errno": "number",
  "code": "string"
}
```

---

### 2. MFA Setup
**Endpoint:** `POST /api/mqm-app-auth/mfa-setup`

**Description:** Sets up Multi-Factor Authentication for a user account.

**Headers:**
```
Authorization: Bearer <temp_token>
```

**Request Body:**
```json
{
  "otp": "string (required, 6-digit code)"
}
```

**Success Response (200):**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "accessExpires": "string",
  "refreshExpires": "string",
  "user": {
    "id": "number",
    "uid": "string",
    "username": "string",
    "mfaEnabled": "boolean"
  }
}
```

**Error Response (403):**
- Invalid OTP or authentication failure

---

### 3. MFA Verify
**Endpoint:** `POST /api/mqm-app-auth/mfa-verify`

**Description:** Verifies the MFA code during login process.

**Headers:**
```
Authorization: Bearer <temp_token>
```

**Request Body:**
```json
{
  "otp": "string (required, 6-digit code)"
}
```

**Success Response (200):**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "accessExpires": "string",
  "refreshExpires": "string",
  "user": {
    "id": "number",
    "uid": "string",
    "username": "string",
    "mfaEnabled": "boolean"
  }
}
```

**Error Response (403):**
- Invalid OTP or authentication failure

---

## User Management

Base path: `/api/users`

### 4. Create User
**Endpoint:** `POST /api/users/`

**Description:** Registers a new user account. An OTP will be sent to the provided phone number for activation.

**Request Body:**
```json
{
  "username": "string (required)",
  "fullName": "string (required)",
  "password": "string (required)",
  "phone": "string (required)",
  "email": "string (optional)",
  "firstName": "string (optional)",
  "middleName": "string (optional)",
  "lastName": "string (optional)",
  "personalId": "string (optional)",
  "gender": "string (optional)",
  "birthday": "string (optional, ISO date)",
  "referralId": "string (optional)",
  "noSms": "boolean (optional, default: false)"
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": "number",
    "uid": "string",
    "username": "string",
    "createdAt": "string (ISO date)"
  }
}
```

**Error Responses:**
- **500** - User already exists (active)
```json
{
  "error": {
    "errno": -107,
    "code": "USER_EXISTS_ACTIVE",
    "isLocked": "boolean"
  }
}
```
- **500** - User already exists (inactive)
```json
{
  "error": {
    "errno": -108,
    "code": "USER_EXISTS_INACTIVE",
    "isLocked": "boolean"
  }
}
```
- **500** - SMS center not working
```json
{
  "error": {
    "errno": -119,
    "code": "SMSC_NOT_WORKING",
    "deliver": "object"
  }
}
```

---

### 5. Activate User
**Endpoint:** `POST /api/users/activate`

**Description:** Activates a newly registered user account using the OTP sent to their phone.

**Request Body:**
```json
{
  "phone": "string (required)",
  "otp": "string (required, 6-digit code)",
  "isActive": "boolean (optional)"
}
```

**Success Response (200):**
```json
{
  "id": "number",
  "uid": "string",
  "username": "string",
  "phone": "string",
  "isActive": "boolean"
}
```

**Error Responses:**
- **404** - Cannot find user by OTP
```json
{
  "error": {
    "errno": -112,
    "code": "CANNOT_FIND_USER_BY_OTP"
  }
}
```
- **403** - User already active
```json
{
  "error": {
    "errno": -115,
    "code": "USER_ALREADY_ACTIVE"
  }
}
```

---

### 6. Reactivate User
**Endpoint:** `POST /api/users/reactivate`

**Description:** Reactivates a deactivated user account with a new password.

**Request Body:**
```json
{
  "phone": "string (required)",
  "otp": "string (required, 6-digit code)",
  "password": "string (required, new password)"
}
```

**Success Response (200):**
```json
{
  "id": "number",
  "uid": "string",
  "username": "string",
  "phone": "string",
  "isActive": "boolean"
}
```

**Error Responses:**
- **404** - Cannot find user by OTP
```json
{
  "error": {
    "errno": -112,
    "code": "CANNOT_FIND_USER_BY_OTP"
  }
}
```

---

### 7. Request OTP
**Endpoint:** `POST /api/users/request-otp`

**Description:** Requests a new OTP to be sent to the user's phone number.

**Request Body:**
```json
{
  "phone": "string (required)",
  "isActive": "boolean (optional)"
}
```

**Success Response (200):**
```json
{
  "data": "number (rows updated)"
}
```

**Error Responses:**
- **404** - User not found
```json
{
  "error": {
    "errno": -114,
    "code": "CANNOT_FIND_USER"
  }
}
```
- **500** - Cannot send OTP
```json
{
  "error": {
    "errno": -116,
    "code": "CANNOT_SEND_OTP"
  }
}
```

---

### 8. Login
**Endpoint:** `POST /api/users/login`

**Description:** Authenticates a user and returns access and refresh tokens.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)",
  "asAdmin": "boolean (optional)"
}
```

**Success Response (200):**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "accessExpires": "string (e.g., '30m')",
  "refreshExpires": "string (e.g., '240h')",
  "user": {
    "id": "number",
    "uid": "string",
    "username": "string",
    "fullName": "string",
    "firstName": "string",
    "middleName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "personalId": "string",
    "gender": "string",
    "birthday": "string",
    "isActive": "boolean",
    "isLocked": "boolean",
    "hasAdminRights": "boolean",
    "mfaEnabled": "boolean",
    "roles": [
      {
        "id": "number",
        "uid": "string",
        "name": "string"
      }
    ]
  }
}
```

**Error Responses:**
- **400** - Empty login request
```json
{
  "error": {
    "errno": -102,
    "code": "EMPTY_LOGIN_REQUEST"
  }
}
```
- **401** - Invalid username or password
```json
{
  "error": {
    "errno": -103,
    "code": "INVALID_USERNAME_PASSWORD"
  }
}
```
- **401** - User locked (too many wrong attempts)
```json
{
  "error": {
    "errno": -109,
    "code": "USER_LOCKED"
  }
}
```
- **401** - User inactive
```json
{
  "error": {
    "errno": -110,
    "code": "USER_INACTIVE"
  }
}
```

**Note:** After 3 failed login attempts (configurable via `MAX_WRONG_COUNT`), the user account will be automatically locked.

---

## Authenticated User Endpoints

These endpoints require authentication. Include the access token in the request header:
```
Authorization: Bearer <access_token>
```

### 9. Edit User Info
**Endpoint:** `POST /api/users/user-edit-info`

**Description:** Updates the authenticated user's profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "email": "string (optional)",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "middleName": "string (optional)",
  "personalId": "string (optional)",
  "gender": "string (optional)",
  "birthday": "string (optional, ISO date)"
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": "number",
    "uid": "string",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "middleName": "string",
    "personalId": "string",
    "gender": "string",
    "birthday": "string"
  }
}
```

**Error Response (401):**
- Unauthorized (invalid or missing token)

---

### 10. Change Password
**Endpoint:** `POST /api/users/change-password`

**Description:** Changes the authenticated user's password. After successful password change, the user will be automatically logged in with new credentials.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "oldPassword": "string (required)",
  "newPassword": "string (required)"
}
```

**Success Response (200):**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "accessExpires": "string",
  "refreshExpires": "string",
  "user": {
    "id": "number",
    "uid": "string",
    "username": "string",
    "fullName": "string",
    "phone": "string",
    "email": "string"
  }
}
```

**Error Responses:**
- **400** - Empty login request
```json
{
  "error": {
    "errno": -102,
    "code": "EMPTY_LOGIN_REQUEST"
  }
}
```
- **403** - Old password doesn't match
```json
{
  "error": {
    "errno": -106,
    "code": "USER_PASSWORD_NOT_MATCH",
    "username": "string"
  }
}
```
- **500** - Cannot change password
```json
{
  "error": {
    "errno": -105,
    "code": "CANNOT_CHANGE_PASSWORD",
    "username": "string"
  }
}
```

**Note:** All existing refresh tokens will be deactivated after password change.

---

### 11. Refresh Access Token
**Endpoint:** `GET /api/users/token/access`

**Description:** Generates a new access token and refresh token using a valid refresh token.

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Success Response (200):**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "accessExpires": "string (e.g., '30m')",
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "accessExpires": "string"
  }
}
```

**Error Response (403):**
- Invalid or expired refresh token

**Note:**
- The old refresh token will remain active
- Use this endpoint before the access token expires to maintain user session
- The refresh token has a longer lifetime (default: 240h / 10 days)

---

## Error Codes Reference

| Error Code | errno | Description |
|------------|-------|-------------|
| `CANNOT_CREATE` | -1 | Failed to create user in database |
| `EMPTY_LOGIN_REQUEST` | -102 | Missing username or password |
| `INVALID_USERNAME_PASSWORD` | -103 | Invalid credentials |
| `USER_EXISTS_ACTIVE` | -107 | User already exists and is active |
| `USER_EXISTS_INACTIVE` | -108 | User already exists but is inactive |
| `USER_LOCKED` | -109 | User account is locked due to multiple failed login attempts |
| `USER_INACTIVE` | -110 | User account is not activated |
| `CANNOT_FIND_USER_BY_OTP` | -112 | Invalid or expired OTP |
| `CANNOT_ACTIVATE_USER_BY_OTP` | -113 | Failed to activate user |
| `CANNOT_FIND_USER` | -114 | User not found |
| `USER_ALREADY_ACTIVE` | -115 | User is already activated |
| `CANNOT_SEND_OTP` | -116 | Failed to send OTP |
| `USER_PASSWORD_NOT_MATCH` | -106 | Old password is incorrect |
| `CANNOT_CHANGE_PASSWORD` | -105 | Failed to change password |
| `SMSC_NOT_WORKING` | -119 | SMS center is not responding |
| `CANNOT_LOGIN` | -101 | Login process failed |

---

## Authentication Flow

### Standard Login Flow
1. **POST** `/api/users/login` with username and password
2. Receive `accessToken` and `refreshToken`
3. Include `accessToken` in Authorization header for authenticated requests
4. When `accessToken` expires, use `refreshToken` to get new tokens via **GET** `/api/users/token/access`

### Registration & Activation Flow
1. **POST** `/api/users/` to create a new user account
2. OTP is sent to the provided phone number
3. **POST** `/api/users/activate` with phone and OTP to activate account

### Password Recovery Flow
1. **POST** `/api/users/request-otp` with phone number
2. OTP is sent to the phone
3. **POST** `/api/users/reactivate` with phone, OTP, and new password

### MQM App Authentication Flow
1. **POST** `/api/mqm-app-auth/login` with username, password, and roleUid
2. If MFA is required:
   - Receive temporary token
   - **POST** `/api/mqm-app-auth/mfa-verify` with temp token and OTP
3. Receive final `accessToken` and `refreshToken`

---

## General Notes

### Token Lifetimes
- **Access Token:** 30 minutes (configurable via `ACCESS_TOKEN_LIFETIME`)
- **Access Token (Admin):** 30 minutes (configurable via `ACCESS_TOKEN_LIFETIME_ADMIN`)
- **Refresh Token:** 240 hours / 10 days (configurable via `REFRESH_TOKEN_LIFETIME`)

### OTP
- **OTP Lifetime:** 310 seconds / ~5 minutes (configurable via `OTP_LIFETIME`)
- **OTP Length:** 6 digits

### Security Features
- **Account Locking:** After 3 failed login attempts (configurable via `MAX_WRONG_COUNT`), the account is automatically locked
- **Password Hashing:** All passwords are hashed using bcrypt
- **Token Invalidation:** All refresh tokens are invalidated when password is changed

### Headers
All authenticated requests must include:
```
Authorization: Bearer <access_token>
```

### Response Format
All error responses follow this format:
```json
{
  "error": {
    "errno": "number",
    "code": "string",
    "...additionalFields": "any"
  }
}
```

All success responses typically include a `data` field or direct payload with relevant information.
