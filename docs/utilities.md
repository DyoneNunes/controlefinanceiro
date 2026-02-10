# Utility Functions

Helper functions located in `src/utils/` to standardize logic across the application.

## `finance.ts`

### `formatCurrency(value: number)`
Formats a number into BRL currency string (e.g., `R$ 1.234,56`).
- Uses `Intl.NumberFormat('pt-BR')`.

### `calculateStatus(bill: Bill)`
Determines if a bill is `paid`, `pending`, or `overdue`.
- **Logic:**
    - If `paidDate` exists -> **Paid**.
    - If `dueDate` < Today (start of day) -> **Overdue**.
    - Otherwise -> **Pending**.
- **Dependencies:** `date-fns` for accurate date comparison.

## `investment.ts`

### `calculateInvestmentReturn(initial, cdiPercent, months)`
Projects the future value of an investment based on a fixed CDI rate.
- **Base Rate:** Currently hardcoded at **13.65% a.a.** (Needs to be made dynamic/configurable).
- **Formula:** Compound interest monthly.
- **Usage:** Used in the Investment Form simulation to show potential returns.

## `security.ts`

### Token Management
Simple wrappers for `localStorage` to handle the JWT.
- `getToken()`: Retrieves `finance_token`.
- `setToken(token)`: Saves the token.
- `removeToken()`: Clears the token (Logout).

## Maintenance Scripts

Scripts located in the project root for build or configuration tasks.

### `update_security.ts`
- **Purpose:** Replaces hardcoded secret placeholders in the source code with `import.meta.env` calls during the build/setup process, ensuring secrets are not committed to version control in the final bundle.

### `update_frontend.js`
- **Purpose:** Updates API URL references in context files (`AuthContext.tsx`, `FinanceContext.tsx`) to use environment variables (`VITE_API_URL`).
- **Docker:** Also generates the production `Dockerfile` for the frontend.
