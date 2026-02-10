# Bills Feature

Manages recurring or scheduled financial obligations.

## Data Model
- **Name:** Description of the bill (e.g., "Internet").
- **Value:** Amount to be paid.
- **Due Date:** When the payment is expected.
- **Status:** `pending` | `paid` | `overdue`.

## Logic
- **Overdue Calculation:** The frontend checks if `due_date < today` AND status is `pending`.
- **Payment:** When a user marks a bill as paid, the backend updates `status` to `paid` and sets `paid_date` to the current timestamp.

## Components
- `BillList`: Displays bills sorted by due date. Visual cues (red text) for overdue items.
- `BillForm`: Simple input form.

## Status Logic & Calculations

The system distinguishes between **Cash Flow** (what actually left your account) and **Competence** (what belongs to the month).

### Statuses
- **Pending:** The bill is unpaid.
- **Paid:** The bill has been paid. It stores a `paid_date`.
- **Overdue:** The bill is unpaid and the `due_date` has passed.

### Dashboard Impact
- **"Paid" Totals:** Based on the **payment date**. If you pay a bill due in January on February 2nd, it counts as an expense in **February's** cash flow.
- **"Pending" Totals:** Based on the **due date**. A bill due in January counts towards January's pending obligations.
- **"Overdue" Totals:** Global accumulation. All overdue bills are summed up as current debt, regardless of how old they are.