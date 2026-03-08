// ===== STUDENTS =====
export const students = [
  { id: "s1", admission_no: "ADM-2024-001", full_name: "Amina Wanjiku", grade: "Grade 8", stream: "East", gender: "Female", status: "active", parent_name: "Mary Wanjiku", parent_phone: "0712345678", balance: -12500, joined: "2024-01-15", dob: "2010-03-15", religion: "Christian", blood_group: "O+", category: "general", rte: false, nationality: "Kenyan", birth_cert_no: "BC-12345678", nemis_no: "NEMIS-001", mother_tongue: "Kikuyu", previous_school: "Sunrise Academy", previous_class: "Grade 7", tc_no: "TC-001", siblings: ["s9"] },
  { id: "s2", admission_no: "ADM-2024-002", full_name: "Brian Ochieng", grade: "Grade 7", stream: "West", gender: "Male", status: "active", parent_name: "John Ochieng", parent_phone: "0723456789", balance: 0, joined: "2024-01-15", dob: "2011-07-22", religion: "Christian", blood_group: "A+", category: "general", rte: false, nationality: "Kenyan", birth_cert_no: "BC-23456789", nemis_no: "NEMIS-002", mother_tongue: "Luo", previous_school: "", previous_class: "", tc_no: "", siblings: [] },
  { id: "s3", admission_no: "ADM-2024-003", full_name: "Catherine Muthoni", grade: "Grade 8", stream: "East", gender: "Female", status: "active", parent_name: "Peter Muthoni", parent_phone: "0734567890", balance: -8200, joined: "2024-02-01", dob: "2010-11-05", religion: "Christian", blood_group: "B+", category: "general", rte: false, nationality: "Kenyan", birth_cert_no: "BC-34567890", nemis_no: "NEMIS-003", mother_tongue: "Kikuyu", previous_school: "Green Hills Primary", previous_class: "Grade 7", tc_no: "TC-003", siblings: [] },
  { id: "s4", admission_no: "ADM-2024-004", full_name: "David Kipchoge", grade: "Grade 6", stream: "North", gender: "Male", status: "active", parent_name: "James Kipchoge", parent_phone: "0745678901", balance: 3500, joined: "2024-01-15", dob: "2012-05-18", religion: "Christian", blood_group: "AB+", category: "sports", rte: false, nationality: "Kenyan", birth_cert_no: "BC-45678901", nemis_no: "NEMIS-004", mother_tongue: "Kalenjin", previous_school: "", previous_class: "", tc_no: "", siblings: [] },
  { id: "s5", admission_no: "ADM-2024-005", full_name: "Esther Akinyi", grade: "Grade 7", stream: "West", gender: "Female", status: "inactive", parent_name: "Rose Akinyi", parent_phone: "0756789012", balance: -25000, joined: "2023-09-01", dob: "2011-01-30", religion: "Christian", blood_group: "O-", category: "general", rte: true, nationality: "Kenyan", birth_cert_no: "BC-56789012", nemis_no: "NEMIS-005", mother_tongue: "Luo", previous_school: "Lake View School", previous_class: "Grade 6", tc_no: "TC-005", siblings: [] },
  { id: "s6", admission_no: "ADM-2024-006", full_name: "Francis Mutua", grade: "Grade 8", stream: "East", gender: "Male", status: "active", parent_name: "Agnes Mutua", parent_phone: "0767890123", balance: -4600, joined: "2024-01-15", dob: "2010-08-12", religion: "Christian", blood_group: "A-", category: "general", rte: false, nationality: "Kenyan", birth_cert_no: "BC-67890123", nemis_no: "NEMIS-006", mother_tongue: "Kamba", previous_school: "", previous_class: "", tc_no: "", siblings: [] },
  { id: "s7", admission_no: "ADM-2024-007", full_name: "Grace Njeri", grade: "Grade 6", stream: "North", gender: "Female", status: "active", parent_name: "Daniel Njeri", parent_phone: "0778901234", balance: 0, joined: "2024-03-01", dob: "2012-12-25", religion: "Christian", blood_group: "B-", category: "scholarship", rte: false, nationality: "Kenyan", birth_cert_no: "BC-78901234", nemis_no: "NEMIS-007", mother_tongue: "Kikuyu", previous_school: "", previous_class: "", tc_no: "", siblings: [] },
  { id: "s8", admission_no: "ADM-2024-008", full_name: "Hassan Mohamed", grade: "Grade 7", stream: "West", gender: "Male", status: "active", parent_name: "Fatuma Mohamed", parent_phone: "0789012345", balance: -15800, joined: "2024-01-15", dob: "2011-04-10", religion: "Muslim", blood_group: "O+", category: "general", rte: false, nationality: "Kenyan", birth_cert_no: "BC-89012345", nemis_no: "NEMIS-008", mother_tongue: "Swahili", previous_school: "", previous_class: "", tc_no: "", siblings: [] },
  { id: "s9", admission_no: "ADM-2024-009", full_name: "Joy Wanjiku", grade: "Grade 6", stream: "East", gender: "Female", status: "active", parent_name: "Mary Wanjiku", parent_phone: "0712345678", balance: -3200, joined: "2024-01-15", dob: "2012-09-14", religion: "Christian", blood_group: "O+", category: "general", rte: false, nationality: "Kenyan", birth_cert_no: "BC-91234567", nemis_no: "NEMIS-009", mother_tongue: "Kikuyu", previous_school: "", previous_class: "", tc_no: "", siblings: ["s1"] },
  { id: "s10", admission_no: "ADM-2024-010", full_name: "Kevin Otieno", grade: "Grade 8", stream: "West", gender: "Male", status: "active", parent_name: "Sarah Otieno", parent_phone: "0790123456", balance: -6700, joined: "2024-01-15", dob: "2010-06-08", religion: "Christian", blood_group: "A+", category: "general", rte: false, nationality: "Kenyan", birth_cert_no: "BC-01234567", nemis_no: "NEMIS-010", mother_tongue: "Luo", previous_school: "Riverside Academy", previous_class: "Grade 7", tc_no: "TC-010", siblings: [] },
];

