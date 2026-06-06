/**
 * Fee Reminder SMS sender — sends one SMS per selected student to the
 * student's primary parent/guardian.
 *
 * Falls back to students.parent_phone when no linked parent record exists.
 */
const { query, queryOne } = require("../../config/database");
const { sendSMS } = require("../communication/sms.service");
const repo = require("../communication/communication.repository");

const formatKES = (n) => `KES ${Math.abs(Number(n || 0)).toLocaleString()}`;

const resolveRecipient = async (schoolId, studentId) => {
  // Prefer first linked parent with a phone
  const linked = await queryOne(
    `SELECT p.id AS parent_id, p.first_name, p.last_name, p.phone
       FROM student_parents sp
       JOIN parents p ON p.id = sp.parent_id
      WHERE sp.student_id = ? AND p.phone IS NOT NULL AND p.phone <> ''
      ORDER BY (sp.is_primary = 1) DESC, sp.created_at ASC
      LIMIT 1`,
    [studentId],
  ).catch(() => null);
  if (linked && linked.phone) {
    return {
      phone: linked.phone,
      name: `${linked.first_name || ""} ${linked.last_name || ""}`.trim() ||
        "Parent",
      parent_id: linked.parent_id,
    };
  }
  // Fallback to legacy students.parent_phone
  const fallback = await queryOne(
    `SELECT parent_name, parent_phone FROM students WHERE id = ? AND school_id = ?`,
    [studentId, schoolId],
  );
  if (fallback && fallback.parent_phone) {
    return {
      phone: fallback.parent_phone,
      name: fallback.parent_name || "Parent",
      parent_id: null,
    };
  }
  return null;
};

/**
 * POST /finance/fee-reminders/send
 * body: { student_ids: string[], message_template: string }
 * Variables in template: {parent_name}, {student_name}, {admission_no}, {balance}, {school_name}
 */
const sendFeeReminders = async (req, res) => {
  try {
    const schoolId = req.schoolId;
    const userId = req.user?.id || null;
    const { student_ids = [], message_template } = req.body || {};
    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ success: false, error: "student_ids required" });
    }
    if (!message_template || typeof message_template !== "string") {
      return res.status(400).json({ success: false, error: "message_template required" });
    }

    const school = await queryOne("SELECT name FROM schools WHERE id = ?", [schoolId]).catch(
      () => null,
    );
    const schoolName = school?.name || "School";

    // Pull balance + student info for all selected ids in one query
    const placeholders = student_ids.map(() => "?").join(",");
    const studentRows = await query(
      `SELECT s.id, s.full_name, s.first_name, s.last_name, s.admission_number,
              COALESCE(SUM(sf.amount_due - sf.amount_paid), 0) AS balance
         FROM students s
         LEFT JOIN student_fees sf
           ON sf.student_id = s.id
          AND sf.school_id = s.school_id
          AND sf.status NOT IN ('cancelled','waived')
        WHERE s.school_id = ? AND s.id IN (${placeholders})
        GROUP BY s.id`,
      [schoolId, ...student_ids],
    );

    const results = [];
    for (const stu of studentRows) {
      const recipient = await resolveRecipient(schoolId, stu.id);
      if (!recipient) {
        results.push({ student_id: stu.id, status: "skipped", reason: "no-recipient" });
        continue;
      }
      const studentName = stu.full_name || `${stu.first_name || ""} ${stu.last_name || ""}`.trim();
      const message = String(message_template)
        .replaceAll("{parent_name}", recipient.name)
        .replaceAll("{student_name}", studentName)
        .replaceAll("{admission_no}", stu.admission_number || "")
        .replaceAll("{balance}", formatKES(stu.balance))
        .replaceAll("{school_name}", schoolName);

      const out = await sendSMS(recipient.phone, message);
      try {
        await repo.createSmsLog({
          school_id: schoolId,
          recipient_type: "parent",
          recipient_id: recipient.parent_id,
          to_phone: recipient.phone,
          recipient_name: recipient.name,
          message,
          status: out.success ? "sent" : "failed",
          provider_response: out.success ? out.data : null,
          error_message: out.success
            ? null
            : typeof out.error === "string"
              ? out.error
              : JSON.stringify(out.error),
          sent_by: userId,
        });
      } catch (_) {
        /* ignore log errors */
      }
      results.push({
        student_id: stu.id,
        phone: recipient.phone,
        status: out.success ? "sent" : "failed",
        error: out.success ? null : out.error,
      });
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    return res.json({ success: true, data: { total: results.length, sent, failed, skipped, results } });
  } catch (err) {
    console.error("fee-reminders error", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { sendFeeReminders };
