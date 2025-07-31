# Reset Password Functionality

## Overview

The reset password functionality allows administrators to assign passwords to existing users who don't have passwords yet. This is useful for onboarding new users or resetting passwords for existing users.

## URL

The reset password page is located at:
```
/auth/login/admin/reset-password
```

## API Endpoint

The API endpoint for resetting passwords is:
```
POST /api/admin/reset-password
```

## Authentication

- **Required**: User must be authenticated and have ADMIN role
- **Access**: Only administrators can access this functionality

## API Request

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "email": "user@example.com",
  "newPassword": "newpassword123"
}
```

### Validation Rules
- Email is required
- New password must be at least 6 characters long
- User must exist in the database

## API Response

### Success (200)
```json
{
  "message": "Contraseña actualizada exitosamente",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "WORKER"
  }
}
```

### Error Responses

#### Unauthorized (401)
```json
{
  "message": "No autorizado"
}
```

#### Forbidden (403)
```json
{
  "message": "Acceso denegado. Solo administradores pueden resetear contraseñas."
}
```

#### Bad Request (400)
```json
{
  "message": "Email y nueva contraseña son requeridos"
}
```

#### Not Found (404)
```json
{
  "message": "Usuario no encontrado"
}
```

#### Server Error (500)
```json
{
  "message": "Error interno del servidor"
}
```

## Features

1. **Password Hashing**: Passwords are securely hashed using bcrypt with 12 salt rounds
2. **Audit Logging**: All password reset actions are logged in the AuditLog table
3. **Role-based Access**: Only administrators can reset passwords
4. **Input Validation**: Comprehensive validation for email and password requirements
5. **Error Handling**: Proper error messages for different scenarios

## Database Schema

The functionality requires the following database fields:

### User Model
- `password` (String, optional): Hashed password for authentication

### AuditLog Model
- `userId` (String): ID of the user whose password was reset
- `action` (String): Set to "PASSWORD_RESET"
- `entityType` (String): Set to "USER"
- `entityId` (String): ID of the user
- `oldValues` (String, optional): null for password resets
- `newValues` (String): JSON with password update confirmation

## Security Considerations

1. **Authentication Required**: Users must be logged in as administrators
2. **Password Hashing**: All passwords are hashed using bcrypt
3. **Audit Trail**: All password changes are logged for security
4. **Input Validation**: Prevents invalid data from being processed
5. **Error Handling**: Prevents information leakage through error messages

## Usage Example

1. Navigate to `/auth/login/admin/reset-password`
2. Enter the user's email address
3. Enter a new password (minimum 6 characters)
4. Confirm the password
5. Submit the form
6. The user will be able to log in with the new password immediately 