export const studentCategories = [
  { id: "cat1", name: "General", description: "Regular students", count: 280 },
  { id: "cat2", name: "Scholarship", description: "Students on scholarship", count: 15 },
  { id: "cat3", name: "Sports", description: "Sports quota students", count: 12 },
  { id: "cat4", name: "Staff Child", description: "Children of staff members", count: 8 },
  { id: "cat5", name: "RTE", description: "Right to Education quota", count: 18 },
  { id: "cat6", name: "Sibling", description: "Students with siblings in school", count: 25 },
];

// ===== FEE SYSTEM =====
export const feeTypes = [
  { id: "ftype1", name: "Tuition Fee", code: "TF", description: "Academic tuition charges" },
  { id: "ftype2", name: "Exam Fee", code: "EF", description: "Examination charges" },
  { id: "ftype3", name: "Transport Fee", code: "TRF", description: "School transport charges" },
  { id: "ftype4", name: "Activity Fee", code: "AF", description: "Co-curricular activities" },
  { id: "ftype5", name: "Lunch Program", code: "LP", description: "School feeding program" },
  { id: "ftype6", name: "Lab Fee", code: "LF", description: "Laboratory usage charges" },
  { id: "ftype7", name: "Library Fee", code: "LBF", description: "Library membership" },
  { id: "ftype8", name: "Boarding Fee", code: "BF", description: "Boarding facility charges" },
];

export const feeGroups = [
  { id: "fg1", name: "Class 6 Fees", description: "All Grade 6 standard fees", fee_types: ["ftype1", "ftype2", "ftype4", "ftype7"], total: 30500 },
  { id: "fg2", name: "Class 7 Fees", description: "All Grade 7 standard fees", fee_types: ["ftype1", "ftype2", "ftype4", "ftype6", "ftype7"], total: 33000 },
  { id: "fg3", name: "Class 8 Fees", description: "All Grade 8 standard fees", fee_types: ["ftype1", "ftype2", "ftype4", "ftype6", "ftype7"], total: 35500 },
  { id: "fg4", name: "Transport Package", description: "Transport add-on fees", fee_types: ["ftype3"], total: 8000 },
  { id: "fg5", name: "Boarding Package", description: "Full boarding fees", fee_types: ["ftype5", "ftype8"], total: 45000 },
];

export const feeTemplates = [
  { id: "ft1", name: "Tuition Fee", ledger_type: "fees", amount: 25000, term: "Term 1 2024", is_recurring: true, due_date: "2024-01-31", fine_type: "percentage", fine_amount: 5, fine_frequency: "monthly" },
  { id: "ft2", name: "Exam Fee", ledger_type: "fees", amount: 3500, term: "Term 1 2024", is_recurring: true, due_date: "2024-02-15", fine_type: "fixed", fine_amount: 500, fine_frequency: "one_time" },
  { id: "ft3", name: "Transport Fee", ledger_type: "transport", amount: 8000, term: "Term 1 2024", is_recurring: true, due_date: "2024-01-31", fine_type: "none", fine_amount: 0, fine_frequency: "none" },
  { id: "ft4", name: "Activity Fee", ledger_type: "fees", amount: 2000, term: "Term 1 2024", is_recurring: false, due_date: "2024-03-01", fine_type: "none", fine_amount: 0, fine_frequency: "none" },
  { id: "ft5", name: "Lunch Program", ledger_type: "pos", amount: 6000, term: "Term 1 2024", is_recurring: true, due_date: "2024-01-31", fine_type: "fixed", fine_amount: 200, fine_frequency: "monthly" },
  { id: "ft6", name: "Lab Fee", ledger_type: "fees", amount: 2500, term: "Term 1 2024", is_recurring: true, due_date: "2024-02-15", fine_type: "none", fine_amount: 0, fine_frequency: "none" },
];

