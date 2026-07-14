const axios = require("axios");
const hub = require("./hub.repository");
const svc = require("./communication.service");
const { sendEmail } = require("./email.service");
const { success, error } = require("../../utils/response");

const schoolOf = (req) => req.schoolId || req.headers["x-school-id"];

/* --------------- SMS balance (proxy w/ 60s cache) --------------- */
let balanceCache = { at: 0, value: null };
const smsBalance = async (req, res) => {
  try {
    const force = req.query.refresh === "1";
    const fresh = Date.now() - balanceCache.at < 60_000;
    if (!force && fresh && balanceCache.value != null) {
      return success(res, { balance: balanceCache.value, cached: true });
    }
    const userId = process.env.SMS_BALANCE_USER_ID || "1";
    const url = process.env.SMS_BALANCE_URL
      || `https://wikiteq.co.ke/api/sms/balance?userId=${userId}`;
    const r = await axios.get(url, { timeout: 8000 });
    const balance = r.data?.balance ?? r.data?.data?.balance ?? null;
    balanceCache = { at: Date.now(), value: balance };
    return success(res, { balance, cached: false });
  } catch (e) {
    return error(res, e.message || "Failed to fetch balance", 500);
  }
};

/* --------------- Dashboard --------------- */
const dashboard = async (req, res) => {
  try { return success(res, await hub.dashboardStats(schoolOf(req))); }
  catch (e) { return error(res, e.message, 500); }
};

/* --------------- Campaigns --------------- */
const listCampaigns = async (req, res) => {
  try { return success(res, await hub.listCampaigns(schoolOf(req), req.query)); }
  catch (e) { return error(res, e.message, 500); }
};
const getCampaign = async (req, res) => {
  try {
    const row = await hub.getCampaign(schoolOf(req), req.params.id);
    if (!row) return error(res, "Campaign not found", 404);
    return success(res, row);
  } catch (e) { return error(res, e.message, 500); }
};
const createCampaign = async (req, res) => {
  try {
    if (!req.body?.name || !req.body?.body) return error(res, "name and body are required", 400);
    return success(res, await hub.createCampaign(schoolOf(req), req.body, req.user?.id), 201);
  } catch (e) { return error(res, e.message, 500); }
};
const updateCampaign = async (req, res) => {
  try { return success(res, await hub.updateCampaign(schoolOf(req), req.params.id, req.body)); }
  catch (e) { return error(res, e.message, 500); }
};
const deleteCampaign = async (req, res) => {
  try {
    await hub.deleteCampaign(schoolOf(req), req.params.id);
    return success(res, { id: req.params.id });
  } catch (e) { return error(res, e.message, 500); }
};
const duplicateCampaign = async (req, res) => {
  try {
    const c = await hub.getCampaign(schoolOf(req), req.params.id);
    if (!c) return error(res, "Campaign not found", 404);
    const copy = await hub.createCampaign(
      schoolOf(req),
      { ...c, name: `${c.name} (copy)`, status: "draft", scheduled_at: null,
        audience: c.audience, template_id: c.template_id },
      req.user?.id,
    );
    return success(res, copy, 201);
  } catch (e) { return error(res, e.message, 500); }
};
const sendCampaign = async (req, res) => {
  try {
    const schoolId = schoolOf(req);
    const c = await hub.getCampaign(schoolId, req.params.id);
    if (!c) return error(res, "Campaign not found", 404);
    await hub.updateCampaign(schoolId, c.id, { status: "running", started_at: new Date() });
    const audience = typeof c.audience === "string" ? JSON.parse(c.audience) : c.audience;
    let smsRes = null, emailRes = null;
    if (c.channel === "sms" || c.channel === "both") {
      smsRes = await svc.sendSmsBatch(schoolId, { audience, message: c.body }, req.user?.id);
    }
    if (c.channel === "email" || c.channel === "both") {
      emailRes = await svc.sendEmailBatch(
        schoolId,
        { audience, subject: c.subject || c.name, body: c.body },
        req.user?.id,
      );
    }
    const stats = {
      total: (smsRes?.total || 0) + (emailRes?.total || 0),
      sent: (smsRes?.sent || 0) + (emailRes?.sent || 0),
      failed: (smsRes?.failed || 0) + (emailRes?.failed || 0),
    };
    const updated = await hub.updateCampaign(schoolId, c.id, {
      status: "completed", completed_at: new Date(), stats,
    });
    return success(res, updated);
  } catch (e) { return error(res, e.message, 500); }
};

