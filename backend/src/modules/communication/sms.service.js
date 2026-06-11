/**
 * SMS Service
 * Centralised helper used by ALL backend modules that need to send SMS.
 *
 * Required env:
 *   SMS_GATEWAY_URL   - full POST endpoint of the SMS gateway
 *   SMS_API_KEY       - bearer token
 *   SMS_PARTNER_ID    - partner identifier (X-Partner-ID)
 *   SMS_SHORTCODE     - sender shortcode
 */
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const log = (...args) => console.log("[sms]", ...args);

const sendSMS = async (phone, message) => {
  if (!phone) {
    return { success: false, error: "no-recipient" };
  }
  if (!process.env.SMS_GATEWAY_URL || !process.env.SMS_API_KEY) {
    log("skipped — SMS env not configured", { phone });
    return { success: false, error: "not-configured" };
  }
  try {
    const payload = {
      shortcode: process.env.SMS_SHORTCODE,
      phoneNumber: [phone],
      message,
    };
    const response = await axios.post(process.env.SMS_GATEWAY_URL, payload, {
      headers: {
        Authorization: `Bearer ${process.env.SMS_API_KEY}`,
        "X-Partner-ID": process.env.SMS_PARTNER_ID,
        "X-Idempotency-Key": uuidv4(),
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });
    log(`queued to ${phone}: ${String(message).substring(0, 50)}...`);
    return {
      success: true,
      jobId: response.data?.jobId,
      status: response.data?.status,
      summary: response.data?.summary,
      data: response.data,
    };
  } catch (error) {
    log(`failed to ${phone}:`, error.message);
    return {
      success: false,
      error:
        error.response?.data?.message || error.message || "Unknown SMS error",
      details: error.response?.data || null,
    };
  }
};

module.exports = { sendSMS };