export const feeDiscounts = [
  { id: "fd1", name: "Staff Child Discount", code: "SCD", type: "percentage", value: 50, description: "50% off for staff children", applicable_to: "Staff Child", students_count: 8 },
  { id: "fd2", name: "Sibling Discount", code: "SBD", type: "percentage", value: 15, description: "15% off for 2nd child onwards", applicable_to: "Sibling", students_count: 25 },
  { id: "fd3", name: "Early Admission Discount", code: "EAD", type: "fixed", value: 3000, description: "KES 3,000 off for early registrations", applicable_to: "Early Admission", students_count: 42 },
  { id: "fd4", name: "Scholarship Full", code: "SCH", type: "percentage", value: 100, description: "Full scholarship coverage", applicable_to: "Scholarship", students_count: 5 },
  { id: "fd5", name: "Scholarship Partial", code: "SCP", type: "percentage", value: 75, description: "75% scholarship coverage", applicable_to: "Scholarship", students_count: 10 },
  { id: "fd6", name: "RTE Exemption", code: "RTE", type: "percentage", value: 100, description: "Full fee exemption under RTE", applicable_to: "RTE", students_count: 18 },
];

export const feeAllotments = [
  { id: "fa1", fee_group: "Class 8 Fees", class: "Grade 8", section: "East", students: 45, total_amount: 1597500, collected: 1120000, status: "active" },
  { id: "fa2", fee_group: "Class 7 Fees", class: "Grade 7", section: "West", students: 42, total_amount: 1386000, collected: 970200, status: "active" },
  { id: "fa3", fee_group: "Class 6 Fees", class: "Grade 6", section: "North", students: 38, total_amount: 1159000, collected: 811300, status: "active" },
  { id: "fa4", fee_group: "Transport Package", class: "Grade 8", section: "All", students: 28, total_amount: 224000, collected: 200000, status: "active" },
  { id: "fa5", fee_group: "Boarding Package", class: "Grade 8", section: "East", students: 12, total_amount: 540000, collected: 432000, status: "active" },
];

export const studentFeeCollection = [
  { id: "sfc1", student_id: "s1", student_name: "Amina Wanjiku", admission_no: "ADM-2024-001", class: "Grade 8 East", total_fee: 35500, discount: 0, fine: 1775, paid: 24775, balance: 12500, status: "partial" },
  { id: "sfc2", student_id: "s2", student_name: "Brian Ochieng", admission_no: "ADM-2024-002", class: "Grade 7 West", total_fee: 33000, discount: 0, fine: 0, paid: 33000, balance: 0, status: "paid" },
  { id: "sfc3", student_id: "s3", student_name: "Catherine Muthoni", admission_no: "ADM-2024-003", class: "Grade 8 East", total_fee: 35500, discount: 0, fine: 900, paid: 28200, balance: 8200, status: "partial" },
  { id: "sfc4", student_id: "s4", student_name: "David Kipchoge", admission_no: "ADM-2024-004", class: "Grade 6 North", total_fee: 30500, discount: 0, fine: 0, paid: 34000, balance: -3500, status: "advance" },
  { id: "sfc5", student_id: "s5", student_name: "Esther Akinyi", admission_no: "ADM-2024-005", class: "Grade 7 West", total_fee: 33000, discount: 0, fine: 2500, paid: 10500, balance: 25000, status: "overdue" },
  { id: "sfc6", student_id: "s8", student_name: "Hassan Mohamed", admission_no: "ADM-2024-008", class: "Grade 7 West", total_fee: 33000, discount: 4950, fine: 1200, paid: 13450, balance: 15800, status: "partial" },
];

export const carryForwards = [
  { id: "cf1", student_name: "Amina Wanjiku", from_term: "Term 3 2023", to_term: "Term 1 2024", type: "arrears", amount: 5000, status: "applied" },
  { id: "cf2", student_name: "David Kipchoge", from_term: "Term 3 2023", to_term: "Term 1 2024", type: "advance_credit", amount: 3500, status: "applied" },
  { id: "cf3", student_name: "Esther Akinyi", from_term: "Term 3 2023", to_term: "Term 1 2024", type: "arrears", amount: 12000, status: "applied" },
];

// ===== PAYMENTS =====
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

// ===== PARENTS =====
export const parents = [
  { id: "pr1", full_name: "Mary Wanjiku", phone: "0712345678", email: "mary@email.com", id_number: "12345678", children: ["Amina Wanjiku", "Joy Wanjiku"], children_count: 2, status: "active", occupation: "Teacher", address: "Nairobi, Westlands" },
  { id: "pr2", full_name: "John Ochieng", phone: "0723456789", email: "john@email.com", id_number: "23456789", children: ["Brian Ochieng"], children_count: 1, status: "active", occupation: "Engineer", address: "Nairobi, Kilimani" },
  { id: "pr3", full_name: "Peter Muthoni", phone: "0734567890", email: "peter@email.com", id_number: "34567890", children: ["Catherine Muthoni"], children_count: 1, status: "active", occupation: "Accountant", address: "Nairobi, Karen" },
  { id: "pr4", full_name: "James Kipchoge", phone: "0745678901", email: "james@email.com", id_number: "45678901", children: ["David Kipchoge"], children_count: 1, status: "active", occupation: "Farmer", address: "Eldoret, Uasin Gishu" },
  { id: "pr5", full_name: "Rose Akinyi", phone: "0756789012", email: "rose@email.com", id_number: "56789012", children: ["Esther Akinyi"], children_count: 1, status: "inactive", occupation: "Nurse", address: "Kisumu, Milimani" },
  { id: "pr6", full_name: "Agnes Mutua", phone: "0767890123", email: "agnes@email.com", id_number: "67890123", children: ["Francis Mutua"], children_count: 1, status: "active", occupation: "Business", address: "Machakos Town" },
  { id: "pr7", full_name: "Daniel Njeri", phone: "0778901234", email: "daniel@email.com", id_number: "78901234", children: ["Grace Njeri"], children_count: 1, status: "active", occupation: "Doctor", address: "Nairobi, Lavington" },
  { id: "pr8", full_name: "Fatuma Mohamed", phone: "0789012345", email: "fatuma@email.com", id_number: "89012345", children: ["Hassan Mohamed"], children_count: 1, status: "active", occupation: "Lecturer", address: "Mombasa, Nyali" },
];

