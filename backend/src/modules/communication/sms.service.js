const axios = require("axios");

/**
 * Send SMS via wikiteq gateway.
 * Required env: SMS_API_KEY, SMS_PARTNER_ID, SMS_SHORTCODE, SMS_GATEWAY_URL
 */
const sendSMS = async (phoneNumber, message, userId = "1") => {
  try {
    const payload = {
      apikey: process.env.SMS_API_KEY,
      partnerID: process.env.SMS_PARTNER_ID || "13491",
      message,
      shortcode: process.env.SMS_SHORTCODE || "SIMU L LTD",
      userId,
      phoneNumber,
    };
    const response = await axios.post(
      process.env.SMS_GATEWAY_URL || "https://wikiteq.co.ke/api/sms/send-sms",
      payload,
      { headers: { "Content-Type": "application/json" }, timeout: 15000 },
    );
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error?.response?.data || error?.message || "SMS send failed",
    };
  }
};

module.exports = { sendSMS };
