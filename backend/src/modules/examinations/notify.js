/**
 * Phase 7 — SMS notification hook.
 * Fired after a successful APPROVED lifecycle transition: notifies each
 * affected student's primary parent (best-effort, never blocks the txn).
 */
const { query } = require("../../config/database");
const { sendSMS } = require("../communication/sms.service");

const notifyExamApproved = async (schoolId, examId) => {
  try {
    const rows = await query(
      `SELECT DISTINCT p.phone, p.first_name AS parent_first,
              s.first_name AS student_first, s.last_name AS student_last,
              e.name AS exam_name
       FROM exam_marks m
       JOIN students s ON s.id = m.student_id
       JOIN student_parents sp ON sp.student_id = s.id
       JOIN parents p ON p.id = sp.parent_id
       JOIN exams e ON e.id = m.exam_id
       WHERE m.school_id = ? AND m.exam_id = ? AND p.phone IS NOT NULL`,
      [schoolId, examId],
    );
    const results = [];
    for (const r of rows) {
      const msg = `Hello ${r.parent_first || ""}, results for ${r.student_first} ${r.student_last} (${r.exam_name}) are now available on the parent portal.`;
      const out = await sendSMS(r.phone, msg);
      results.push({ phone: r.phone, ok: out.success });
    }
    return { notified: results.length, results };
  } catch (e) {
    return { notified: 0, error: e.message };
  }
};

module.exports = { notifyExamApproved };
