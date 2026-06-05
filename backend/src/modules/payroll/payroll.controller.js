const repo = require("./payroll.repository");
const { success, error } = require("../../utils/response");

const schoolOf = (req) => req.schoolId || req.headers["x-school-id"];
const wrap = (fn) => async (req, res) => {
  try { return success(res, await fn(req)); }
  catch (err) { return error(res, err.message, 400); }
};

module.exports = {
  // periods
  createPeriod: wrap((req) => repo.createPeriod({ ...req.body, school_id: schoolOf(req) })),
  listPeriods : wrap((req) => repo.listPeriods(schoolOf(req))),
  getPeriod   : wrap((req) => repo.getPeriod(req.params.id, schoolOf(req))),
  runPeriod   : wrap((req) => repo.runPeriod(req.params.id, schoolOf(req))),
  approvePeriod: wrap((req) => repo.approvePeriod(req.params.id, schoolOf(req), req.user.id)),
  markPaid    : wrap((req) => repo.markPaid(req.params.id, schoolOf(req))),
  listRuns    : wrap((req) => repo.listRuns(req.params.id, schoolOf(req))),

  // allowances
  upsertAllowance: wrap((req) =>
    repo.upsertAllowance({ ...req.body, school_id: schoolOf(req) })),
  listAllowances : wrap((req) =>
    repo.listAllowances(schoolOf(req), req.params.staffId)),

  // deductions
  upsertDeduction: wrap((req) =>
    repo.upsertDeduction({ ...req.body, school_id: schoolOf(req) })),
  listDeductions : wrap((req) =>
    repo.listDeductions(schoolOf(req), req.params.staffId)),
};
