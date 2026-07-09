const repo = require("./platform.repository");
const svc = require("./platform.service");
const billingRepo = require("../billing/billing.repository");
const { success, error } = require("../../utils/response");

const wrap = (fn) => async (req, res) => {
  try { const out = await fn(req, res); if (out !== undefined) return success(res, out); }
  catch (e) { return error(res, e.message, e.status || 500); }
};

module.exports = {
  // Auth
  login: wrap(async (req) => svc.login(req.body.email, req.body.password)),
  me: wrap(async (req) => req.platformUser),

  // Overview
  overview: wrap(async () => repo.overviewStats()),

  // Schools
  listSchools: wrap(async (req) => repo.listSchoolsWithStats({ search: req.query.search, status: req.query.status })),

  createSchool: wrap(async (req) => svc.createSchool(req.body, req.platformUser)),

  schoolDetail: wrap(async (req) => {
    const d = await repo.schoolDetail(req.params.id);
    if (!d) { const e = new Error("School not found"); e.status = 404; throw e; }
    return d;
  }),

  extendTrial: wrap(async (req) => svc.extendTrial(req.params.id, req.body.days || 7, req.platformUser)),
  terminateTrial: wrap(async (req) => svc.terminateTrial(req.params.id, req.platformUser)),
  setStatus: wrap(async (req) => svc.setStatus(req.params.id, req.body.status, req.platformUser)),
  setSchoolActive: wrap(async (req) => svc.setSchoolActive(req.params.id, !!req.body.active, req.platformUser)),
  activateSubscription: wrap(async (req) => svc.activateSubscription(req.params.id, req.body, req.platformUser)),

  // Assessment billing (per-exam, KSH 10/student)
  listAssessmentBilling: wrap(async (req) => billingRepo.listAssessmentBilling(req.params.id)),

  markAssessmentBillingPaid: wrap(async (req) => {
    const result = await billingRepo.markAssessmentPaid(req.params.id, req.body.assessment_id || null);
    await repo.writeAudit({
      actor_id: req.platformUser.id,
      actor_email: req.platformUser.email,
      action: "assessment_billing.mark_paid",
      target_school_id: req.params.id,
      payload: { assessment_id: req.body.assessment_id || null },
    });
    return result;
  }),

  getBillingStatus: wrap(async (req) => {
    const gate = await billingRepo.checkAssessmentAllowed(req.params.id);
    const balance = await billingRepo.getOutstandingBalance(req.params.id);
    const sub = await billingRepo.findSubscription(req.params.id);
    return { gate, balance, subscription: sub };
  }),

  // Billing
  listSubscriptions: wrap(async (req) => repo.listAllSubscriptions({ status: req.query.status })),
  listInvoices: wrap(async (req) => repo.listAllInvoices({ status: req.query.status })),
  revenueByMonth: wrap(async () => repo.revenueByMonth()),
  createInvoice: wrap(async (req) => svc.createManualInvoice(req.params.id, req.body, req.platformUser)),
  confirmInvoice: wrap(async (req) => svc.confirmInvoice(req.params.invoiceId, req.body, req.platformUser)),
  voidInvoice: wrap(async (req) => svc.voidInvoice(req.params.invoiceId, req.platformUser)),

  // Plans
  listPlans: wrap(async () => repo.listPlans()),
  createPlan: wrap(async (req) => repo.createPlan(req.body)),
  updatePlan: wrap(async (req) => repo.updatePlan(req.params.id, req.body)),
  deletePlan: wrap(async (req) => repo.deletePlan(req.params.id)),

  // Users (cross-school)
  searchUsers: wrap(async (req) => repo.searchAllUsers(req.query.q || "")),
  setUserActive: wrap(async (req) => { await repo.setUserActive(req.params.id, !!req.body.active); return { ok: true }; }),
  resetUserPassword: wrap(async (req) => svc.resetUserPassword(req.params.id, req.body.password, req.platformUser)),

  // Platform staff
  listStaff: wrap(async () => repo.listPlatformUsers()),
  createStaff: wrap(async (req) => svc.createStaff(req.body, req.platformUser)),
  setStaffActive: wrap(async (req) => { await repo.setPlatformUserActive(req.params.id, !!req.body.active); return { ok: true }; }),

  // Audit
  audit: wrap(async (req) => repo.listAudit(req.query.limit || 200)),
};