/* --------------- Scheduled --------------- */
const listScheduled = async (req, res) => {
  try { return success(res, await hub.listScheduled(schoolOf(req), req.query)); }
  catch (e) { return error(res, e.message, 500); }
};
const createScheduled = async (req, res) => {
  try {
    if (!req.body?.body || !req.body?.scheduled_at)
      return error(res, "body and scheduled_at are required", 400);
    return success(res, await hub.createScheduled(schoolOf(req), req.body, req.user?.id), 201);
  } catch (e) { return error(res, e.message, 500); }
};
const updateScheduled = async (req, res) => {
  try { return success(res, await hub.updateScheduled(schoolOf(req), req.params.id, req.body)); }
  catch (e) { return error(res, e.message, 500); }
};
const cancelScheduled = async (req, res) => {
  try {
    return success(res, await hub.updateScheduled(schoolOf(req), req.params.id, { status: "cancelled" }));
  } catch (e) { return error(res, e.message, 500); }
};
const deleteScheduled = async (req, res) => {
  try {
    await hub.deleteScheduled(schoolOf(req), req.params.id);
    return success(res, { id: req.params.id });
  } catch (e) { return error(res, e.message, 500); }
};

/* --------------- Automations --------------- */
const listAutomations = async (req, res) => {
  try { return success(res, await hub.listAutomations(schoolOf(req))); }
  catch (e) { return error(res, e.message, 500); }
};
const updateAutomation = async (req, res) => {
  try {
    return success(res, await hub.upsertAutomation(schoolOf(req), req.params.triggerKey, req.body));
  } catch (e) { return error(res, e.message, 500); }
};

/* --------------- Settings --------------- */
const getSettings = async (req, res) => {
  try { return success(res, await hub.getSettings(schoolOf(req))); }
  catch (e) { return error(res, e.message, 500); }
};
const saveSettings = async (req, res) => {
  try { return success(res, await hub.saveSettings(schoolOf(req), req.body)); }
  catch (e) { return error(res, e.message, 500); }
};
const testEmail = async (req, res) => {
  try {
    const { to, subject, body } = req.body || {};
    if (!to) return error(res, "to is required", 400);
    const r = await sendEmail({
      to, subject: subject || "CHUO Communication Test",
      htmlContent: body || "<p>This is a test email from your CHUO Communication settings.</p>",
    });
    if (!r.success) return error(res, typeof r.error === "string" ? r.error : "Email send failed", 500);
    return success(res, { ok: true });
  } catch (e) { return error(res, e.message, 500); }
};

/* --------------- History --------------- */
const history = async (req, res) => {
  try {
    const { channel, status, search } = req.query;
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const offset = parseInt(req.query.offset) || 0;
    const { rows, total } = await hub.listHistory(schoolOf(req), { channel, status, search, limit, offset });
    return success(res, { rows, total, limit, offset });
  } catch (e) { return error(res, e.message, 500); }
};
const retryMessage = async (req, res) => {
  try {
    const schoolId = schoolOf(req);
    const { kind, id } = req.params;
    if (kind === "sms") {
      const { queryOne } = require("../../config/database");
      const row = await queryOne("SELECT * FROM sms_messages WHERE id = ? AND school_id = ?", [id, schoolId]);
      if (!row) return error(res, "Message not found", 404);
      const r = await svc.sendSmsBatch(schoolId, {
        audience: { type: "custom", custom: [{ name: row.recipient_name, phone: row.to_phone }] },
        message: row.message,
      }, req.user?.id);
      return success(res, r);
    }
    if (kind === "email") {
      const { queryOne } = require("../../config/database");
      const row = await queryOne("SELECT * FROM email_messages WHERE id = ? AND school_id = ?", [id, schoolId]);
      if (!row) return error(res, "Message not found", 404);
      const r = await svc.sendEmailBatch(schoolId, {
        audience: { type: "custom", custom: [{ name: row.recipient_name, email: row.to_email }] },
        subject: row.subject, body: row.body,
      }, req.user?.id);
      return success(res, r);
    }
    return error(res, "Unknown kind", 400);
  } catch (e) { return error(res, e.message, 500); }
};

module.exports = {
  smsBalance, dashboard,
  listCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign, duplicateCampaign, sendCampaign,
  listScheduled, createScheduled, updateScheduled, cancelScheduled, deleteScheduled,
  listAutomations, updateAutomation,
  getSettings, saveSettings, testEmail,
  history, retryMessage,
};