# Authentication Strategy

## Phase 1: Simple Email/Password Authentication (Current Scope)

### Overview
Multi-user platform with basic email/password authentication. Focus on simplicity and core functionality, with advanced security features planned for Phase 2.

### User Registration (Signup)
- **Email**: Valid email format required (validation regex)
- **Password**: Minimum 8 characters required
- **Password Storage**: Hashed with bcrypt (10+ rounds)
- **Auto-login**: User automatically logged in after successful signup

### User Login
- **Credentials**: Email + password
- **Session**: JWT-based session token
- **Session Duration**: 30 days (configurable)
- **Error Handling**: Generic error message (don't reveal if email exists)

### Data Isolation
- **User Ownership**: All tasks, categories, tags, and bookmarks belong to specific users
- **Database Level**: All queries filtered by `userId`
- **API Level**: Middleware validates user session before data access
- **Privacy**: Users can ONLY see and manage their own data

### Technical Implementation

#### NextAuth.js Configuration
```typescript
// lib/auth.ts
- Credentials Provider (email/password)
- JWT session strategy
- Custom callbacks for user data
- Protected API routes
```

#### Password Security
```typescript
// lib/auth-utils.ts
- bcrypt hashing (10+ rounds)
- Password validation (8+ chars, optional complexity rules)
- Email format validation
```

#### Middleware
```typescript
// middleware.ts
- Protect all /app routes except /login and /signup
- Redirect unauthenticated users to /login
- Attach user session to requests
```

#### Database Schema
```prisma
model User {
  id               String    @id @default(cuid())
  email            String    @unique
  password         String
  resetToken       String?   // v1.4.0: Password reset token
  resetTokenExpiry DateTime? // v1.4.0: Token expiration timestamp
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  tasks         Task[]
  bookmarks     NewsBookmark[]
  config        UserConfig?
  
  @@map("app_users")
}

model Task {
  // ... other fields
  userId        String
  user          User     @relation(fields: [userId], references: [id])
}
```

### Security Measures (Phase 1)
✅ Password hashing with bcrypt  
✅ JWT session tokens (httpOnly cookies)  
✅ Email validation  
✅ Minimum password length enforcement  
✅ User data isolation at DB level  
✅ Protected API routes  
✅ Generic error messages (no user enumeration)  

### What's NOW in Phase 1 (v1.4.0)
✅ Password reset via email (Resend API)  
✅ Secure reset tokens with 1-hour expiry  
✅ Email-based password recovery flow  
✅ Rate limiting for password reset requests (3/15min)  

### What's NOT Yet Implemented
❌ Two-Factor Authentication (2FA)  
❌ OAuth (Google, GitHub, etc.)  
❌ Single Sign-On (SSO)  
❌ Account email verification  
❌ Password strength meter  
❌ Global login attempt rate limiting  
❌ Session device management  

---

## Phase 2: Enhanced Security (Future)

### Planned Features
1. **Password Reset** ✅ **IMPLEMENTED in v1.4.0**
   - ✅ Email-based password reset flow
   - ✅ Secure reset tokens with 1-hour expiration
   - ✅ Resend API email service integration
   - ✅ Professional HTML email templates
   - ✅ Rate limiting (3 requests/15min per email)
   - ✅ Database fields: resetToken, resetTokenExpiry

2. **Two-Factor Authentication (2FA)**
   - TOTP-based (Google Authenticator, Authy)
   - Backup codes for recovery
   - Optional but recommended

3. **OAuth Integration**
   - Google Sign-In
   - GitHub Sign-In
   - Facebook (optional)
   - Link multiple auth methods to one account

4. **Single Sign-On (SSO)**
   - SAML 2.0 support
   - For enterprise customers
   - Custom domain integration

5. **Enhanced Security**
   - Login attempt rate limiting (5 attempts / 15 min)
   - Account lockout after failed attempts
   - Email verification on signup
   - Password strength requirements (uppercase, numbers, symbols)
   - Session device management (see all active sessions)
   - Suspicious login detection

6. **User Profile Management**
   - Change password (with old password verification)
   - Update email (with verification)
   - Delete account functionality
   - Export user data (GDPR compliance)

---

## Testing Requirements

### BA Testing Scenarios
- [ ] User can sign up with valid email and password
- [ ] User cannot sign up with existing email
- [ ] User cannot sign up with invalid email format
- [ ] User cannot sign up with password < 8 characters
- [ ] User can login with correct credentials
- [ ] User cannot login with incorrect password
- [ ] User cannot login with non-existent email
- [ ] User can only see their own tasks/bookmarks after login

### DEV Testing Tasks
- [ ] Unit tests for password hashing
- [ ] Unit tests for email validation
- [ ] Integration tests for signup API
- [ ] Integration tests for login API
- [ ] Integration tests for session middleware
- [ ] Integration tests for user data isolation
- [ ] Test JWT token generation and validation

### QC Testing Tasks
- [ ] Manual testing: signup flow
- [ ] Manual testing: login flow
- [ ] Manual testing: session persistence
- [ ] Manual testing: logout functionality
- [ ] Security testing: verify passwords are hashed in DB
- [ ] Security testing: verify user data isolation
- [ ] Security testing: test generic error messages
- [ ] E2E tests: complete signup → login → use app flow
- [ ] E2E tests: session expiration behavior

---

## User Flows

### Signup Flow
```
1. User visits /signup
2. User enters email + password
3. System validates email format
4. System validates password length (8+ chars)
5. System checks if email already exists
6. System hashes password with bcrypt
7. System creates user record in database
8. System generates JWT session token
9. System redirects to /tasks (logged in)
```

### Login Flow
```
1. User visits /login
2. User enters email + password
3. System looks up user by email
4. System compares password hash
5. If valid: generate JWT token, redirect to /tasks
6. If invalid: show generic "Invalid credentials" error
```

### Protected Route Access
```
1. User navigates to /tasks
2. Middleware checks for valid session token
3. If valid: allow access, attach userId to request
4. If invalid: redirect to /login
5. All data queries filtered by userId
```

### Password Reset Flow (v1.4.0)
```
1. User visits /forgot-password
2. User enters registered email address
3. System validates email format
4. System looks up user by email
5. System generates cryptographically secure reset token (32 bytes)
6. System stores token hash and expiry (1 hour) in database
7. System sends email with reset link via Resend API
8. User receives professional HTML email with reset button
9. User clicks reset link → redirected to /reset-password?token=...
10. User enters new password (min 6 characters)
11. System validates token (not expired, matches hash)
12. System hashes new password with bcrypt
13. System updates password and clears reset token
14. System redirects to /login
15. User logs in with new password ✅
```

**Rate Limiting:**
- Max 3 forgot password requests per 15 minutes per email
- Prevents abuse and spam
- Returns generic success message even if email doesn't exist (security)

**Security Features:**
- Reset tokens: 64-character hex strings (crypto.randomBytes(32))
- Token expiry: Exactly 1 hour from generation
- Single-use tokens: Cleared immediately after password reset
- Email privacy: No enumeration (same response for existing/non-existing emails)
- HTTPS required in production for secure token transmission

---

## Configuration

### Environment Variables
```bash
# .env.local
NEXTAUTH_SECRET=<random-secure-string>
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://...
BCRYPT_ROUNDS=10
SESSION_MAX_AGE=2592000  # 30 days in seconds

# Password Reset (v1.4.0)
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### NextAuth Options
```typescript
{
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login', signUp: '/signup' },
  providers: [CredentialsProvider],
  callbacks: { jwt, session }
}
```

---

## Migration Path to Phase 2

When implementing Phase 2 features:
1. Add new auth providers to NextAuth config
2. Add optional fields to User model (e.g., `twoFactorEnabled`)
3. Create email service integration
4. Add rate limiting middleware
5. Maintain backward compatibility with Phase 1 users
6. Gradual rollout with feature flags
