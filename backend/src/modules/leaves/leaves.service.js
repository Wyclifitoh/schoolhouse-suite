const repo = require("./leaves.repository");

const listLeaveTypes = (schoolId) => repo.findAllTypes(schoolId);
const createType = (data) => repo.createType(data);

const listApplications = (schoolId, pagination) =>
  repo.findAllApplications(schoolId, pagination);

const applyForLeave = async (data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Balance check
  const year = start.getFullYear();
  const remaining = await repo.getRemainingDays(
    data.staff_id,
    data.leave_type_id,
    year,
  );
  if (diffDays > remaining) {
    const err = new Error(
      `Insufficient leave balance. Requested ${diffDays} day(s), only ${remaining} remaining.`,
    );
    err.status = 400;
    throw err;
  }
  return repo.createApplication({ ...data, total_days: diffDays });
};

const updateLeaveStatus = async (id, data) => {
  const app = await repo.findApplicationById(id);
  if (!app)
    throw Object.assign(new Error("Leave application not found"), {
      status: 404,
    });

  const prevStatus = app.status;
  const result = await repo.updateApplicationStatus(id, data);

  const year = new Date(app.start_date).getFullYear();
  // Approve: deduct. Reverse if previously approved and now rejected/cancelled.
  if (data.status === "approved" && prevStatus !== "approved") {
    await repo.adjustUsedDays(
      app.staff_id,
      app.leave_type_id,
      year,
      app.total_days,
    );
  } else if (prevStatus === "approved" && data.status !== "approved") {
    await repo.adjustUsedDays(
      app.staff_id,
      app.leave_type_id,
      year,
      -app.total_days,
    );
  }
  return result;
};

const listBalances = (schoolId, { staff_id, year }) =>
  repo.findBalances(schoolId, staff_id, year);

const setBalance = (data) => repo.upsertBalance(data);

module.exports = {
  listLeaveTypes,
  createType,
  listApplications,
  applyForLeave,
  updateLeaveStatus,
  listBalances,
  setBalance,
};
