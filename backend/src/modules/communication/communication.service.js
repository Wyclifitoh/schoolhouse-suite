const repo = require("./communication.repository");
const { sendSMS } = require("./sms.service");
const { sendEmail } = require("./email.service");

/* Resolve audience -> array of {id, type, name, phone, email} */
const resolveRecipients = async (schoolId, audience) => {
  // audience: { type: 'parents'|'teachers'|'staff'|'custom', relationship?: 'father'|'mother'|'guardian'|'all', custom?: [{name,phone,email}] }
  if (audience.type === "custom") {
    return (audience.custom || []).map((c) => ({
      id: null,
      type: "custom",
      name: c.name || c.phone || c.email || "Custom",
      phone: c.phone || null,
      email: c.email || null,
    }));
  }
  if (audience.type === "parents") {
    const parents = await repo.getParentContacts(schoolId, audience.relationship || "all");
    return parents.map((p) => ({
      id: p.id,
      type: `parent_${p.relationship}`,
      name: `${p.first_name} ${p.last_name}`.trim(),
      phone: p.phone,
      email: p.email,
    }));
  }
  if (audience.type === "teachers") {
    const teachers = await repo.getTeacherContacts(schoolId);
    return teachers.map((t) => ({
      id: t.id,
      type: "teacher",
      name: `${t.first_name} ${t.last_name}`.trim(),
      phone: t.phone,
      email: t.email,
    }));
  }
  if (audience.type === "staff") {
    const staff = await repo.getStaffContacts(schoolId);
    return staff.map((s) => ({
      id: s.id,
      type: `staff_${s.role}`,
      name: `${s.first_name} ${s.last_name}`.trim(),
      phone: s.phone,
      email: s.email,
    }));
  }
  return [];
};

const sendSmsBatch = async (schoolId, { audience, message }, userId) => {
  if (!message || !message.trim()) {
    throw Object.assign(new Error("Message is required"), { statusCode: 400 });
  }
  const recipients = await resolveRecipients(schoolId, audience);
  const results = [];
  for (const r of recipients) {
    if (!r.phone) {
      results.push({ ...r, status: "failed", error: "No phone number" });
      await repo.createSmsLog({
        school_id: schoolId,
        recipient_type: r.type,
        recipient_id: r.id,
        to_phone: r.phone || "(none)",
        recipient_name: r.name,
        message,
        status: "failed",
        error_message: "No phone number",
        sent_by: userId,
      });
      continue;
    }
    const res = await sendSMS(r.phone, message, String(userId || "1"));
    const log = await repo.createSmsLog({
      school_id: schoolId,
      recipient_type: r.type,
      recipient_id: r.id,
      to_phone: r.phone,
      recipient_name: r.name,
      message,
      status: res.success ? "sent" : "failed",
      provider_response: res.success ? res.data : null,
      error_message: res.success ? null : (typeof res.error === "string" ? res.error : JSON.stringify(res.error)),
      sent_by: userId,
    });
    results.push({ ...r, status: res.success ? "sent" : "failed", log_id: log.id });
  }
  const sent = results.filter((r) => r.status === "sent").length;
  return { total: results.length, sent, failed: results.length - sent, results };
};

const sendEmailBatch = async (schoolId, { audience, subject, body }, userId) => {
  if (!subject || !body) {
    throw Object.assign(new Error("Subject and body are required"), { statusCode: 400 });
  }
  const recipients = await resolveRecipients(schoolId, audience);
  const results = [];
  for (const r of recipients) {
    if (!r.email) {
      results.push({ ...r, status: "failed", error: "No email address" });
      await repo.createEmailLog({
        school_id: schoolId,
        recipient_type: r.type,
        recipient_id: r.id,
        to_email: r.email || "(none)",
        recipient_name: r.name,
        subject,
        body,
        status: "failed",
        error_message: "No email address",
        sent_by: userId,
      });
      continue;
    }
    const res = await sendEmail({
      to: r.email,
      subject,
      htmlContent: body,
      recipientName: r.name,
    });
    const log = await repo.createEmailLog({
      school_id: schoolId,
      recipient_type: r.type,
      recipient_id: r.id,
      to_email: r.email,
      recipient_name: r.name,
      subject,
      body,
      status: res.success ? "sent" : "failed",
      provider_response: res.success ? res.data : null,
      error_message: res.success ? null : (typeof res.error === "string" ? res.error : JSON.stringify(res.error)),
      sent_by: userId,
    });
    results.push({ ...r, status: res.success ? "sent" : "failed", log_id: log.id });
  }
  const sent = results.filter((r) => r.status === "sent").length;
  return { total: results.length, sent, failed: results.length - sent, results };
};

module.exports = {
  resolveRecipients,
  sendSmsBatch,
  sendEmailBatch,
  listSms: repo.listSms,
  listEmail: repo.listEmail,
};