// ===== ATTENDANCE =====
export const attendanceRecords = [
  { id: "a1", student_name: "Amina Wanjiku", admission_no: "ADM-2024-001", grade: "Grade 8", date: "2024-03-15", status: "present" as const },
  { id: "a2", student_name: "Brian Ochieng", admission_no: "ADM-2024-002", grade: "Grade 7", date: "2024-03-15", status: "present" as const },
  { id: "a3", student_name: "Catherine Muthoni", admission_no: "ADM-2024-003", grade: "Grade 8", date: "2024-03-15", status: "absent" as const },
  { id: "a4", student_name: "David Kipchoge", admission_no: "ADM-2024-004", grade: "Grade 6", date: "2024-03-15", status: "present" as const },
  { id: "a5", student_name: "Esther Akinyi", admission_no: "ADM-2024-005", grade: "Grade 7", date: "2024-03-15", status: "late" as const },
  { id: "a6", student_name: "Francis Mutua", admission_no: "ADM-2024-006", grade: "Grade 8", date: "2024-03-15", status: "present" as const },
  { id: "a7", student_name: "Grace Njeri", admission_no: "ADM-2024-007", grade: "Grade 6", date: "2024-03-15", status: "present" as const },
  { id: "a8", student_name: "Hassan Mohamed", admission_no: "ADM-2024-008", grade: "Grade 7", date: "2024-03-15", status: "absent" as const },
];

// ===== INVENTORY =====
export const inventoryItems = [
  { id: "inv1", name: "Student Desks", category: "Furniture", quantity: 120, min_stock: 100, unit_cost: 4500, location: "Main Store", status: "in_stock" as const, last_restocked: "2024-02-10" },
  { id: "inv2", name: "Exercise Books (48pg)", category: "Stationery", quantity: 2400, min_stock: 500, unit_cost: 45, location: "Stationery Store", status: "in_stock" as const, last_restocked: "2024-03-01" },
  { id: "inv3", name: "Chalk Boxes", category: "Stationery", quantity: 35, min_stock: 50, unit_cost: 250, location: "Staff Room", status: "low_stock" as const, last_restocked: "2024-01-20" },
  { id: "inv4", name: "Science Lab Kits", category: "Lab Equipment", quantity: 15, min_stock: 10, unit_cost: 12000, location: "Science Lab", status: "in_stock" as const, last_restocked: "2024-01-15" },
  { id: "inv5", name: "Footballs", category: "Sports", quantity: 8, min_stock: 10, unit_cost: 1500, location: "Sports Store", status: "low_stock" as const, last_restocked: "2023-11-05" },
  { id: "inv6", name: "Textbooks - Mathematics", category: "Books", quantity: 0, min_stock: 50, unit_cost: 850, location: "Library", status: "out_of_stock" as const, last_restocked: "2023-09-01" },
  { id: "inv7", name: "Cleaning Supplies", category: "Maintenance", quantity: 60, min_stock: 20, unit_cost: 350, location: "Main Store", status: "in_stock" as const, last_restocked: "2024-03-10" },
  { id: "inv8", name: "First Aid Kits", category: "Health", quantity: 5, min_stock: 5, unit_cost: 3500, location: "Sick Bay", status: "low_stock" as const, last_restocked: "2024-02-01" },
];

// ===== CLASSES & SECTIONS =====
export const classes = [
  { id: "c1", name: "Grade 1", alias: "Class 1", sections: ["A", "B"], students: 78, curriculum: "CBC" },
  { id: "c2", name: "Grade 2", alias: "Class 2", sections: ["A", "B"], students: 74, curriculum: "CBC" },
  { id: "c3", name: "Grade 3", alias: "Class 3", sections: ["A", "B"], students: 80, curriculum: "CBC" },
  { id: "c4", name: "Grade 4", alias: "Class 4", sections: ["A", "B", "C"], students: 92, curriculum: "CBC" },
  { id: "c5", name: "Grade 5", alias: "Class 5", sections: ["A", "B", "C"], students: 88, curriculum: "CBC" },
  { id: "c6", name: "Grade 6", alias: "Class 6", sections: ["North", "South"], students: 76, curriculum: "CBC" },
  { id: "c7", name: "Grade 7", alias: "Class 7", sections: ["East", "West"], students: 84, curriculum: "8-4-4" },
  { id: "c8", name: "Grade 8", alias: "Class 8", sections: ["East", "West"], students: 90, curriculum: "8-4-4" },
];

