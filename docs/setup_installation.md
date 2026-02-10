# Setup & Installation

## Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development outside Docker)

## Environment Variables
Create a `.env` file in the root `controlefinanceiro/` directory:

```ini
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=financedb
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Redis
REDIS_URL=redis://redis:6379

# JWT Secret (Generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here_12345

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Initial Users (Auto-synced on startup)
APP_USER_DYONE=dyone.andrade
APP_PASS_DYONE=initial_password
APP_USER_JULIA=julia.ferreira
APP_PASS_JULIA=initial_password

# Frontend API URL (for build)
VITE_API_URL=http://localhost:3000/api
```

## Running with Docker (Recommended)
This starts Postgres, Redis, Backend, and Frontend.

```bash
docker-compose up --build -d
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3000](http://localhost:3000)

## Running Locally (Dev Mode)

### 1. Start Infrastructure (DB + Redis)
You still need the databases running.
```bash
docker-compose up -d db redis
```

### 2. Start Backend
```bash
cd server
npm install
npm run dev # or node --watch index.js
```

### 3. Start Frontend
```bash
cd ..
npm install
npm run dev
```
