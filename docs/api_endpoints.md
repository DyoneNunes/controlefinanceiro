# API Endpoints

The backend is built with Node.js and Express. All API routes are prefixed with `/api`.

**Base URL:** `http://localhost:3000/api`

## Authentication

### Login
- **Endpoint:** `POST /auth/login`
- **Body:** `{ "username": "user", "password": "password" }`
- **Response:** `{ "token": "jwt_token...", "username": "user", "success": true }`

### Validate Token
- **Endpoint:** `GET /auth/validate`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ "valid": true, "username": "user" }`

## Groups Management
Requires `Authorization` header.

### List Groups
- **Endpoint:** `GET /groups`
- **Response:** List of groups the user belongs to.

### Create Group
- **Endpoint:** `POST /groups`
- **Body:** `{ "name": "My Family Group" }`
- **Response:** `{ "id": "uuid", "name": "...", "role": "admin" }`

### Get Group Details
- **Endpoint:** `GET /groups/:id`
- **Headers:** `X-Group-ID: <group_id>`
- **Response:** Group metadata (id, name, created_at).

### Update Group
- **Endpoint:** `PUT /groups/:id`
- **Headers:** 
    - `Authorization: Bearer <token>`
    - `X-Group-ID: <group_id>`
- **Body:** `{ "name": "New Group Name" }`
- **Response:** Updated group object.
- **Note:** Admin only.

### Delete Group
- **Endpoint:** `DELETE /groups/:id`
- **Headers:** 
    - `Authorization: Bearer <token>`
    - `X-Group-ID: <group_id>`
- **Response:** `{ "message": "Group deleted successfully" }`
- **Note:** Admin only.

### Invite User
- **Endpoint:** `POST /groups/:id/invite`
- **Headers:** `X-Group-ID: <group_id>`
- **Body:** `{ "username": "julia.ferreira" }`
- **Note:** Admin only.

## Financial Resources
All financial endpoints require:
1. `Authorization: Bearer <token>`
2. `X-Group-ID: <group_id>`

### Bills (Fixed Expenses)
- `GET /bills`: List all bills.
- `POST /bills`: Create bill. Body: `{ "name", "value", "dueDate", "status" }`
- `DELETE /bills/:id`: Delete bill.
- `PATCH /bills/:id/pay`: Mark as paid.

### Incomes
- `GET /incomes`: List incomes.
- `POST /incomes`: Create income. Body: `{ "description", "value", "date" }`
- `DELETE /incomes/:id`: Delete income.

### Investments
- `GET /investments`: List investments.
- `POST /investments`: Create investment. Body: `{ "name", "initialAmount", "cdiPercent", "startDate", "durationMonths" }`
- `DELETE /investments/:id`: Delete investment.

### Random Expenses (Variable)
- `GET /random-expenses`: List expenses.
- `POST /random-expenses`: Create expense. Body: `{ "name", "value", "date", "status" }`
- `DELETE /random-expenses/:id`: Delete expense.
- `PATCH /random-expenses/:id/pay`: Mark as paid.

## AI Advisor
- **Endpoint:** `POST /advisor`
- **Headers:** `Authorization`, `X-Group-ID`
- **Description:** Aggregates all group financial data and uses Google Gemini to generate a financial diagnosis and strategy.
- **Caching:** Responses are cached in Redis for 24 hours if the underlying data hasn't changed (hash-based invalidation).