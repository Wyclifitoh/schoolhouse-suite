const axios = require("axios");

/**
 * Send transactional email via Brevo (Sendinblue) v3 API.
 * Required env: BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME (optional)
 */
const sendEmail = async ({ to, subject, htmlContent, textContent, recipientName }) => {
  try {
    const payload = {
      sender: {
        name: process.env.BREVO_SENDER_NAME || "School",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to, name: recipientName || to }],
      subject,
      htmlContent: htmlContent || `<p>${textContent || ""}</p>`,
      textContent: textContent || undefined,
    };
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      payload,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        timeout: 20000,
      },
    );
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error?.response?.data || error?.message || "Email send failed",
    };
  }
};

module.exports = { sendEmail };
