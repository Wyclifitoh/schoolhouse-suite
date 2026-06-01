const svc = require("./timetable.service");
const { success, error } = require("../../utils/response");

const wrap = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    return success(res, data);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.listPeriods = wrap((req) => svc.listPeriods(req.schoolId));
exports.createPeriod = wrap((req) =>
  svc.createPeriod({ ...req.body, school_id: req.schoolId }),
);
exports.updatePeriod = wrap((req) =>
  svc.updatePeriod(req.params.id, req.schoolId, req.body),
);
exports.deletePeriod = wrap((req) =>
  svc.deletePeriod(req.params.id, req.schoolId),
);

exports.listRequirements = wrap((req) =>
  svc.listRequirements(req.schoolId, req.query.grade_id),
);
exports.upsertRequirement = wrap((req) =>
  svc.upsertRequirement({ ...req.body, school_id: req.schoolId }),
);
exports.bulkUpsertRequirements = wrap((req) =>
  svc.bulkUpsertRequirements(req.schoolId, req.body.items || []),
);
exports.deleteRequirement = wrap((req) =>
  svc.deleteRequirement(req.params.id, req.schoolId),
);

exports.listEntries = wrap((req) => svc.listEntries(req.schoolId, req.query));
exports.clearEntries = wrap((req) =>
  svc.clearForStreams(req.schoolId, req.body.stream_ids || []),
);
exports.detectClashes = wrap((req) => svc.detectClashes(req.schoolId));

exports.generate = wrap((req) =>
  svc.generateTimetable(req.schoolId, {
    gradeIds: req.body.grade_ids || [],
    days: req.body.days,
    replace: req.body.replace !== false,
  }),
);
