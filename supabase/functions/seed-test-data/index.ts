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
    // ── 1. Users ──
    const userDefs = [
      { email: "admin@chuo.test", password: "Admin@12345", first_name: "James", last_name: "Mwangi", role: "school_admin" },
      { email: "finance@chuo.test", password: "Finance@12345", first_name: "Grace", last_name: "Wanjiku", role: "finance_officer" },
      { email: "teacher@chuo.test", password: "Teacher@12345", first_name: "Peter", last_name: "Ochieng", role: "teacher" },
      { email: "parent@chuo.test", password: "Parent@12345", first_name: "Mary", last_name: "Akinyi", role: "parent" },
    ];
    const createdUsers: Record<string, string> = {};
    for (const u of userDefs) {
      let userId: string | null = null;
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email, password: u.password, email_confirm: true,
        user_metadata: { first_name: u.first_name, last_name: u.last_name },
      });
      if (data?.user) { userId = data.user.id; }
      else {
        const { data: list } = await supabase.auth.admin.listUsers();
        const found = list?.users?.find((x: any) => x.email === u.email);
        if (found) userId = found.id;
      }
      if (userId) createdUsers[u.role] = userId;
    }
    console.log("Users:", Object.keys(createdUsers).length);

    // ── 2. School ──
    let { data: school } = await supabase.from("schools").select().eq("code", "CHUO-001").single();
    if (!school) {
      const { data: s } = await supabase.from("schools").insert({
        name: "Chuo Academy", code: "CHUO-001", email: "info@chuoacademy.ac.ke",
        phone: "+254700100200", address: "123 Education Lane, Nairobi",
        county: "Nairobi", sub_county: "Westlands", curriculum_type: "CBC", paybill_number: "174379",
      }).select().single();
      school = s;
    }
    const sid = school!.id;

    // ── 3. Profiles + Roles ──
    for (const [role, uid] of Object.entries(createdUsers)) {
      await supabase.from("profiles").update({ school_id: sid }).eq("id", uid);
      const { data: existing } = await supabase.from("user_roles").select("id").eq("user_id", uid).eq("school_id", sid).eq("role", role);
      if (!existing?.length) {
        await supabase.from("user_roles").insert({ user_id: uid, school_id: sid, role, is_active: true });
      }
    }

    // ── 4. Academic Year ──
    let { data: ay } = await supabase.from("academic_years").select().eq("school_id", sid).eq("name", "2025").single();
    if (!ay) {
      const { data: a } = await supabase.from("academic_years").insert({
        school_id: sid, name: "2025", start_date: "2025-01-06", end_date: "2025-11-28", is_current: true,
      }).select().single();
      ay = a;
    }
    const ayId = ay!.id;

    // ── 5. Terms ──
    let { data: terms } = await supabase.from("terms").select().eq("school_id", sid).eq("academic_year_id", ayId).order("term_number");
    if (!terms?.length) {
      const { data: t } = await supabase.from("terms").insert([
        { school_id: sid, academic_year_id: ayId, name: "Term 1", start_date: "2025-01-06", end_date: "2025-04-11", is_current: false, term_number: 1 },
        { school_id: sid, academic_year_id: ayId, name: "Term 2", start_date: "2025-05-05", end_date: "2025-08-01", is_current: true, term_number: 2 },
        { school_id: sid, academic_year_id: ayId, name: "Term 3", start_date: "2025-09-01", end_date: "2025-11-28", is_current: false, term_number: 3 },
      ]).select();
      terms = t;
    }
    const currentTerm = terms!.find((t: any) => t.is_current)!;

    // ── 6. Grades ──
    let { data: grades } = await supabase.from("grades").select().eq("school_id", sid).order("order_index");
    if (!grades?.length) {
      const { data: g } = await supabase.from("grades").insert([
        { school_id: sid, name: "Grade 1", level: "lower_primary", order_index: 1, curriculum_type: "CBC" },
        { school_id: sid, name: "Grade 2", level: "lower_primary", order_index: 2, curriculum_type: "CBC" },
        { school_id: sid, name: "Grade 3", level: "lower_primary", order_index: 3, curriculum_type: "CBC" },
        { school_id: sid, name: "Grade 4", level: "upper_primary", order_index: 4, curriculum_type: "CBC" },
        { school_id: sid, name: "Grade 5", level: "upper_primary", order_index: 5, curriculum_type: "CBC" },
        { school_id: sid, name: "Grade 6", level: "upper_primary", order_index: 6, curriculum_type: "CBC" },
        { school_id: sid, name: "Grade 7", level: "junior_secondary", order_index: 7, curriculum_type: "CBC" },
        { school_id: sid, name: "Grade 8", level: "junior_secondary", order_index: 8, curriculum_type: "CBC" },
      ]).select();
      grades = g;
    }

    // ── 7. Streams ──
    let { data: streams } = await supabase.from("streams").select().eq("school_id", sid);
    if (!streams?.length) {
      const s: any[] = [];
      for (const g of grades!) {
        s.push({ school_id: sid, grade_id: g.id, academic_year_id: ayId, name: "East", capacity: 40 });
        s.push({ school_id: sid, grade_id: g.id, academic_year_id: ayId, name: "West", capacity: 40 });
      }
      const { data: st } = await supabase.from("streams").insert(s).select();
      streams = st;
    }

    // ── 8. Parents ──
    let { data: parents } = await supabase.from("parents").select().eq("school_id", sid);
    if (!parents?.length) {
      const { data: p } = await supabase.from("parents").insert([
        { school_id: sid, first_name: "Mary", last_name: "Akinyi", phone: "+254711111111", email: "mary@example.com", id_number: "12345678", user_id: createdUsers["parent"] || null },
        { school_id: sid, first_name: "John", last_name: "Kamau", phone: "+254722222222", email: "john.kamau@example.com", id_number: "23456789" },
        { school_id: sid, first_name: "Susan", last_name: "Chebet", phone: "+254733333333", email: "susan@example.com", id_number: "34567890" },
        { school_id: sid, first_name: "David", last_name: "Omondi", phone: "+254744444444", email: "david@example.com", id_number: "45678901" },
        { school_id: sid, first_name: "Esther", last_name: "Muthoni", phone: "+254755555555", email: "esther@example.com", id_number: "56789012" },
      ]).select();
      parents = p;
    }

    // ── 9. Students ──
    const g1 = grades![0], g4 = grades![3], g7 = grades![6];
    const s1e = streams!.find((s: any) => s.grade_id === g1.id && s.name === "East");
    const s4e = streams!.find((s: any) => s.grade_id === g4.id && s.name === "East");
    const s7e = streams!.find((s: any) => s.grade_id === g7.id && s.name === "East");

    let { data: students } = await supabase.from("students").select().eq("school_id", sid);
    if (!students?.length) {
      const studs = [
        { school_id: sid, admission_number: "CHUO/2025/001", first_name: "Brian", last_name: "Akinyi", current_grade_id: g1.id, current_stream_id: s1e?.id, current_term_id: currentTerm.id, status: "active", date_of_birth: "2018-03-15", gender: "male", parent_name: "Mary Akinyi", parent_phone: "+254711111111", admission_date: "2025-01-06" },
        { school_id: sid, admission_number: "CHUO/2025/002", first_name: "Cynthia", last_name: "Kamau", current_grade_id: g1.id, current_stream_id: s1e?.id, current_term_id: currentTerm.id, status: "active", date_of_birth: "2018-06-22", gender: "female", parent_name: "John Kamau", parent_phone: "+254722222222", admission_date: "2025-01-06" },
        { school_id: sid, admission_number: "CHUO/2025/003", first_name: "Dennis", last_name: "Chebet", current_grade_id: g4.id, current_stream_id: s4e?.id, current_term_id: currentTerm.id, status: "active", date_of_birth: "2015-01-10", gender: "male", parent_name: "Susan Chebet", parent_phone: "+254733333333", admission_date: "2023-01-09" },
        { school_id: sid, admission_number: "CHUO/2025/004", first_name: "Faith", last_name: "Omondi", current_grade_id: g4.id, current_stream_id: s4e?.id, current_term_id: currentTerm.id, status: "active", date_of_birth: "2015-09-05", gender: "female", parent_name: "David Omondi", parent_phone: "+254744444444", admission_date: "2023-01-09" },
        { school_id: sid, admission_number: "CHUO/2025/005", first_name: "George", last_name: "Muthoni", current_grade_id: g7.id, current_stream_id: s7e?.id, current_term_id: currentTerm.id, status: "active", date_of_birth: "2012-11-20", gender: "male", parent_name: "Esther Muthoni", parent_phone: "+254755555555", admission_date: "2021-01-04" },
        { school_id: sid, admission_number: "CHUO/2025/006", first_name: "Hannah", last_name: "Wafula", current_grade_id: g7.id, current_stream_id: s7e?.id, current_term_id: currentTerm.id, status: "active", date_of_birth: "2012-04-14", gender: "female", parent_name: "Mary Akinyi", parent_phone: "+254711111111", admission_date: "2021-01-04" },
        { school_id: sid, admission_number: "CHUO/2025/007", first_name: "Ian", last_name: "Njoroge", current_grade_id: g1.id, current_stream_id: s1e?.id, current_term_id: currentTerm.id, status: "active", date_of_birth: "2018-08-30", gender: "male", parent_name: "John Kamau", parent_phone: "+254722222222", admission_date: "2025-01-06" },
        { school_id: sid, admission_number: "CHUO/2025/008", first_name: "Joy", last_name: "Otieno", current_grade_id: g4.id, current_stream_id: s4e?.id, current_term_id: currentTerm.id, status: "active", date_of_birth: "2015-12-01", gender: "female", parent_name: "Susan Chebet", parent_phone: "+254733333333", admission_date: "2023-01-09" },
        { school_id: sid, admission_number: "CHUO/2025/009", first_name: "Kevin", last_name: "Kiplagat", current_grade_id: g7.id, current_stream_id: s7e?.id, current_term_id: currentTerm.id, status: "active", date_of_birth: "2012-07-18", gender: "male", parent_name: "David Omondi", parent_phone: "+254744444444", admission_date: "2021-01-04" },
        { school_id: sid, admission_number: "CHUO/2025/010", first_name: "Lucy", last_name: "Wambui", current_grade_id: g1.id, current_stream_id: s1e?.id, current_term_id: currentTerm.id, status: "active", date_of_birth: "2018-02-28", gender: "female", parent_name: "Esther Muthoni", parent_phone: "+254755555555", admission_date: "2025-01-06" },
      ];
      const { data: st, error: stErr } = await supabase.from("students").insert(studs).select();
      if (stErr) throw new Error("Students: " + JSON.stringify(stErr));
      students = st;
    }

    // ── 10. Student-Parent links ──
    const { data: existingLinks } = await supabase.from("student_parents").select("id").eq("student_id", students![0].id);
    if (!existingLinks?.length) {
      await supabase.from("student_parents").insert([
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
      ]);
    }

    // ── 11. Fee Templates ──
    let { data: templates } = await supabase.from("fee_templates").select().eq("school_id", sid);
    if (!templates?.length) {
      const { data: t } = await supabase.from("fee_templates").insert([
        { school_id: sid, name: "Tuition Fee", code: "TUI", fee_type: "tuition", amount: 15000, ledger_type: "fees", is_mandatory: true, is_recurring: true, priority: 1 },
        { school_id: sid, name: "Activity Fee", code: "ACT", fee_type: "activity", amount: 3000, ledger_type: "fees", is_mandatory: true, is_recurring: true, priority: 2 },
        { school_id: sid, name: "Exam Fee", code: "EXM", fee_type: "examination", amount: 2000, ledger_type: "fees", is_mandatory: true, is_recurring: true, priority: 3 },
        { school_id: sid, name: "Library Fee", code: "LIB", fee_type: "library", amount: 1000, ledger_type: "fees", is_mandatory: false, is_recurring: true, priority: 4 },
        { school_id: sid, name: "Transport Fee", code: "TRP", fee_type: "transport", amount: 8000, ledger_type: "transport", is_mandatory: false, is_recurring: true, priority: 1 },
      ]).select();
      templates = t;
    }

    // ── 12. Fee Categories ──
    const { data: existingCats } = await supabase.from("fee_categories").select("id").eq("school_id", sid);
    if (!existingCats?.length) {
      await supabase.from("fee_categories").insert([
        { school_id: sid, name: "Tuition", type: "tuition", is_optional: false },
        { school_id: sid, name: "Activities", type: "activity", is_optional: false },
        { school_id: sid, name: "Examination", type: "examination", is_optional: false },
        { school_id: sid, name: "Transport", type: "transport", is_optional: true },
      ]);
    }

    // ── 13. Student Fees ──
    let { data: fees } = await supabase.from("student_fees").select().eq("school_id", sid);
    if (!fees?.length) {
      const tui = templates!.find((t: any) => t.code === "TUI")!;
      const act = templates!.find((t: any) => t.code === "ACT")!;
      const exm = templates!.find((t: any) => t.code === "EXM")!;
      const by = createdUsers["school_admin"] || "system";

      const rows: any[] = [];
      for (const s of students!) {
        rows.push(
          { school_id: sid, student_id: s.id, fee_template_id: tui.id, term_id: currentTerm.id, academic_year_id: ayId, ledger_type: "fees", amount_due: 15000, amount_paid: 0, brought_forward_amount: 0, brought_forward_credit: 0, status: "pending", assigned_by: by, assignment_mode: "bulk_auto" },
          { school_id: sid, student_id: s.id, fee_template_id: act.id, term_id: currentTerm.id, academic_year_id: ayId, ledger_type: "fees", amount_due: 3000, amount_paid: 0, brought_forward_amount: 0, brought_forward_credit: 0, status: "pending", assigned_by: by, assignment_mode: "bulk_auto" },
          { school_id: sid, student_id: s.id, fee_template_id: exm.id, term_id: currentTerm.id, academic_year_id: ayId, ledger_type: "fees", amount_due: 2000, amount_paid: 0, brought_forward_amount: 0, brought_forward_credit: 0, status: "pending", assigned_by: by, assignment_mode: "bulk_auto" },
        );
      }
      const { data: f, error: fErr } = await supabase.from("student_fees").insert(rows).select();
      if (fErr) throw new Error("Fees: " + JSON.stringify(fErr));
      fees = f;
    }

    // ── 14. Payments + Allocations ──
    let { data: existingPayments } = await supabase.from("payments").select("id").eq("school_id", sid);
    if (!existingPayments?.length) {
      const amounts = [20000, 15000, 10000, 5000, 18000];
      const methods = ["mpesa_stk", "cash", "mpesa_stk", "cash", "bank"];
      const pmts: any[] = [];
      for (let i = 0; i < 5; i++) {
        pmts.push({
          school_id: sid, student_id: students![i].id, amount: amounts[i],
          payment_method: methods[i], reference_number: `REF-2025-${String(i+1).padStart(4,"0")}`,
          ledger_type: "fees", status: "completed",
          received_at: new Date(2025, 4, 10+i).toISOString(),
          recorded_by: createdUsers["finance_officer"] || null,
          payer_phone: parents![i].phone,
          notes: `Term 2 payment - ${students![i].full_name}`,
        });
      }
      const { data: payRows } = await supabase.from("payments").insert(pmts).select();

      // Allocate FIFO
      for (const p of payRows!) {
        let rem = p.amount;
        const sFees = fees!.filter((f: any) => f.student_id === p.student_id).sort((a: any, b: any) => a.created_at.localeCompare(b.created_at));
        for (const f of sFees) {
          if (rem <= 0) break;
          const alloc = Math.min(rem, f.amount_due - f.amount_paid);
          if (alloc <= 0) continue;
          await supabase.from("payment_allocations").insert({ payment_id: p.id, student_fee_id: f.id, amount: alloc, is_auto_allocated: true });
          const newPaid = f.amount_paid + alloc;
          await supabase.from("student_fees").update({
            amount_paid: newPaid,
            status: newPaid >= f.amount_due ? "paid" : "partial",
            last_payment_at: new Date().toISOString(),
          }).eq("id", f.id);
          f.amount_paid = newPaid;
          rem -= alloc;
        }
      }

      // Receipts
      for (let i = 0; i < payRows!.length; i++) {
        await supabase.from("receipts").insert({ school_id: sid, payment_id: payRows![i].id, receipt_number: `RCP-2025-${String(i+1).padStart(6,"0")}` });
      }
    }

    // ── 15. Fee Discounts ──
    const { data: existDisc } = await supabase.from("fee_discounts").select("id").eq("school_id", sid);
    if (!existDisc?.length) {
      await supabase.from("fee_discounts").insert([
        { school_id: sid, name: "Sibling Discount", type: "percentage", value: 10, description: "10% off siblings", is_active: true, stackable: false, priority: 1 },
        { school_id: sid, name: "Early Payment", type: "fixed_amount", value: 500, description: "KES 500 off early", is_active: true, stackable: true, priority: 2 },
      ]);
    }

    // ── 16. Finance Config ──
    const { data: existConf } = await supabase.from("finance_automation_config").select("school_id").eq("school_id", sid);
    if (!existConf?.length) {
      await supabase.from("finance_automation_config").insert({
        school_id: sid, auto_allocate_payments: true, auto_assign_fees_on_enrollment: true,
        auto_carry_forward_arrears: true, send_payment_confirmation_sms: true, default_allocation_strategy: "fifo",
      });
    }

    // ── 17. Inventory ──
    let { data: invCats } = await supabase.from("inventory_categories").select().eq("school_id", sid);
    if (!invCats?.length) {
      const { data: ic } = await supabase.from("inventory_categories").insert([
        { school_id: sid, name: "Stationery", description: "Pens, pencils, books" },
        { school_id: sid, name: "Uniforms", description: "School uniforms" },
      ]).select();
      invCats = ic;
    }
    const { data: existItems } = await supabase.from("inventory_items").select("id").eq("school_id", sid);
    if (!existItems?.length) {
      await supabase.from("inventory_items").insert([
        { school_id: sid, category_id: invCats![0].id, name: "Exercise Book 96pg", sku: "STN-001", cost_price: 30, selling_price: 50, quantity_in_stock: 500, reorder_level: 100 },
        { school_id: sid, category_id: invCats![0].id, name: "Blue Pen", sku: "STN-002", cost_price: 10, selling_price: 20, quantity_in_stock: 1000, reorder_level: 200 },
        { school_id: sid, category_id: invCats![1].id, name: "School Sweater", sku: "UNI-001", cost_price: 800, selling_price: 1200, quantity_in_stock: 50, reorder_level: 20 },
        { school_id: sid, category_id: invCats![1].id, name: "School Shirt", sku: "UNI-002", cost_price: 500, selling_price: 800, quantity_in_stock: 80, reorder_level: 30 },
      ]);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "🎉 Test data seeded!",
      credentials: userDefs.map(u => ({ email: u.email, password: u.password, role: u.role })),
      school: { id: sid, name: school!.name },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("Seed error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
