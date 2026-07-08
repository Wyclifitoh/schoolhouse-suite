const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

/**
 * Find the subscription for a school.
 */
const findSubscription = (schoolId) =>
  queryOne("SELECT * FROM school_subscriptions WHERE school_id = ?", [schoolId]);

/**
 * Check if a school is allowed to create a new assessment.
 * Rules:
 *  1. Trial active → always allowed.
 *  2. Trial expired → check if all previous assessment_billing rows are 'paid'.
 *     If any are 'pending', block creation.
 *  3. No subscription row → treat as trial-expired (block).
 *
 * Returns { allowed: boolean, reason: string|null, trialActive: boolean, sub: object|null }
 */
async function checkAssessmentAllowed(schoolId) {
  const sub = await findSubscription(schoolId);

  // No subscription yet — create a default trial row on the fly
  if (!sub) {
    const school = await queryOne("SELECT created_at FROM schools WHERE id = ?", [schoolId]);
    const trialEnd = school
      ? new Date(new Date(school.created_at).getTime() + 30 * 86400 * 1000)
      : new Date();
    const now = new Date();
    if (now <= trialEnd) {
      return { allowed: true, trialActive: true, sub: null, reason: null };
    }
    return {
      allowed: false,
      trialActive: false,
      sub: null,
      reason: "Trial expired and no subscription found. Please contact support.",
    };
  }

  // Trial still active?
  const now = new Date();
  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
  const trialActive = trialEnd ? now <= trialEnd : false;

  if (trialActive || sub.status === "active") {
    return { allowed: true, trialActive, sub, reason: null };
  }

  // Trial expired — check for unpaid assessment billing
  const unpaid = await queryOne(
    "SELECT id FROM assessment_billing WHERE school_id = ? AND status = 'pending' LIMIT 1",
    [schoolId]
  );

  if (unpaid) {
    return {
      allowed: false,
      trialActive: false,
      sub,
      reason:
        "Your trial has ended and you have outstanding unpaid assessment invoices. " +
        "Please contact support to clear your balance before creating new assessments.",
    };
  }

  // Past_due / locked / cancelled = blocked even with no unpaid (sub itself is bad)
  if (["past_due", "locked", "cancelled"].includes(sub.status)) {
    return {
      allowed: false,
      trialActive: false,
      sub,
      reason: `School subscription is ${sub.status}. Please contact support.`,
    };
  }

  return { allowed: true, trialActive: false, sub, reason: null };
}

/**
 * Record a billing entry when an assessment is created post-trial.
 * student_count = active students at the time of creation.
 */
async function recordAssessmentBilling(schoolId, assessmentId, studentCount, pricePerStudent) {
  const id = uuidv4();
  const price = pricePerStudent != null ? Number(pricePerStudent) : 10;
  await query(
    `INSERT INTO assessment_billing (id, school_id, assessment_id, student_count, price_per_student, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [id, schoolId, assessmentId, studentCount, price]
  );
  return queryOne("SELECT * FROM assessment_billing WHERE id = ?", [id]);
}

/**
 * Mark assessment billing rows as paid (called by platform admin).
 * Can target a specific assessment_id or all pending for a school.
 */
async function markAssessmentPaid(schoolId, assessmentId = null) {
  if (assessmentId) {
    await query(
      "UPDATE assessment_billing SET status = 'paid', updated_at = NOW() WHERE school_id = ? AND assessment_id = ?",
      [schoolId, assessmentId]
    );
  } else {
    await query(
      "UPDATE assessment_billing SET status = 'paid', updated_at = NOW() WHERE school_id = ? AND status = 'pending'",
      [schoolId]
    );
  }
  return { ok: true };
}

/**
 * List assessment billing records for a school.
 */
const listAssessmentBilling = (schoolId) =>
  query(
    `SELECT ab.*, a.name AS assessment_name, a.status AS assessment_status,
            a.created_at AS assessment_created_at
     FROM assessment_billing ab
     LEFT JOIN assessments a ON a.id = ab.assessment_id
     WHERE ab.school_id = ?
     ORDER BY ab.created_at DESC`,
    [schoolId]
  );

/**
 * Get outstanding balance for a school (sum of pending assessment billing).
 */
const getOutstandingBalance = (schoolId) =>
  queryOne(
    `SELECT COALESCE(SUM(total_amount), 0) AS balance,
            COUNT(*) AS pending_count
     FROM assessment_billing
     WHERE school_id = ? AND status = 'pending'`,
    [schoolId]
  );

/**
 * Count active students for a school (used for billing calculation).
 */
const countActiveStudents = (schoolId) =>
  queryOne(
    "SELECT COUNT(*) AS c FROM students WHERE school_id = ? AND status = 'active'",
    [schoolId]
  ).then((r) => Number(r?.c || 0));

/**
 * Create or update the school_subscriptions row when a school is created.
 */
async function createSchoolSubscription(schoolId, trialDays = 30) {
  const existing = await findSubscription(schoolId);
  if (existing) return existing;
  const id = uuidv4();
  await query(
    `INSERT INTO school_subscriptions
       (id, school_id, status, trial_ends_at, assessment_price_per_student)
     VALUES (?, ?, 'trial', DATE_ADD(NOW(), INTERVAL ? DAY), 10.00)`,
    [id, schoolId, trialDays]
  );
  return findSubscription(schoolId);
}

module.exports = {
  findSubscription,
  checkAssessmentAllowed,
  recordAssessmentBilling,
  markAssessmentPaid,
  listAssessmentBilling,
  getOutstandingBalance,
  countActiveStudents,
  createSchoolSubscription,
};
