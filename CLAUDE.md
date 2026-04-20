# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (root)
```bash
npm run dev          # Vite dev server (hot reload)
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint
npm run test         # Vitest (all tests)
npx vitest run src/path/to/file.test.ts  # Single test
```

### Backend (server/)
```bash
cd server && npm run dev    # Nodemon auto-reload
cd server && npm test       # Jest tests
cd server && npm run seed   # Seed admin user
```

### Docker
```bash
docker compose up -d        # Start all services (frontend, backend, postgres, redis)
docker compose down         # Stop all
```

## Architecture

Full-stack financial management app: React frontend + Express backend + PostgreSQL + Redis.

### Frontend (`src/`)
- **React 19 + TypeScript + Vite** with Tailwind CSS styling
- **State**: Context API — `AuthContext` (JWT auth), `FinanceContext` (bills/incomes/investments/expenses), `GroupContext` (multi-tenancy), `CryptoContext` (E2EE key management)
- **Routing**: React Router DOM — Dashboard (`/`), CRUD routes (`/bills`, `/incomes`, `/investments`, `/expenses`), AI advisor (`/advisor`), admin panel (`/admin`)
- **AI**: Gemini-powered financial advisor with markdown rendering via `react-markdown`
- **Charts**: Recharts for dashboard visualizations

### Backend (`server/`)
- **Express 5** with modular controllers/routes/middleware pattern
- **Raw SQL** with `pg` client (no ORM) — pool configured in `server/config/database.js`
- **Auth middleware**: JWT validation (`authenticateToken`) + group-based access control (`requireGroupAccess` with `X-Group-ID` header)
- **AI**: Google Gemini via `@google/generative-ai`, responses cached in Redis
- **File imports**: OFX (`node-ofx-parser`) and PDF (`pdf-parse`) bank statement parsing via `multer` uploads

### Database (`init-scripts/`)
Sequential SQL migration files (01 through 09). Key tables: `users`, `bills`, `incomes`, `investments`, `random_expenses`, `groups`, `group_members`, `ai_advice_history`, `notifications`, `user_encryption_keys`.

### Multi-Tenancy
Groups act as isolated financial contexts. Users have roles (admin/editor/viewer) per group via `group_members`. All financial queries are scoped by group ID sent in the `X-Group-ID` header.

### E2EE (End-to-End Encryption)
Client-side encryption for sensitive financial data. PBKDF2-SHA256 (600k iterations) derives a DEK from the user's password, which wraps a random AES-256-GCM master key (MEK). Encrypted fields: name and value on financial records. Legacy plaintext records remain readable. Crypto utilities in `src/utils/crypto.ts`.

### CI/CD (`.github/workflows/deploy.yml`)
GitHub Actions: runs frontend + backend tests, validates Gemini API, deploys via Tailscale VPN + SSH to a Docker-based homelab server.

## Environment Variables

See `.env.example`. Key vars: `POSTGRES_*` (database), `JWT_SECRET`, `GEMINI_API_KEY`, `VITE_API_URL` (defaults to `/api`).
