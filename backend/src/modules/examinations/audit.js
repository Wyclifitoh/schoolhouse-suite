const { query, queryOne, execute } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

/**
 * Centralised audit writer for exam-marks mutations.
 * Every CREATE/UPDATE/SUBMIT/APPROVE/LOCK/UNLOCK/DELETE must call this.
 */
const writeAudit = async ({
  examMarkId,
  examId = null,
  studentId = null,
  action,
  oldValue = null,
  newValue = null,
  actorId = null,
  actorRole = null,
  reason = null,
}) => {
  await execute(
    `INSERT INTO exam_marks_audit
     (id, exam_mark_id, exam_id, student_id, action, old_value, new_value, actor_id, actor_role, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      examMarkId,
      examId,
      studentId,
      action,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      actorId,
      actorRole,
      reason,
    ],
  );
};

const listAuditForMark = (markId) =>
  query(
    `SELECT * FROM exam_marks_audit WHERE exam_mark_id = ? ORDER BY at DESC`,
    [markId],
  );

const listAuditForExam = (examId, limit = 500) =>
  query(
    `SELECT a.*, s.first_name, s.last_name
     FROM exam_marks_audit a
     LEFT JOIN students s ON s.id = a.student_id
     WHERE a.exam_id = ?
     ORDER BY a.at DESC
     LIMIT ?`,
    [examId, limit],
  );

module.exports = { writeAudit, listAuditForMark, listAuditForExam };
