# Security Review

## Authentication & Authorization
- **Method:** JSON Web Tokens (JWT).
- **Storage:** `localStorage` (Client-side).
    - *Risk:* Vulnerable to XSS.
    - *Mitigation:* `helmet` on backend prevents some XSS vectors, but moving to HttpOnly cookies is recommended for v2.
- **Passwords:** Hashed using `bcryptjs` (Salt rounds: 10).

## Access Control (RBAC/Multi-tenancy)
The system enforces strict group-level isolation.
- **Middleware:** `requireGroupAccess`
- **Validation:** Every request to a financial resource **must** include `X-Group-ID`.
- **Check:** The middleware verifies against the database that `req.user.id` is a member of `req.group.id`.
- **SQL Injection:** All queries use parameterized queries (`pg` client), preventing injection attacks.

## Input Validation
- **UUIDs:** The backend strictly validates `group_id` and other ID parameters using regex (`/^[0-9a-fA-F]{8}-.../`) before processing to prevent invalid database queries.
- **Amounts:** Numerical values are validated to be finite and positive.

## API Security
- **CORS:** Enabled via `cors` middleware.
- **Headers:** `helmet` sets standard security headers (HSTS, No-Sniff, etc.).
- **Rate Limiting:** Not currently implemented (Recommended for v1.0.1).

## Secret Management
- Secrets (API Keys, DB Creds) are loaded via `dotenv`.
- **Audit:** Ensure `.env` is never committed to git (checked `.gitignore` and it is present).