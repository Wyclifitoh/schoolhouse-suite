const router = require("express").Router();
const repo = require("./clubs.repository");
const { success, error } = require("../../utils/response");

const handle = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (err) {
    console.error("[clubs]", err);
    return error(res, err.message, err.statusCode || 500);
  }
};

// Reports
router.get(
  "/reports/summary",
  handle(async (req, res) =>
    success(res, await repo.reportsSummary(req.schoolId)),
  ),
);

// Unassigned students helper
router.get(
  "/students/unassigned",
  handle(async (req, res) =>
    success(
      res,
      await repo.listUnassignedStudents(req.schoolId, req.query.search || ""),
    ),
  ),
);

// Clubs
router.get(
  "/",
  handle(async (req, res) =>
    success(res, await repo.listClubs(req.schoolId, req.query)),
  ),
);
router.post(
  "/",
  handle(async (req, res) =>
    success(
      res,
      await repo.createClub({
        ...req.body,
        school_id: req.schoolId,
        created_by: req.user?.id || null,
      }),
      201,
    ),
  ),
);
router.get(
  "/:id",
  handle(async (req, res) =>
    success(res, await repo.getClub(req.params.id, req.schoolId)),
  ),
);
router.put(
  "/:id",
  handle(async (req, res) =>
    success(res, await repo.updateClub(req.params.id, req.schoolId, req.body)),
  ),
);
router.delete(
  "/:id",
  handle(async (req, res) =>
    success(res, await repo.deleteClub(req.params.id, req.schoolId)),
  ),
);

// Members
router.get(
  "/:id/members",
  handle(async (req, res) =>
    success(res, await repo.listMembers(req.params.id, req.schoolId)),
  ),
);
router.post(
  "/:id/members",
  handle(async (req, res) => {
    if (Array.isArray(req.body.student_ids)) {
      return success(
        res,
        await repo.addMembersBulk(
          req.params.id,
          req.schoolId,
          req.body.student_ids,
        ),
        201,
      );
    }
    return success(
      res,
      await repo.addMember(req.params.id, req.schoolId, req.body),
      201,
    );
  }),
);
router.delete(
  "/:id/members/:studentId",
  handle(async (req, res) =>
    success(
      res,
      await repo.removeMember(
        req.params.id,
        req.schoolId,
        req.params.studentId,
      ),
    ),
  ),
);
router.put(
  "/:id/leader",
  handle(async (req, res) =>
    success(
      res,
      await repo.setStudentLeader(
        req.params.id,
        req.schoolId,
        req.body.student_id,
      ),
    ),
  ),
);

// Meetings
router.get(
  "/:id/meetings",
  handle(async (req, res) =>
    success(res, await repo.listMeetings(req.params.id, req.schoolId)),
  ),
);
router.post(
  "/:id/meetings",
  handle(async (req, res) =>
    success(
      res,
      await repo.createMeeting(req.params.id, req.schoolId, {
        ...req.body,
        created_by: req.user?.id,
      }),
      201,
    ),
  ),
);
router.put(
  "/meetings/:meetingId",
  handle(async (req, res) =>
    success(
      res,
      await repo.updateMeeting(req.params.meetingId, req.schoolId, req.body),
    ),
  ),
);
router.delete(
  "/meetings/:meetingId",
  handle(async (req, res) =>
    success(
      res,
      await repo.deleteMeeting(req.params.meetingId, req.schoolId),
    ),
  ),
);

// Attendance
router.get(
  "/meetings/:meetingId/attendance",
  handle(async (req, res) =>
    success(
      res,
      await repo.listAttendance(req.params.meetingId, req.schoolId),
    ),
  ),
);
router.post(
  "/meetings/:meetingId/attendance",
  handle(async (req, res) =>
    success(
      res,
      await repo.bulkSaveAttendance(
        req.params.meetingId,
        req.schoolId,
        req.body.records || [],
      ),
    ),
  ),
);

// Achievements
router.get(
  "/:id/achievements",
  handle(async (req, res) =>
    success(res, await repo.listAchievements(req.params.id, req.schoolId)),
  ),
);
router.post(
  "/:id/achievements",
  handle(async (req, res) =>
    success(
      res,
      await repo.createAchievement(req.params.id, req.schoolId, req.body),
      201,
    ),
  ),
);
router.put(
  "/achievements/:achievementId",
  handle(async (req, res) =>
    success(
      res,
      await repo.updateAchievement(
        req.params.achievementId,
        req.schoolId,
        req.body,
      ),
    ),
  ),
);
router.delete(
  "/achievements/:achievementId",
  handle(async (req, res) =>
    success(
      res,
      await repo.deleteAchievement(req.params.achievementId, req.schoolId),
    ),
  ),
);

module.exports = router;
