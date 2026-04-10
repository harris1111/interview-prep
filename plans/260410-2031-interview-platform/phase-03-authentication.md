# Phase 3: Authentication & User Management

## Overview
- **Priority**: P1 (Blocks admin panel + interview features)
- **Status**: Pending
- **Effort**: 5h
- Email/password auth with JWT, SMTP email verification, forgot password, OTP.

## Key Insights
- User already has SMTP configured — just wire it up
- JWT with refresh token pattern (access token 15min, refresh token 7d)
- Store refresh tokens in Redis for fast revocation
- Guard-based auth in NestJS (AuthGuard, RolesGuard)
- No OAuth needed — email/password only

## Requirements

### Functional
- Sign up with email/password → verification email sent
- Email verification via token link
- Sign in → returns access + refresh tokens
- Forgot password → sends reset link via email
- Reset password via token
- JWT refresh endpoint
- Admin role check on protected routes
- User profile (view/update name, email)

### Non-Functional
- bcrypt for password hashing (cost factor 12)
- JWT access token: 15 min, refresh: 7 days
- Rate limiting on auth endpoints (5 req/min)
- CORS configured for frontend URL

## Architecture

```
POST /auth/register    → create user, send verification email
POST /auth/verify      → verify email token
POST /auth/login       → return { accessToken, refreshToken }
POST /auth/refresh     → new access token from refresh token
POST /auth/forgot      → send reset email
POST /auth/reset       → reset password with token
GET  /auth/me          → current user profile
PATCH /auth/me         → update profile

Guards:
  JwtAuthGuard   → validates access token on protected routes
  RolesGuard     → checks user.role against @Roles() decorator
```

## Related Code Files
- **Create**: `apps/api/src/modules/auth/auth.module.ts`
- **Create**: `apps/api/src/modules/auth/auth.controller.ts`
- **Create**: `apps/api/src/modules/auth/auth.service.ts`
- **Create**: `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- **Create**: `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`
- **Create**: `apps/api/src/modules/auth/guards/roles.guard.ts`
- **Create**: `apps/api/src/modules/auth/decorators/roles.decorator.ts`
- **Create**: `apps/api/src/modules/auth/decorators/current-user.decorator.ts`
- **Create**: `apps/api/src/modules/auth/dto/register.dto.ts`
- **Create**: `apps/api/src/modules/auth/dto/login.dto.ts`
- **Create**: `apps/api/src/modules/auth/dto/forgot-password.dto.ts`
- **Create**: `apps/api/src/modules/auth/dto/reset-password.dto.ts`
- **Create**: `apps/api/src/modules/mail/mail.module.ts`
- **Create**: `apps/api/src/modules/mail/mail.service.ts`
- **Create**: `apps/api/src/modules/mail/templates/` (email templates)
- **Create**: `apps/web/src/pages/auth/login.tsx`
- **Create**: `apps/web/src/pages/auth/register.tsx`
- **Create**: `apps/web/src/pages/auth/forgot-password.tsx`
- **Create**: `apps/web/src/pages/auth/reset-password.tsx`
- **Create**: `apps/web/src/pages/auth/verify-email.tsx`
- **Create**: `apps/web/src/stores/auth-store.ts`
- **Create**: `apps/web/src/services/auth-service.ts`
- **Create**: `apps/web/src/hooks/use-auth.ts`

## Implementation Steps

### Backend

1. **MailModule**: Configure `@nestjs-modules/mailer` with Handlebars templates
   - Verification email template (token link to frontend)
   - Password reset email template
   - Use env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

2. **AuthModule**: Register JwtModule, PassportModule
   - JWT secret from env, access token 15m expiry
   - Refresh tokens stored in Redis with TTL 7d

3. **AuthService**:
   - `register(dto)` → hash password, create user, generate verify token (crypto.randomUUID), send email
   - `verifyEmail(token)` → find user by verifyToken, set isVerified=true
   - `login(dto)` → validate credentials, check isVerified, return tokens
   - `refreshToken(token)` → validate refresh token from Redis, issue new access token
   - `forgotPassword(dto)` → generate reset token + expiry (1h), send email
   - `resetPassword(dto)` → validate token + expiry, hash new password, clear token

4. **JwtStrategy**: Extract user from JWT payload, attach to request
5. **RolesGuard**: Check `@Roles(UserRole.ADMIN)` decorator against `req.user.role`
6. **Rate limiting**: `@nestjs/throttler` — 5 requests per 60s on auth endpoints

### Frontend

7. **Auth pages**: Login, Register, Forgot Password, Reset Password, Verify Email
   - Simple forms with validation
   - Store tokens in localStorage (access) + httpOnly cookie considerations
   - Zustand auth store: `{ user, accessToken, login(), logout(), refresh() }`

8. **Auth interceptor**: Axios interceptor to attach Bearer token, auto-refresh on 401

9. **Protected routes**: React Router wrapper checking auth state, redirect to login if unauthenticated

## Todo List
- [ ] Create MailModule with SMTP config and email templates
- [ ] Create AuthModule with JWT strategy
- [ ] Implement register + email verification
- [ ] Implement login + token refresh
- [ ] Implement forgot password + reset
- [ ] Create JwtAuthGuard and RolesGuard
- [ ] Add rate limiting on auth endpoints
- [ ] Create frontend auth pages (login, register, forgot, reset, verify)
- [ ] Create auth store and API service
- [ ] Create protected route wrapper
- [ ] Test full auth flow end-to-end

## Success Criteria
- Register → verify email → login flow works
- Forgot → reset password flow works
- JWT refresh works transparently
- Admin-only routes reject non-admin users
- Rate limiting prevents brute force

## Security Considerations
- bcrypt cost factor 12
- Reset tokens expire in 1 hour
- Refresh tokens stored in Redis (server-side revocation)
- CORS restricted to WEB_URL
- No password in JWT payload — only userId and role
- Verify token is single-use (cleared after verification)
