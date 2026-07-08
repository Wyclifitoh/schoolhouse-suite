const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const repo = require("./platform.repository");
const billingRepo = require("../billing/billing.repository");
const AppError = require("../../utils/AppError");
const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const SALT = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

function signPlatformToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, scope: "platform" },
    process.env.JWT_SECRET,
    { expiresIn: "12h" },
  );
}

async function login(email, password) {
  const user = await repo.findUserByEmail(email);
  if (!user) throw new AppError("Invalid credentials", 401);
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new AppError("Invalid credentials", 401);
  await repo.touchLastLogin(user.id);
  await repo.writeAudit({ actor_id: user.id, actor_email: user.email, action: "platform.login" });
  return {
    token: signPlatformToken(user),
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
  };
}

async function createStaff({ email, password, full_name, role }, actor) {
  if (!email || !password) throw new AppError("Email and password required", 400);
  const hash = await bcrypt.hash(password, SALT);
  const u = await repo.createPlatformUser({ email, password_hash: hash, full_name, role });
  await repo.writeAudit({ actor_id: actor.id, actor_email: actor.email, action: "platform.user.create", payload: { user_id: u.id, role } });
  return u;
}

/**
 * Create a new school with a 30-day trial subscription.
 * Does NOT create any user accounts — the school admin must be created separately via the normal auth flow.
 */
