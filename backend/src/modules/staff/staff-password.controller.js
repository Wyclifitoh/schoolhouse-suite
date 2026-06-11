/**
 * Staff password reset endpoint
 *   POST /staff/:id/reset-password
 *   body: { send?: "email" | "sms" | "both" | "none" }
 * Returns the freshly-generated password (plaintext) so admin can copy/
 * forward, and a delivery status when send !== "none".
 */
const bcrypt = require("bcrypt");
const { query, queryOne } = require("../../config/database");
const { generateTempPassword } = require("../../utils/credentials");
const { sendSMS } = require("../communication/sms.service");
const { sendEmail } = require("../../utils/notifier");

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

const resetStaffPassword = async (req, res) => {
  try {
    const schoolId = req.schoolId;
    const send = (req.body?.send || "both").toLowerCase();

    const staff = await queryOne(
      `SELECT s.id, s.first_name, s.last_name, s.email, s.phone, s.user_id,
              u.email AS user_email
         FROM staff s
         LEFT JOIN users u ON u.id = s.user_id
        WHERE s.id = ? AND s.school_id = ?`,
      [req.params.id, schoolId],
    );
    if (!staff) {
      return res.status(404).json({ success: false, error: "Staff not found" });
    }
    if (!staff.user_id) {
      return res
        .status(400)
        .json({ success: false, error: "Staff has no linked user account" });
    }

    const newPassword = generateTempPassword();
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query(
      "UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?",
      [hash, staff.user_id],
    );

    const fullName = `${staff.first_name || ""} ${staff.last_name || ""}`.trim();
    const loginUrl = process.env.LOGIN_URL || process.env.CORS_ORIGIN || "";
    const emailAddr = staff.user_email || staff.email;
    const text = `Habari ${fullName},\n\nYour password has been reset.\nLogin email: ${emailAddr}\nNew temporary password: ${newPassword}\nYou will be required to change it on first login.${loginUrl ? "\nLogin: " + loginUrl : ""}`;
    const html = `<p>Habari ${fullName},</p>
      <p>Your password has been reset.</p>
      <p><b>Login email:</b> ${emailAddr}<br/>
         <b>New temporary password:</b> <code>${newPassword}</code></p>
      <p>You will be required to change it on first login.</p>
      ${loginUrl ? `<p><a href="${loginUrl}">Login</a></p>` : ""}`;
    const sms = `Your password has been reset. Email: ${emailAddr} New password: ${newPassword} (change on first login).`;

    const delivery = { email: null, sms: null };
    if ((send === "email" || send === "both") && emailAddr) {
      try {
        await sendEmail({ to: emailAddr, subject: "Your password has been reset", text, html });
        delivery.email = { ok: true };
      } catch (e) {
        delivery.email = { ok: false, error: e.message };
      }
    }
    if ((send === "sms" || send === "both") && staff.phone) {
      const out = await sendSMS(staff.phone, sms);
      delivery.sms = { ok: !!out.success, error: out.error || null };
    }

    return res.json({
      success: true,
      data: {
        staff_id: staff.id,
        email: emailAddr,
        phone: staff.phone,
        new_password: newPassword,
        delivery,
      },
    });
  } catch (err) {
    console.error("reset-password error", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { resetStaffPassword };