export const subjects = [
  { id: "sub1", name: "Mathematics", code: "MATH", type: "theory" as const, classes: ["Grade 6", "Grade 7", "Grade 8"] },
  { id: "sub2", name: "English", code: "ENG", type: "theory" as const, classes: ["Grade 6", "Grade 7", "Grade 8"] },
  { id: "sub3", name: "Kiswahili", code: "KIS", type: "theory" as const, classes: ["Grade 6", "Grade 7", "Grade 8"] },
  { id: "sub4", name: "Science", code: "SCI", type: "theory" as const, classes: ["Grade 6", "Grade 7", "Grade 8"] },
  { id: "sub5", name: "Social Studies", code: "SST", type: "theory" as const, classes: ["Grade 6", "Grade 7", "Grade 8"] },
  { id: "sub6", name: "CRE", code: "CRE", type: "theory" as const, classes: ["Grade 6", "Grade 7", "Grade 8"] },
  { id: "sub7", name: "Agriculture", code: "AGR", type: "practical" as const, classes: ["Grade 7", "Grade 8"] },
  { id: "sub8", name: "Home Science", code: "HSC", type: "practical" as const, classes: ["Grade 7", "Grade 8"] },
  { id: "sub9", name: "Art & Craft", code: "ART", type: "practical" as const, classes: ["Grade 6"] },
  { id: "sub10", name: "Physical Education", code: "PE", type: "practical" as const, classes: ["Grade 6", "Grade 7", "Grade 8"] },
  { id: "sub11", name: "Computer Studies", code: "CS", type: "theory" as const, classes: ["Grade 7", "Grade 8"] },
  { id: "sub12", name: "Music", code: "MUS", type: "practical" as const, classes: ["Grade 6"] },
];

export const subjectAssignments = [
  { id: "sa1", subject: "Mathematics", teacher: "Mr. Kamau", class: "Grade 8", section: "East" },
  { id: "sa2", subject: "English", teacher: "Mrs. Otieno", class: "Grade 8", section: "East" },
  { id: "sa3", subject: "Kiswahili", teacher: "Mr. Hassan", class: "Grade 8", section: "East" },
  { id: "sa4", subject: "Science", teacher: "Dr. Mwangi", class: "Grade 8", section: "East" },
  { id: "sa5", subject: "Mathematics", teacher: "Mr. Kamau", class: "Grade 7", section: "West" },
  { id: "sa6", subject: "English", teacher: "Mrs. Otieno", class: "Grade 7", section: "West" },
  { id: "sa7", subject: "Science", teacher: "Dr. Mwangi", class: "Grade 7", section: "West" },
  { id: "sa8", subject: "Social Studies", teacher: "Ms. Wambui", class: "Grade 8", section: "East" },
  { id: "sa9", subject: "CRE", teacher: "Rev. Omondi", class: "Grade 8", section: "East" },
  { id: "sa10", subject: "Mathematics", teacher: "Mrs. Njuguna", class: "Grade 6", section: "North" },
];