async function createSchool(body, actor) {
  const { name, email, phone, address, curriculum_type, code, trial_days = 30 } = body;
  if (!name) throw new AppError("School name is required", 400);

  // Check for duplicate code
  if (code) {
    const exists = await queryOne("SELECT id FROM schools WHERE code = ?", [code]);
    if (exists) throw new AppError(`School code '${code}' is already taken`, 409);
  }

  const id = uuidv4();
  await query(
    `INSERT INTO schools (id, name, email, phone, address, curriculum_type, code, is_active, trial_started_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
    [id, name, email || null, phone || null, address || null, curriculum_type || "CBC", code || null]
  );

  // Create initial admin user if provided
  const { admin_name, admin_email, admin_password } = body;
  if (admin_name && admin_email && admin_password) {
    const authService = require("../auth/auth.service");
    try {
      await authService.register({
        email: admin_email,
        password: admin_password,
        fullName: admin_name,
        schoolId: id,
        role: "school_admin",
      });
    } catch (err) {
      // If user already exists, authService throws.
      // In a real app we'd just assign the role, but for now we'll surface the error.
      throw new AppError(`School created, but failed to create admin: ${err.message}`, 400);
    }
  }


  // Create subscription with trial
  await billingRepo.createSchoolSubscription(id, Number(trial_days) || 30);

  await repo.writeAudit({
    actor_id: actor.id,
    actor_email: actor.email,
    action: "school.create",
    target_school_id: id,
    payload: { name, email, trial_days },
  });

  return queryOne("SELECT * FROM schools WHERE id = ?", [id]);
}

async function extendTrial(schoolId, days, actor) {
  await repo.extendTrial(schoolId, Number(days));
  await repo.writeAudit({ actor_id: actor.id, actor_email: actor.email, action: "trial.extend", target_school_id: schoolId, payload: { days } });
  return { ok: true };
}

async function terminateTrial(schoolId, actor) {
  await repo.setSubscriptionStatus(schoolId, "locked");
  await repo.writeAudit({ actor_id: actor.id, actor_email: actor.email, action: "trial.terminate", target_school_id: schoolId });
  return { ok: true };
}

async function setStatus(schoolId, status, actor) {
  await repo.setSubscriptionStatus(schoolId, status);
  await repo.writeAudit({ actor_id: actor.id, actor_email: actor.email, action: "subscription.status", target_school_id: schoolId, payload: { status } });
  return { ok: true };
}

async function setSchoolActive(schoolId, active, actor) {
  await repo.setSchoolActive(schoolId, active);
  await repo.writeAudit({ actor_id: actor.id, actor_email: actor.email, action: active ? "school.reactivate" : "school.suspend", target_school_id: schoolId });
  return { ok: true };
}

async function activateSubscription(schoolId, body, actor) {
  const plans = await repo.listPlans();
  const plan = plans.find((p) => p.id === body.plan_id || p.code === body.plan_code);
  if (!plan) throw new AppError("Plan not found", 404);
  const periodStart = body.period_start || new Date().toISOString().slice(0,10);
  const periodEnd = body.period_end || (() => {
    const d = new Date(periodStart);
    if (plan.cycle === "monthly") d.setMonth(d.getMonth()+1);
    else if (plan.cycle === "termly") d.setMonth(d.getMonth()+4);
    else d.setFullYear(d.getFullYear()+1);
    return d.toISOString().slice(0,10);
  })();
  await repo.activateSubscription(schoolId, {
    plan_id: plan.id, billing_mode: plan.billing_mode, cycle: plan.cycle,
    price_per_student: plan.price_per_student, period_start: periodStart, period_end: periodEnd,
    modules: body.modules,
  });
  await repo.writeAudit({ actor_id: actor.id, actor_email: actor.email, action: "subscription.activate", target_school_id: schoolId, payload: { plan_code: plan.code, periodEnd } });
  return { ok: true, period_end: periodEnd };
}

async function createManualInvoice(schoolId, body, actor) {
  const sub = await billingRepo.findSubscription(schoolId);
  if (!sub) throw new AppError("School has no subscription", 404);
  const inv = await repo.createInvoice({
    school_id: schoolId,
    subscription_id: sub.id,
    amount: Number(body.amount),
    period_start: body.period_start,
    period_end: body.period_end,
    student_count: body.student_count || null,
    status: body.mark_paid ? "paid" : "pending",
    mpesa_reference: body.mpesa_reference || null,
  });
  await repo.writeAudit({ actor_id: actor.id, actor_email: actor.email, action: "invoice.create", target_school_id: schoolId, payload: { id: inv.id, amount: inv.amount, paid: !!body.mark_paid } });
  return inv;
}

async function confirmInvoice(invoiceId, body, actor) {
  const inv = await repo.findInvoice(invoiceId);
  if (!inv) throw new AppError("Invoice not found", 404);
  const updated = await repo.updateInvoice(invoiceId, { status: "paid", mpesa_reference: body.mpesa_reference || inv.mpesa_reference });
  const sub = await billingRepo.findSubscription(inv.school_id);
  if (sub) {
    await repo.activateSubscription(inv.school_id, {
      plan_id: sub.plan_id,
      billing_mode: sub.billing_mode || "per_student",
      cycle: sub.cycle || "monthly",
      price_per_student: sub.price_per_student || 0,
      period_start: inv.period_start || new Date().toISOString().slice(0,10),
      period_end: inv.period_end || new Date().toISOString().slice(0,10),
    });
  }
  await repo.writeAudit({ actor_id: actor.id, actor_email: actor.email, action: "invoice.confirm", target_school_id: inv.school_id, payload: { invoice_id: invoiceId, ref: body.mpesa_reference } });
  return updated;
}

async function voidInvoice(invoiceId, actor) {
  const inv = await repo.findInvoice(invoiceId);
  if (!inv) throw new AppError("Invoice not found", 404);
  const u = await repo.updateInvoice(invoiceId, { status: "void" });
  await repo.writeAudit({ actor_id: actor.id, actor_email: actor.email, action: "invoice.void", target_school_id: inv.school_id, payload: { invoice_id: invoiceId } });
  return u;
}

async function resetUserPassword(userId, newPassword, actor) {
  if (!newPassword || newPassword.length < 8) throw new AppError("Password too short", 400);
  const hash = await bcrypt.hash(newPassword, SALT);
  await repo.setUserPassword(userId, hash);
  await repo.writeAudit({ actor_id: actor.id, actor_email: actor.email, action: "user.password_reset", payload: { user_id: userId } });
  return { ok: true };
}

module.exports = {
  login, createStaff, createSchool,
  extendTrial, terminateTrial, setStatus, setSchoolActive,
  activateSubscription, createManualInvoice, confirmInvoice, voidInvoice,
  resetUserPassword,
};