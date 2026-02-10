# Login & Authentication Feature

The authentication system is built using JSON Web Tokens (JWT) and BCrypt for password hashing.

## Backend Implementation
- **Library:** `jsonwebtoken`, `bcryptjs`.
- **Flow:**
    1. User submits credentials.
    2. Server verifies hash against PostgreSQL `users` table.
    3. If valid, server signs a JWT containing `userId` and `username`.
    4. Token expires in 8 hours.
- **Security:**
    - Passwords are salted and hashed (10 rounds).
    - `helmet` is used for basic security headers.
    - Protected routes require `Authorization: Bearer <token>`.

## Frontend Implementation
- **Context:** `AuthContext` manages the token state.
- **Storage:** Token is stored in `localStorage` to persist across reloads.
- **Interceptor:** A custom fetch wrapper (or axios interceptor) automatically attaches the Bearer token to requests.