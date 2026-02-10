# Frontend Components

The frontend is built with **React 19** and **TypeScript**, styled with **Tailwind CSS**.

## Directory Structure
Components are located in `src/components/`.

## Core Components

### `Layout` (`Layout.tsx`)
- **Purpose:** Wraps all authenticated pages.
- **Features:**
    - Responsive sidebar/navigation.
    - Displays current user and selected group.
    - Logout functionality.

### `Dashboard` (`Dashboard.tsx`)
- **Purpose:** Main overview page.
- **Features:**
    - Displays `ChartsSection`.
    - Shows quick summaries of total income vs. expenses.
    - Recent activity feed.
- **Calculation Logic:**
    - **Cash Flow (Balance):** Calculates `Incomes - (Paid Bills + Random Expenses + Investments)`. It considers bills as "paid" only if their payment date (or due date if legacy) falls within the current view month.
    - **Competence (Pending):** Sums bills that are `pending` and have a `dueDate` within the current month.
    - **Debt (Overdue):** Sums ALL bills with status `overdue`, regardless of their original date, representing total current liability.

### `GroupManager` (`GroupManager.tsx`)
- **Purpose:** Interface for switching and managing groups.
- **Features:**
    - Dropdown to switch active group.
    - Form to create new groups.
    - List of members (with ability to invite new ones).

### `AIAdvisor` (`AIAdvisor.tsx`)
- **Purpose:** Visual interface for the AI financial insights.
- **Features:**
    - "Generate Advice" button.
    - Markdown rendering of the AI's response (using `react-markdown`).

## Functional Modules
Each financial entity typically has a **Form** (Create/Edit) and a **List** (View/Delete) component.

- **Bills:** `BillForm.tsx`, `BillList.tsx`.
- **Incomes:** `IncomeForm.tsx`, `IncomeList.tsx`.
- **Investments:** `InvestmentForm.tsx`, `InvestmentList.tsx`.
- **Random Expenses:** `RandomExpenseForm.tsx`, `RandomExpenseList.tsx`.

## Visualization
### `ChartsSection` (`ChartsSection.tsx`)
- **Library:** `recharts`.
- **Charts:**
    - Monthly Expenses Breakdown (Pie Chart).
    - Income vs. Expenses (Bar Chart).