export const timetableEntries = [
  { id: "tt1", day: "Monday", period: 1, start: "08:00", end: "08:40", subject: "Mathematics", teacher: "Mr. Kamau", class: "Grade 8", section: "East", room: "Room 1" },
  { id: "tt2", day: "Monday", period: 2, start: "08:40", end: "09:20", subject: "English", teacher: "Mrs. Otieno", class: "Grade 8", section: "East", room: "Room 1" },
  { id: "tt3", day: "Monday", period: 3, start: "09:20", end: "10:00", subject: "Kiswahili", teacher: "Mr. Hassan", class: "Grade 8", section: "East", room: "Room 1" },
  { id: "tt4", day: "Monday", period: 4, start: "10:20", end: "11:00", subject: "Science", teacher: "Dr. Mwangi", class: "Grade 8", section: "East", room: "Lab 1" },
  { id: "tt5", day: "Monday", period: 5, start: "11:00", end: "11:40", subject: "Social Studies", teacher: "Ms. Wambui", class: "Grade 8", section: "East", room: "Room 1" },
  { id: "tt6", day: "Monday", period: 6, start: "11:40", end: "12:20", subject: "CRE", teacher: "Rev. Omondi", class: "Grade 8", section: "East", room: "Room 1" },
  { id: "tt7", day: "Monday", period: 7, start: "13:00", end: "13:40", subject: "Agriculture", teacher: "Mr. Wafula", class: "Grade 8", section: "East", room: "Farm" },
  { id: "tt8", day: "Monday", period: 8, start: "13:40", end: "14:20", subject: "PE", teacher: "Coach Kiprop", class: "Grade 8", section: "East", room: "Field" },
  { id: "tt9", day: "Tuesday", period: 1, start: "08:00", end: "08:40", subject: "English", teacher: "Mrs. Otieno", class: "Grade 8", section: "East", room: "Room 1" },
  { id: "tt10", day: "Tuesday", period: 2, start: "08:40", end: "09:20", subject: "Mathematics", teacher: "Mr. Kamau", class: "Grade 8", section: "East", room: "Room 1" },
  { id: "tt11", day: "Tuesday", period: 3, start: "09:20", end: "10:00", subject: "Science", teacher: "Dr. Mwangi", class: "Grade 8", section: "East", room: "Lab 1" },
  { id: "tt12", day: "Tuesday", period: 4, start: "10:20", end: "11:00", subject: "Home Science", teacher: "Mrs. Achieng", class: "Grade 8", section: "East", room: "Room 3" },
  { id: "tt13", day: "Tuesday", period: 5, start: "11:00", end: "11:40", subject: "Kiswahili", teacher: "Mr. Hassan", class: "Grade 8", section: "East", room: "Room 1" },
  { id: "tt14", day: "Tuesday", period: 6, start: "11:40", end: "12:20", subject: "Computer Studies", teacher: "Mr. Njoroge", class: "Grade 8", section: "East", room: "ICT Lab" },
  { id: "tt15", day: "Wednesday", period: 1, start: "08:00", end: "08:40", subject: "Kiswahili", teacher: "Mr. Hassan", class: "Grade 8", section: "East", room: "Room 1" },
  { id: "tt16", day: "Wednesday", period: 2, start: "08:40", end: "09:20", subject: "Science", teacher: "Dr. Mwangi", class: "Grade 8", section: "East", room: "Lab 1" },
  { id: "tt17", day: "Wednesday", period: 3, start: "09:20", end: "10:00", subject: "Mathematics", teacher: "Mr. Kamau", class: "Grade 8", section: "East", room: "Room 1" },
  { id: "tt18", day: "Thursday", period: 1, start: "08:00", end: "08:40", subject: "Science", teacher: "Dr. Mwangi", class: "Grade 8", section: "East", room: "Lab 1" },
  { id: "tt19", day: "Thursday", period: 2, start: "08:40", end: "09:20", subject: "English", teacher: "Mrs. Otieno", class: "Grade 8", section: "East", room: "Room 1" },
  { id: "tt20", day: "Friday", period: 1, start: "08:00", end: "08:40", subject: "Mathematics", teacher: "Mr. Kamau", class: "Grade 8", section: "East", room: "Room 1" },
  { id: "tt21", day: "Friday", period: 2, start: "08:40", end: "09:20", subject: "Social Studies", teacher: "Ms. Wambui", class: "Grade 8", section: "East", room: "Room 1" },
];

// ===== EXAMINATIONS =====
export const exams = [
  { id: "ex1", name: "Mid-Term 1 Examination", type: "mid_term", term: "Term 1 2024", start_date: "2024-02-19", end_date: "2024-02-23", status: "completed", classes: ["Grade 6", "Grade 7", "Grade 8"] },
  { id: "ex2", name: "End Term 1 Examination", type: "end_term", term: "Term 1 2024", start_date: "2024-04-01", end_date: "2024-04-05", status: "upcoming", classes: ["Grade 6", "Grade 7", "Grade 8"] },
  { id: "ex3", name: "CAT 1", type: "cat", term: "Term 1 2024", start_date: "2024-01-29", end_date: "2024-01-29", status: "completed", classes: ["Grade 8"] },
  { id: "ex4", name: "KCPE Mock", type: "mock", term: "Term 1 2024", start_date: "2024-03-11", end_date: "2024-03-15", status: "completed", classes: ["Grade 8"] },
];

export const examSchedules = [
  { id: "es1", exam: "Mid-Term 1 Examination", subject: "Mathematics", date: "2024-02-19", start_time: "08:00", end_time: "10:00", room: "Exam Hall 1", full_marks: 100, pass_marks: 40, class: "Grade 8" },
  { id: "es2", exam: "Mid-Term 1 Examination", subject: "English", date: "2024-02-19", start_time: "11:00", end_time: "13:00", room: "Exam Hall 1", full_marks: 100, pass_marks: 40, class: "Grade 8" },
  { id: "es3", exam: "Mid-Term 1 Examination", subject: "Kiswahili", date: "2024-02-20", start_time: "08:00", end_time: "10:00", room: "Exam Hall 1", full_marks: 100, pass_marks: 40, class: "Grade 8" },
  { id: "es4", exam: "Mid-Term 1 Examination", subject: "Science", date: "2024-02-20", start_time: "11:00", end_time: "13:00", room: "Lab 1", full_marks: 100, pass_marks: 40, class: "Grade 8" },
  { id: "es5", exam: "Mid-Term 1 Examination", subject: "Social Studies", date: "2024-02-21", start_time: "08:00", end_time: "10:00", room: "Exam Hall 1", full_marks: 100, pass_marks: 40, class: "Grade 8" },
  { id: "es6", exam: "Mid-Term 1 Examination", subject: "CRE", date: "2024-02-21", start_time: "11:00", end_time: "12:30", room: "Exam Hall 1", full_marks: 100, pass_marks: 40, class: "Grade 8" },
];

