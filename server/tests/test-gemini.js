const { isSameMonth, parseISO } = require('date-fns');

// Mock data
const today = new Date(); 
const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);
const thisMonth = new Date(today.getFullYear(), today.getMonth(), 15);

// Mock "Current Date" (View)
const currentDate = thisMonth;
const isCurrentMonth = (dateStr) => isSameMonth(parseISO(dateStr), currentDate);

const bills = [
    {
        id: '1',
        value: 1000,
        dueDate: lastMonth.toISOString(),
        status: 'overdue',
        paidDate: null
    },
    {
        id: '2',
        value: 500,
        dueDate: thisMonth.toISOString(),
        status: 'pending',
        paidDate: null
    },
    {
        id: '3',
        value: 200,
        dueDate: lastMonth.toISOString(),
        status: 'paid',
        paidDate: thisMonth.toISOString() // Paid late, but paid IN THIS MONTH
    }
];

console.log("--- New Dashboard Logic Simulation ---");
console.log("View Month:", currentDate.toISOString());

// 1. Paid Bills (Cash Flow Check)
// Logic: Paid IN this month (using paidDate)
const billsPaid = bills.filter(b => {
    if (b.status !== 'paid') return false;
    const effectiveDate = b.paidDate ? b.paidDate : b.dueDate;
    return isCurrentMonth(effectiveDate);
});
const paidTotal = billsPaid.reduce((sum, b) => sum + Number(b.value), 0);

// 2. Pending (Competence Check)
// Logic: Pending AND Due in this month
const billsPending = bills.filter(b => 
    b.status === 'pending' && isCurrentMonth(b.dueDate)
);
const pendingTotal = billsPending.reduce((sum, b) => sum + Number(b.value), 0);

// 3. Overdue (Global Debt Check)
// Logic: ALL overdue bills
const billsOverdue = bills.filter(b => b.status === 'overdue');
const overdueTotal = billsOverdue.reduce((sum, b) => sum + Number(b.value), 0);

console.log("Paid Total (Expected 200):", paidTotal);
console.log("Pending Total (Expected 500):", pendingTotal);
console.log("Overdue Total (Expected 1000):", overdueTotal);
console.log("Total To Pay Display (Expected 1500):", pendingTotal + overdueTotal);

if (paidTotal === 200 && pendingTotal === 500 && overdueTotal === 1000) {
    console.log("SUCCESS: Logic matches new requirements.");
} else {
    console.log("FAILURE: Logic mismatch.");
}
