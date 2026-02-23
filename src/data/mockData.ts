export const students = [
  { id: "s1", admission_no: "ADM-2024-001", full_name: "Amina Wanjiku", grade: "Grade 8", stream: "East", gender: "Female", status: "active", parent_name: "Mary Wanjiku", parent_phone: "0712345678", balance: -12500, joined: "2024-01-15" },
  { id: "s2", admission_no: "ADM-2024-002", full_name: "Brian Ochieng", grade: "Grade 7", stream: "West", gender: "Male", status: "active", parent_name: "John Ochieng", parent_phone: "0723456789", balance: 0, joined: "2024-01-15" },
  { id: "s3", admission_no: "ADM-2024-003", full_name: "Catherine Muthoni", grade: "Grade 8", stream: "East", gender: "Female", status: "active", parent_name: "Peter Muthoni", parent_phone: "0734567890", balance: -8200, joined: "2024-02-01" },
  { id: "s4", admission_no: "ADM-2024-004", full_name: "David Kipchoge", grade: "Grade 6", stream: "North", gender: "Male", status: "active", parent_name: "James Kipchoge", parent_phone: "0745678901", balance: 3500, joined: "2024-01-15" },
  { id: "s5", admission_no: "ADM-2024-005", full_name: "Esther Akinyi", grade: "Grade 7", stream: "West", gender: "Female", status: "inactive", parent_name: "Rose Akinyi", parent_phone: "0756789012", balance: -25000, joined: "2023-09-01" },
  { id: "s6", admission_no: "ADM-2024-006", full_name: "Francis Mutua", grade: "Grade 8", stream: "East", gender: "Male", status: "active", parent_name: "Agnes Mutua", parent_phone: "0767890123", balance: -4600, joined: "2024-01-15" },
  { id: "s7", admission_no: "ADM-2024-007", full_name: "Grace Njeri", grade: "Grade 6", stream: "North", gender: "Female", status: "active", parent_name: "Daniel Njeri", parent_phone: "0778901234", balance: 0, joined: "2024-03-01" },
  { id: "s8", admission_no: "ADM-2024-008", full_name: "Hassan Mohamed", grade: "Grade 7", stream: "West", gender: "Male", status: "active", parent_name: "Fatuma Mohamed", parent_phone: "0789012345", balance: -15800, joined: "2024-01-15" },
];

export const feeTemplates = [
  { id: "ft1", name: "Tuition Fee", ledger_type: "fees", amount: 25000, term: "Term 1 2024", is_recurring: true },
  { id: "ft2", name: "Exam Fee", ledger_type: "fees", amount: 3500, term: "Term 1 2024", is_recurring: true },
  { id: "ft3", name: "Transport Fee", ledger_type: "transport", amount: 8000, term: "Term 1 2024", is_recurring: true },
  { id: "ft4", name: "Activity Fee", ledger_type: "fees", amount: 2000, term: "Term 1 2024", is_recurring: false },
  { id: "ft5", name: "Lunch Program", ledger_type: "pos", amount: 6000, term: "Term 1 2024", is_recurring: true },
];

export const recentPayments = [
  { id: "p1", student_name: "Amina Wanjiku", amount: 15000, method: "M-Pesa", reference: "SHQ2K4LM9X", date: "2024-03-15 14:23", status: "completed" },
  { id: "p2", student_name: "Brian Ochieng", amount: 25000, method: "Bank", reference: "BNK-78234", date: "2024-03-15 10:05", status: "completed" },
  { id: "p3", student_name: "Hassan Mohamed", amount: 10000, method: "M-Pesa", reference: "SHQ2K4LP3Y", date: "2024-03-14 16:45", status: "completed" },
  { id: "p4", student_name: "Catherine Muthoni", amount: 5000, method: "Cash", reference: "CASH-0342", date: "2024-03-14 09:30", status: "completed" },
  { id: "p5", student_name: "Francis Mutua", amount: 20000, method: "M-Pesa", reference: "SHQ2K4LQ7Z", date: "2024-03-13 11:12", status: "processing" },
  { id: "p6", student_name: "Esther Akinyi", amount: 8000, method: "Cheque", reference: "CHQ-11029", date: "2024-03-12 15:00", status: "completed" },
];

export const ledgerEntries = [
  { id: "l1", date: "2024-01-15", description: "Tuition Fee - Term 1", type: "debit", amount: 25000, balance: -25000 },
  { id: "l2", date: "2024-01-20", description: "Payment - M-Pesa SHQ...", type: "credit", amount: 15000, balance: -10000 },
  { id: "l3", date: "2024-02-01", description: "Exam Fee - Term 1", type: "debit", amount: 3500, balance: -13500 },
  { id: "l4", date: "2024-02-15", description: "Payment - Cash", type: "credit", amount: 5000, balance: -8500 },
  { id: "l5", date: "2024-03-01", description: "Activity Fee", type: "debit", amount: 2000, balance: -10500 },
  { id: "l6", date: "2024-03-15", description: "Payment - M-Pesa SHQ...", type: "credit", amount: 15000, balance: 4500 },
];

export const dashboardStats = {
  totalStudents: 342,
  activeStudents: 328,
  totalCollected: 4250000,
  totalOutstanding: 1820000,
  collectionRate: 70,
  monthlyCollections: [
    { month: "Sep", amount: 1200000 },
    { month: "Oct", amount: 850000 },
    { month: "Nov", amount: 620000 },
    { month: "Dec", amount: 180000 },
    { month: "Jan", amount: 980000 },
    { month: "Feb", amount: 420000 },
  ],
  paymentMethods: [
    { method: "M-Pesa", count: 156, amount: 2340000 },
    { method: "Bank", count: 42, amount: 1200000 },
    { method: "Cash", count: 38, amount: 520000 },
    { method: "Cheque", count: 12, amount: 190000 },
  ],
  recentActivity: [
    { type: "payment", message: "Amina Wanjiku paid KES 15,000 via M-Pesa", time: "2 min ago" },
    { type: "enrollment", message: "New student Grace Njeri enrolled in Grade 6", time: "1 hr ago" },
    { type: "fee", message: "Exam Fee assigned to Grade 8 (45 students)", time: "3 hrs ago" },
    { type: "payment", message: "Brian Ochieng paid KES 25,000 via Bank", time: "5 hrs ago" },
    { type: "alert", message: "12 students with overdue balances > KES 20,000", time: "1 day ago" },
  ],
};
