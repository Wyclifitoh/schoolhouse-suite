import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1. Create test users
    const users = [
      { email: "admin@chuo.test", password: "Admin@12345", first_name: "James", last_name: "Mwangi", role: "school_admin" as const },
      { email: "finance@chuo.test", password: "Finance@12345", first_name: "Grace", last_name: "Wanjiku", role: "finance_officer" as const },
      { email: "teacher@chuo.test", password: "Teacher@12345", first_name: "Peter", last_name: "Ochieng", role: "teacher" as const },
      { email: "parent@chuo.test", password: "Parent@12345", first_name: "Mary", last_name: "Akinyi", role: "parent" as const },
    ];

    const createdUsers: Record<string, string> = {};

    for (const u of users) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { first_name: u.first_name, last_name: u.last_name },
      });
      if (error && !error.message.includes("already been registered")) {
        console.error(`Failed to create ${u.email}:`, error.message);
        continue;
      }
      if (data?.user) {
        createdUsers[u.role] = data.user.id;
      } else {
        // User exists, find them
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find((x: any) => x.email === u.email);
        if (existing) createdUsers[u.role] = existing.id;
      }
    }

    console.log("Created users:", createdUsers);

    // 2. Create school
    const { data: school } = await supabase.from("schools").insert({
      name: "Chuo Academy",
      code: "CHUO-001",
      email: "info@chuoacademy.ac.ke",
      phone: "+254700100200",
      address: "123 Education Lane, Nairobi",
      county: "Nairobi",
      sub_county: "Westlands",
      curriculum_type: "CBC",
      paybill_number: "174379",
    }).select().single();

    if (!school) throw new Error("Failed to create school");
    const schoolId = school.id;
    console.log("School created:", schoolId);

    // 3. Update profiles with school_id
    for (const [role, userId] of Object.entries(createdUsers)) {
      await supabase.from("profiles").update({ school_id: schoolId }).eq("id", userId);
    }

    // 4. Assign roles
    for (const [role, userId] of Object.entries(createdUsers)) {
      await supabase.from("user_roles").insert({
        user_id: userId,
        school_id: schoolId,
        role: role,
        is_active: true,
      });
    }

    // 5. Academic year
    const { data: ay } = await supabase.from("academic_years").insert({
      school_id: schoolId,
      name: "2025",
      start_date: "2025-01-06",
      end_date: "2025-11-28",
      is_current: true,
    }).select().single();

    const ayId = ay!.id;

    // 6. Terms
    const termsData = [
      { school_id: schoolId, academic_year_id: ayId, name: "Term 1", start_date: "2025-01-06", end_date: "2025-04-11", is_current: false, term_number: 1 },
      { school_id: schoolId, academic_year_id: ayId, name: "Term 2", start_date: "2025-05-05", end_date: "2025-08-01", is_current: true, term_number: 2 },
      { school_id: schoolId, academic_year_id: ayId, name: "Term 3", start_date: "2025-09-01", end_date: "2025-11-28", is_current: false, term_number: 3 },
    ];
    const { data: terms } = await supabase.from("terms").insert(termsData).select();
    const currentTerm = terms!.find((t: any) => t.is_current);
    console.log("Terms created:", terms?.length);

    // 7. Grades
    const gradesData = [
      { school_id: schoolId, name: "Grade 1", level: "lower_primary", order_index: 1, curriculum_type: "CBC" },
      { school_id: schoolId, name: "Grade 2", level: "lower_primary", order_index: 2, curriculum_type: "CBC" },
      { school_id: schoolId, name: "Grade 3", level: "lower_primary", order_index: 3, curriculum_type: "CBC" },
      { school_id: schoolId, name: "Grade 4", level: "upper_primary", order_index: 4, curriculum_type: "CBC" },
      { school_id: schoolId, name: "Grade 5", level: "upper_primary", order_index: 5, curriculum_type: "CBC" },
      { school_id: schoolId, name: "Grade 6", level: "upper_primary", order_index: 6, curriculum_type: "CBC" },
      { school_id: schoolId, name: "Grade 7", level: "junior_secondary", order_index: 7, curriculum_type: "CBC" },
      { school_id: schoolId, name: "Grade 8", level: "junior_secondary", order_index: 8, curriculum_type: "CBC" },
    ];
    const { data: grades } = await supabase.from("grades").insert(gradesData).select();
    console.log("Grades created:", grades?.length);

    // 8. Streams for each grade
    const streamsToInsert = [];
    for (const grade of grades!) {
      streamsToInsert.push(
        { school_id: schoolId, grade_id: grade.id, academic_year_id: ayId, name: "East", capacity: 40 },
        { school_id: schoolId, grade_id: grade.id, academic_year_id: ayId, name: "West", capacity: 40 },
      );
    }
    await supabase.from("streams").insert(streamsToInsert);

    // 9. Parents
    const parentsData = [
      { school_id: schoolId, first_name: "Mary", last_name: "Akinyi", phone: "+254711111111", email: "mary@example.com", id_number: "12345678", user_id: createdUsers["parent"] || null },
      { school_id: schoolId, first_name: "John", last_name: "Kamau", phone: "+254722222222", email: "john.kamau@example.com", id_number: "23456789" },
      { school_id: schoolId, first_name: "Susan", last_name: "Chebet", phone: "+254733333333", email: "susan@example.com", id_number: "34567890" },
      { school_id: schoolId, first_name: "David", last_name: "Omondi", phone: "+254744444444", email: "david@example.com", id_number: "45678901" },
      { school_id: schoolId, first_name: "Esther", last_name: "Muthoni", phone: "+254755555555", email: "esther@example.com", id_number: "56789012" },
    ];
    const { data: parents } = await supabase.from("parents").insert(parentsData).select();
    console.log("Parents created:", parents?.length);

    // 10. Students
    const grade1 = grades![0];
    const grade4 = grades![3];
    const grade7 = grades![6];

    const studentsData = [
      { school_id: schoolId, admission_number: "CHUO/2025/001", full_name: "Brian Akinyi", grade_id: grade1.id, current_term_id: currentTerm!.id, status: "active", date_of_birth: "2018-03-15", gender: "male" },
      { school_id: schoolId, admission_number: "CHUO/2025/002", full_name: "Cynthia Kamau", grade_id: grade1.id, current_term_id: currentTerm!.id, status: "active", date_of_birth: "2018-06-22", gender: "female" },
      { school_id: schoolId, admission_number: "CHUO/2025/003", full_name: "Dennis Chebet", grade_id: grade4.id, current_term_id: currentTerm!.id, status: "active", date_of_birth: "2015-01-10", gender: "male" },
      { school_id: schoolId, admission_number: "CHUO/2025/004", full_name: "Faith Omondi", grade_id: grade4.id, current_term_id: currentTerm!.id, status: "active", date_of_birth: "2015-09-05", gender: "female" },
      { school_id: schoolId, admission_number: "CHUO/2025/005", full_name: "George Muthoni", grade_id: grade7.id, current_term_id: currentTerm!.id, status: "active", date_of_birth: "2012-11-20", gender: "male" },
      { school_id: schoolId, admission_number: "CHUO/2025/006", full_name: "Hannah Wafula", grade_id: grade7.id, current_term_id: currentTerm!.id, status: "active", date_of_birth: "2012-04-14", gender: "female" },
      { school_id: schoolId, admission_number: "CHUO/2025/007", full_name: "Ian Njoroge", grade_id: grade1.id, current_term_id: currentTerm!.id, status: "active", date_of_birth: "2018-08-30", gender: "male" },
      { school_id: schoolId, admission_number: "CHUO/2025/008", full_name: "Joy Otieno", grade_id: grade4.id, current_term_id: currentTerm!.id, status: "active", date_of_birth: "2015-12-01", gender: "female" },
      { school_id: schoolId, admission_number: "CHUO/2025/009", full_name: "Kevin Kiplagat", grade_id: grade7.id, current_term_id: currentTerm!.id, status: "active", date_of_birth: "2012-07-18", gender: "male" },
      { school_id: schoolId, admission_number: "CHUO/2025/010", full_name: "Lucy Wambui", grade_id: grade1.id, current_term_id: currentTerm!.id, status: "active", date_of_birth: "2018-02-28", gender: "female" },
    ];
    const { data: students } = await supabase.from("students").insert(studentsData).select();
    console.log("Students created:", students?.length);

    // 11. Link parents to students
    const parentLinks = [
      { student_id: students![0].id, parent_id: parents![0].id, relationship: "mother", is_primary_contact: true, is_fee_payer: true },
      { student_id: students![1].id, parent_id: parents![1].id, relationship: "father", is_primary_contact: true, is_fee_payer: true },
      { student_id: students![2].id, parent_id: parents![2].id, relationship: "mother", is_primary_contact: true, is_fee_payer: true },
      { student_id: students![3].id, parent_id: parents![3].id, relationship: "father", is_primary_contact: true, is_fee_payer: true },
      { student_id: students![4].id, parent_id: parents![4].id, relationship: "mother", is_primary_contact: true, is_fee_payer: true },
      { student_id: students![5].id, parent_id: parents![0].id, relationship: "guardian", is_primary_contact: true, is_fee_payer: true },
      { student_id: students![6].id, parent_id: parents![1].id, relationship: "father", is_primary_contact: true, is_fee_payer: true },
      { student_id: students![7].id, parent_id: parents![2].id, relationship: "mother", is_primary_contact: true, is_fee_payer: true },
      { student_id: students![8].id, parent_id: parents![3].id, relationship: "father", is_primary_contact: true, is_fee_payer: true },
      { student_id: students![9].id, parent_id: parents![4].id, relationship: "mother", is_primary_contact: true, is_fee_payer: true },
    ];
    await supabase.from("student_parents").insert(parentLinks);

    // 12. Fee templates
    const feeTemplates = [
      { school_id: schoolId, name: "Tuition Fee", code: "TUI", fee_type: "tuition", amount: 15000, ledger_type: "fees", is_mandatory: true, is_recurring: true, priority: 1, description: "Termly tuition fee" },
      { school_id: schoolId, name: "Activity Fee", code: "ACT", fee_type: "activity", amount: 3000, ledger_type: "fees", is_mandatory: true, is_recurring: true, priority: 2, description: "Sports and clubs" },
      { school_id: schoolId, name: "Exam Fee", code: "EXM", fee_type: "examination", amount: 2000, ledger_type: "fees", is_mandatory: true, is_recurring: true, priority: 3, description: "Termly examination fee" },
      { school_id: schoolId, name: "Library Fee", code: "LIB", fee_type: "library", amount: 1000, ledger_type: "fees", is_mandatory: false, is_recurring: true, priority: 4, description: "Library access" },
      { school_id: schoolId, name: "Transport Fee", code: "TRP", fee_type: "transport", amount: 8000, ledger_type: "transport", is_mandatory: false, is_recurring: true, priority: 1, description: "School bus transport" },
    ];
    const { data: templates } = await supabase.from("fee_templates").insert(feeTemplates).select();
    console.log("Fee templates created:", templates?.length);

    // 13. Fee categories
    const feeCategories = [
      { school_id: schoolId, name: "Tuition", type: "tuition", description: "Core tuition fees", is_optional: false, is_refundable: false },
      { school_id: schoolId, name: "Activities", type: "activity", description: "Extra-curricular activities", is_optional: false },
      { school_id: schoolId, name: "Examination", type: "examination", description: "Exam administration", is_optional: false },
      { school_id: schoolId, name: "Transport", type: "transport", description: "School bus transport", is_optional: true },
    ];
    await supabase.from("fee_categories").insert(feeCategories);

    // 14. Assign fees to students (student_fees)
    const tuitionTemplate = templates!.find((t: any) => t.code === "TUI");
    const activityTemplate = templates!.find((t: any) => t.code === "ACT");
    const examTemplate = templates!.find((t: any) => t.code === "EXM");

    const studentFees: any[] = [];
    for (const student of students!) {
      studentFees.push(
        { school_id: schoolId, student_id: student.id, fee_template_id: tuitionTemplate!.id, term_id: currentTerm!.id, academic_year_id: ayId, ledger_type: "fees", amount_due: 15000, amount_paid: 0, brought_forward_amount: 0, brought_forward_credit: 0, status: "pending", assigned_by: createdUsers["school_admin"] || createdUsers["finance_officer"], assignment_mode: "bulk_auto" },
        { school_id: schoolId, student_id: student.id, fee_template_id: activityTemplate!.id, term_id: currentTerm!.id, academic_year_id: ayId, ledger_type: "fees", amount_due: 3000, amount_paid: 0, brought_forward_amount: 0, brought_forward_credit: 0, status: "pending", assigned_by: createdUsers["school_admin"] || createdUsers["finance_officer"], assignment_mode: "bulk_auto" },
        { school_id: schoolId, student_id: student.id, fee_template_id: examTemplate!.id, term_id: currentTerm!.id, academic_year_id: ayId, ledger_type: "fees", amount_due: 2000, amount_paid: 0, brought_forward_amount: 0, brought_forward_credit: 0, status: "pending", assigned_by: createdUsers["school_admin"] || createdUsers["finance_officer"], assignment_mode: "bulk_auto" },
      );
    }
    const { data: fees } = await supabase.from("student_fees").insert(studentFees).select();
    console.log("Student fees created:", fees?.length);

    // 15. Sample payments (some students partially paid)
    const paidStudents = students!.slice(0, 5);
    const payments: any[] = [];
    const paymentAmounts = [20000, 15000, 10000, 5000, 18000];

    for (let i = 0; i < paidStudents.length; i++) {
      payments.push({
        school_id: schoolId,
        student_id: paidStudents[i].id,
        amount: paymentAmounts[i],
        payment_method: i % 2 === 0 ? "mpesa_stk" : "cash",
        reference_number: `REF-2025-${String(i + 1).padStart(4, "0")}`,
        ledger_type: "fees",
        status: "completed",
        received_at: new Date(2025, 4, 10 + i).toISOString(),
        recorded_by: createdUsers["finance_officer"] || null,
        payer_phone: parents![i].phone,
        notes: `Term 2 payment for ${paidStudents[i].full_name}`,
      });
    }
    const { data: paymentRows } = await supabase.from("payments").insert(payments).select();
    console.log("Payments created:", paymentRows?.length);

    // 16. Allocate payments to fees (FIFO)
    for (let i = 0; i < paymentRows!.length; i++) {
      const payment = paymentRows![i];
      let remaining = payment.amount;
      const studentFeeRows = fees!.filter((f: any) => f.student_id === payment.student_id).sort((a: any, b: any) => a.created_at.localeCompare(b.created_at));

      for (const fee of studentFeeRows) {
        if (remaining <= 0) break;
        const allocAmount = Math.min(remaining, fee.amount_due - fee.amount_paid);
        if (allocAmount <= 0) continue;

        await supabase.from("payment_allocations").insert({
          payment_id: payment.id,
          student_fee_id: fee.id,
          amount: allocAmount,
          is_auto_allocated: true,
        });

        const newPaid = fee.amount_paid + allocAmount;
        await supabase.from("student_fees").update({
          amount_paid: newPaid,
          status: newPaid >= fee.amount_due ? "paid" : "partial",
          last_payment_at: new Date().toISOString(),
        }).eq("id", fee.id);

        remaining -= allocAmount;
      }
    }

    // 17. Receipts for payments
    for (const payment of paymentRows!) {
      const receiptNum = `RCP-2025-${String(Math.floor(Math.random() * 999999)).padStart(6, "0")}`;
      await supabase.from("receipts").insert({
        school_id: schoolId,
        payment_id: payment.id,
        receipt_number: receiptNum,
      });
    }

    // 18. Fee discounts
    await supabase.from("fee_discounts").insert([
      { school_id: schoolId, name: "Sibling Discount", type: "percentage", value: 10, description: "10% off for siblings", is_active: true, applicable_to: "tuition", condition_type: "sibling_count", stackable: false, priority: 1 },
      { school_id: schoolId, name: "Early Payment Discount", type: "fixed_amount", value: 500, description: "KES 500 off for early payment", is_active: true, applicable_to: "tuition", condition_type: "early_payment", stackable: true, priority: 2 },
    ]);

    // 19. Finance automation config
    await supabase.from("finance_automation_config").insert({
      school_id: schoolId,
      auto_allocate_payments: true,
      auto_assign_fees_on_enrollment: true,
      auto_carry_forward_arrears: true,
      send_payment_confirmation_sms: true,
      send_balance_reminder_sms: true,
      default_allocation_strategy: "fifo",
    });

    // 20. Inventory items
    const { data: invCat } = await supabase.from("inventory_categories").insert([
      { school_id: schoolId, name: "Stationery", description: "Pens, pencils, books" },
      { school_id: schoolId, name: "Uniforms", description: "School uniforms" },
    ]).select();

    await supabase.from("inventory_items").insert([
      { school_id: schoolId, category_id: invCat![0].id, name: "Exercise Book (96 pages)", sku: "STN-001", cost_price: 30, selling_price: 50, quantity_in_stock: 500, reorder_level: 100 },
      { school_id: schoolId, category_id: invCat![0].id, name: "Blue Pen", sku: "STN-002", cost_price: 10, selling_price: 20, quantity_in_stock: 1000, reorder_level: 200 },
      { school_id: schoolId, category_id: invCat![1].id, name: "School Sweater", sku: "UNI-001", cost_price: 800, selling_price: 1200, quantity_in_stock: 50, reorder_level: 20 },
      { school_id: schoolId, category_id: invCat![1].id, name: "School Shirt", sku: "UNI-002", cost_price: 500, selling_price: 800, quantity_in_stock: 80, reorder_level: 30 },
    ]);

    return new Response(JSON.stringify({
      success: true,
      message: "Test data seeded successfully!",
      credentials: users.map(u => ({ email: u.email, password: u.password, role: u.role })),
      school: { id: schoolId, name: school.name },
      counts: {
        users: Object.keys(createdUsers).length,
        grades: grades?.length,
        students: students?.length,
        parents: parents?.length,
        fees: fees?.length,
        payments: paymentRows?.length,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("Seed error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