export const marksRegister = [
  { id: "mr1", student: "Amina Wanjiku", admission_no: "ADM-2024-001", exam: "Mid-Term 1", math: 78, english: 82, kiswahili: 71, science: 85, social_studies: 68, cre: 75, total: 459, percentage: 76.5, grade: "A-", rank: 3, attendance: "present" },
  { id: "mr2", student: "Catherine Muthoni", admission_no: "ADM-2024-003", exam: "Mid-Term 1", math: 92, english: 88, kiswahili: 85, science: 90, social_studies: 82, cre: 88, total: 525, percentage: 87.5, grade: "A", rank: 1, attendance: "present" },
  { id: "mr3", student: "Francis Mutua", admission_no: "ADM-2024-006", exam: "Mid-Term 1", math: 65, english: 72, kiswahili: 68, science: 70, social_studies: 58, cre: 62, total: 395, percentage: 65.8, grade: "B", rank: 5, attendance: "present" },
  { id: "mr4", student: "Kevin Otieno", admission_no: "ADM-2024-010", exam: "Mid-Term 1", math: 85, english: 79, kiswahili: 82, science: 88, social_studies: 75, cre: 80, total: 489, percentage: 81.5, grade: "A-", rank: 2, attendance: "present" },
  { id: "mr5", student: "Joy Wanjiku", admission_no: "ADM-2024-009", exam: "Mid-Term 1", math: 55, english: 62, kiswahili: 58, science: 48, social_studies: 52, cre: 65, total: 340, percentage: 56.7, grade: "C+", rank: 8, attendance: "present" },
];

export const gradingSystem = [
  { grade: "A", min: 80, max: 100, points: 12, remark: "Excellent" },
  { grade: "A-", min: 75, max: 79, points: 11, remark: "Very Good" },
  { grade: "B+", min: 70, max: 74, points: 10, remark: "Good" },
  { grade: "B", min: 65, max: 69, points: 9, remark: "Fairly Good" },
  { grade: "B-", min: 60, max: 64, points: 8, remark: "Average" },
  { grade: "C+", min: 55, max: 59, points: 7, remark: "Below Average" },
  { grade: "C", min: 50, max: 54, points: 6, remark: "Fair" },
  { grade: "C-", min: 45, max: 49, points: 5, remark: "Below Fair" },
  { grade: "D+", min: 40, max: 44, points: 4, remark: "Weak" },
  { grade: "D", min: 35, max: 39, points: 3, remark: "Poor" },
  { grade: "D-", min: 30, max: 34, points: 2, remark: "Very Poor" },
  { grade: "E", min: 0, max: 29, points: 1, remark: "Fail" },
];

// ===== EXPENSES =====
export const expenses = [
  { id: "exp1", title: "Electricity Bill - March", category: "Utilities", amount: 28500, date: "2024-03-10", payment_method: "Bank", reference: "BNK-ELC-003", status: "paid", approved_by: "Jane Kamau" },
  { id: "exp2", title: "Water Bill - March", category: "Utilities", amount: 12000, date: "2024-03-05", payment_method: "Bank", reference: "BNK-WTR-003", status: "paid", approved_by: "Jane Kamau" },
  { id: "exp3", title: "Stationery Purchase", category: "Office Supplies", amount: 15600, date: "2024-03-12", payment_method: "M-Pesa", reference: "MPE-OFF-012", status: "paid", approved_by: "John Mutiso" },
  { id: "exp4", title: "School Bus Maintenance", category: "Transport", amount: 45000, date: "2024-03-08", payment_method: "Cheque", reference: "CHQ-TRP-008", status: "paid", approved_by: "Jane Kamau" },
  { id: "exp5", title: "Internet Service - March", category: "Utilities", amount: 8500, date: "2024-03-01", payment_method: "Bank", reference: "BNK-INT-003", status: "paid", approved_by: "Jane Kamau" },
  { id: "exp6", title: "Science Lab Equipment", category: "Lab Supplies", amount: 65000, date: "2024-03-14", payment_method: "Bank", reference: "BNK-LAB-001", status: "pending", approved_by: "" },
  { id: "exp7", title: "Staff Lunch - March", category: "Miscellaneous", amount: 22000, date: "2024-03-15", payment_method: "Cash", reference: "CSH-MSC-003", status: "paid", approved_by: "Jane Kamau" },
  { id: "exp8", title: "Building Repair", category: "Maintenance", amount: 85000, date: "2024-03-11", payment_method: "Cheque", reference: "CHQ-MNT-011", status: "approved", approved_by: "Jane Kamau" },
  { id: "exp9", title: "Telephone Bill - March", category: "Utilities", amount: 5200, date: "2024-03-10", payment_method: "M-Pesa", reference: "MPE-UTL-010", status: "paid", approved_by: "Jane Kamau" },
];

export const expenseCategories = [
  { id: "ec1", name: "Utilities", budget: 150000, spent: 54200 },
  { id: "ec2", name: "Office Supplies", budget: 50000, spent: 15600 },
  { id: "ec3", name: "Transport", budget: 100000, spent: 45000 },
  { id: "ec4", name: "Lab Supplies", budget: 80000, spent: 65000 },
  { id: "ec5", name: "Maintenance", budget: 200000, spent: 85000 },
  { id: "ec6", name: "Miscellaneous", budget: 60000, spent: 22000 },
];

