// Lightweight, fail-soft notifier for staff onboarding credentials.
// Sends via Email (SMTP) and/or SMS (Africa's Talking-compatible HTTP),
// based on which env vars are configured. Never throws — onboarding
// must still succeed even if delivery fails; we log + return status.

const axios = require("axios");

const log = (...args) => console.log("[notifier]", ...args);

// ----- Email --------------------------------------------------------------
// Uses a generic HTTP relay (e.g. Mailgun/SendGrid/SMTP-bridge).
// Configure ONE of:
//   EMAIL_RELAY_URL  + EMAIL_RELAY_TOKEN  (custom HTTP relay accepting JSON)
//   SMTP_*           (future SMTP path — left as TODO)
async function sendEmail({ to, subject, text, html }) {
  if (!to) return { ok: false, skipped: "no-recipient" };
  // const url = process.env.EMAIL_RELAY_URL;
  // const token = process.env.EMAIL_RELAY_TOKEN;
  // const from = process.env.EMAIL_FROM || "no-reply@chuo.school";
  // if (!url) {
  //   log("email skipped: EMAIL_RELAY_URL not set", { to, subject });
  //   return { ok: false, skipped: "not-configured" };
  // }
  // try {
  //   await axios.post(
  //     url,
  //     { to, from, subject, text, html },
  //     {
  //       headers: token ? { Authorization: `Bearer ${token}` } : {},
  //       timeout: 8000,
  //     },
  //   );
  //   return { ok: true };
  // } catch (err) {
  //   log("email failed", err.message);
  //   return { ok: false, error: err.message };
  // }

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: "noreply@wikiteq.co.ke", name: "WikiTeq Solutions" },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
      },
    );
    console.log("Email sent:", response.data);
  } catch (error) {
    console.error(
      "Error sending email:",
      error.response?.data || error.message,
    );
  }
}

// ----- SMS ----------------------------------------------------------------
// Africa's Talking compatible REST call. Configure:
//   SMS_API_URL      e.g. https://api.africastalking.com/version1/messaging
//   SMS_API_KEY
//   SMS_USERNAME
//   SMS_SENDER_ID    (optional)
async function sendSms({ to, message }) {
  if (!to) return { ok: false, skipped: "no-recipient" };
  const url = process.env.SMS_API_URL;
  const apiKey = process.env.SMS_API_KEY;
  const username = process.env.SMS_USERNAME;
  if (!url || !apiKey || !username) {
    log("sms skipped: SMS_* env not configured", { to });
    return { ok: false, skipped: "not-configured" };
  }
  try {
    const params = new URLSearchParams({
      username,
      to,
      message,
    });
    if (process.env.SMS_SENDER_ID)
      params.append("from", process.env.SMS_SENDER_ID);
    await axios.post(url, params.toString(), {
      headers: {
        apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      timeout: 8000,
    });
    return { ok: true };
  } catch (err) {
    log("sms failed", err.response?.data || err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Send newly-created staff credentials via BOTH email + sms when available.
 * Returns { email, sms } each { ok, skipped?, error? }.
 */
async function sendStaffCredentials({
  name,
  email,
  phone,
  password,
  schoolName,
  loginUrl,
}) {
  const greeting = `Habari ${name},`;
  const intro = `Your ${schoolName || "Chuo"} staff account has been created.`;
  const creds = `Login email: ${email}\nTemporary password: ${password}`;
  const note = `You will be required to change your password on first login.`;
  const link = loginUrl ? `\nLogin: ${loginUrl}` : "";
  const text = `${greeting}\n\n${intro}\n\n${creds}\n${note}${link}`;
  const html = `<p>${greeting}</p><p>${intro}</p>
    <p><b>Login email:</b> ${email}<br/>
       <b>Temporary password:</b> <code>${password}</code></p>
    <p>${note}</p>${loginUrl ? `<p><a href="${loginUrl}">Login</a></p>` : ""}`;

  const [emailRes, smsRes] = await Promise.all([
    sendEmail({ to: email, subject: "Your Chuo staff account", text, html }),
    sendSms({
      to: phone,
      message: `${intro} Email: ${email} Password: ${password} (change on first login).`,
    }),
  ]);
  return { email: emailRes, sms: smsRes };
}

module.exports = { sendEmail, sendSms, sendStaffCredentials };