// ===== COMMUNICATION =====
export const notices = [
  { id: "n1", title: "School Reopening - Term 2", message: "School reopens on May 6th, 2024. All students must report by 8:00 AM.", audience: "All", date: "2024-04-20", author: "Jane Kamau", priority: "high" },
  { id: "n2", title: "Sports Day Announcement", message: "Annual sports day will be held on March 22nd. Students should come in sports attire.", audience: "Students", date: "2024-03-15", author: "Coach Kiprop", priority: "medium" },
  { id: "n3", title: "Parent-Teacher Meeting", message: "PTM scheduled for March 28th at 2:00 PM. All parents are requested to attend.", audience: "Parents", date: "2024-03-14", author: "Jane Kamau", priority: "high" },
  { id: "n4", title: "Exam Timetable Released", message: "End term 1 examination timetable has been released. Please check the download center.", audience: "All", date: "2024-03-10", author: "Mr. Kamau", priority: "medium" },
  { id: "n5", title: "Staff Meeting", message: "Emergency staff meeting at 4:00 PM today in the conference room.", audience: "Teachers", date: "2024-03-15", author: "Jane Kamau", priority: "high" },
];

export const downloads = [
  { id: "dl1", title: "Term 1 Exam Timetable", category: "Exam", file_type: "PDF", size: "245 KB", uploaded_by: "Mr. Kamau", date: "2024-03-10", audience: "All" },
  { id: "dl2", title: "Mathematics Syllabus - Grade 8", category: "Syllabus", file_type: "PDF", size: "1.2 MB", uploaded_by: "Mr. Kamau", date: "2024-01-10", audience: "Grade 8" },
  { id: "dl3", title: "Science Assignment - Week 10", category: "Assignment", file_type: "DOCX", size: "380 KB", uploaded_by: "Dr. Mwangi", date: "2024-03-11", audience: "Grade 8" },
  { id: "dl4", title: "School Calendar 2024", category: "General", file_type: "PDF", size: "520 KB", uploaded_by: "Jane Kamau", date: "2024-01-05", audience: "All" },
  { id: "dl5", title: "English Study Material - Poetry", category: "Study Material", file_type: "PDF", size: "890 KB", uploaded_by: "Mrs. Otieno", date: "2024-03-08", audience: "Grade 7, Grade 8" },
  { id: "dl6", title: "CBC Assessment Rubrics", category: "Syllabus", file_type: "PDF", size: "1.5 MB", uploaded_by: "Jane Kamau", date: "2024-01-15", audience: "Teachers" },
];

// ===== DASHBOARD =====
export const dashboardStats = {
  totalStudents: 342,
  activeStudents: 328,
  totalCollected: 4250000,
  totalOutstanding: 1820000,
  collectionRate: 70,
  totalExpenses: 286800,
  netIncome: 3963200,
  attendanceRate: 94.2,
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
    { type: "expense", message: "Electricity bill KES 28,500 recorded", time: "1 day ago" },
  ],
  expenseBreakdown: [
    { category: "Utilities", amount: 54200 },
    { category: "Transport", amount: 45000 },
    { category: "Maintenance", amount: 85000 },
    { category: "Lab Supplies", amount: 65000 },
    { category: "Office Supplies", amount: 15600 },
    { category: "Miscellaneous", amount: 22000 },
  ],
};

// ===== ACADEMIC SESSIONS =====
export const academicSessions = [
  { id: "as1", name: "2024", start: "2024-01-08", end: "2024-11-29", status: "active" as const },
  { id: "as2", name: "2023", start: "2023-01-09", end: "2023-11-24", status: "completed" as const },
  { id: "as3", name: "2025", start: "2025-01-06", end: "2025-11-28", status: "upcoming" as const },
];

export const academicTerms = [
  { id: "t1", name: "Term 1", session: "2024", start: "2024-01-08", end: "2024-04-12", status: "active" as const },
  { id: "t2", name: "Term 2", session: "2024", start: "2024-05-06", end: "2024-08-02", status: "upcoming" as const },
  { id: "t3", name: "Term 3", session: "2024", start: "2024-09-02", end: "2024-11-29", status: "upcoming" as const },
  { id: "t4", name: "Term 1", session: "2023", start: "2023-01-09", end: "2023-04-14", status: "completed" as const },
  { id: "t5", name: "Term 2", session: "2023", start: "2023-05-08", end: "2023-08-04", status: "completed" as const },
  { id: "t6", name: "Term 3", session: "2023", start: "2023-09-04", end: "2023-11-24", status: "completed" as const },
];

// ===== STUDENT PROMOTION =====
export const promotionRecords = [
  { id: "pm1", student: "Amina Wanjiku", from_class: "Grade 7 East", to_class: "Grade 8 East", session: "2023→2024", result: "pass", action: "promoted" },
  { id: "pm2", student: "Brian Ochieng", from_class: "Grade 6 West", to_class: "Grade 7 West", session: "2023→2024", result: "pass", action: "promoted" },
  { id: "pm3", student: "Catherine Muthoni", from_class: "Grade 7 East", to_class: "Grade 8 East", session: "2023→2024", result: "pass", action: "promoted" },
  { id: "pm4", student: "Hassan Mohamed", from_class: "Grade 6 West", to_class: "Grade 7 West", session: "2023→2024", result: "pass", action: "promoted" },
];
