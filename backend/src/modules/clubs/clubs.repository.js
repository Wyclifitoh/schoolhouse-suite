const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

// ---------- Clubs ----------
const listClubs = async (schoolId, filters = {}) => {
  let sql = `SELECT c.*,
       CONCAT(IFNULL(s.first_name,''),' ',IFNULL(s.last_name,'')) AS patron_name,
       CONCAT(IFNULL(st.first_name,''),' ',IFNULL(st.last_name,'')) AS student_leader_name,
       (SELECT COUNT(*) FROM club_members cm WHERE cm.club_id = c.id AND cm.status='active') AS member_count
     FROM clubs c
     LEFT JOIN staff s ON s.id = c.patron_staff_id
     LEFT JOIN students st ON st.id = c.student_leader_id
     WHERE c.school_id = ?`;
  const params = [schoolId];
  if (filters.status) {
    sql += " AND c.status = ?";
    params.push(filters.status);
  }
  if (filters.search) {
    sql += " AND (c.name LIKE ? OR c.category LIKE ?)";
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  sql += " ORDER BY c.name ASC";
  return query(sql, params);
};

const getClub = async (id, schoolId) => {
  return queryOne(
    `SELECT c.*,
       CONCAT(IFNULL(s.first_name,''),' ',IFNULL(s.last_name,'')) AS patron_name,
       CONCAT(IFNULL(st.first_name,''),' ',IFNULL(st.last_name,'')) AS student_leader_name
     FROM clubs c
     LEFT JOIN staff s ON s.id = c.patron_staff_id
     LEFT JOIN students st ON st.id = c.student_leader_id
     WHERE c.id = ? AND c.school_id = ?`,
    [id, schoolId],
  );
};

const createClub = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO clubs
       (id, school_id, name, category, description, patron_staff_id, student_leader_id,
        meeting_day, meeting_time, meeting_venue, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.name,
      data.category || null,
      data.description || null,
      data.patron_staff_id || null,
      data.student_leader_id || null,
      data.meeting_day || null,
      data.meeting_time || null,
      data.meeting_venue || null,
      data.status || "active",
      data.created_by || null,
    ],
  );
  return getClub(id, data.school_id);
};

const updateClub = async (id, schoolId, data) => {
  const allowed = [
    "name",
    "category",
    "description",
    "patron_staff_id",
    "student_leader_id",
    "meeting_day",
    "meeting_time",
    "meeting_venue",
    "status",
  ];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (entries.length === 0) return getClub(id, schoolId);
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  values.push(id, schoolId);
  await query(
    `UPDATE clubs SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    values,
  );
  return getClub(id, schoolId);
};

const deleteClub = async (id, schoolId) => {
  await query("DELETE FROM clubs WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
  return { deleted: true };
};

// ---------- Members ----------
const listMembers = async (clubId, schoolId) => {
  return query(
    `SELECT cm.*, s.admission_number, s.first_name, s.last_name, s.full_name,
            g.name AS grade_name, st.name AS stream_name
     FROM club_members cm
     JOIN students s ON s.id = cm.student_id
     LEFT JOIN grades g ON g.id = s.current_grade_id
     LEFT JOIN streams st ON st.id = s.current_stream_id
     WHERE cm.club_id = ? AND cm.school_id = ?
     ORDER BY s.first_name ASC`,
    [clubId, schoolId],
  );
};

const addMember = async (clubId, schoolId, { student_id, role }) => {
  // verify student not already in any club
  const existing = await queryOne(
    "SELECT id, club_id FROM club_members WHERE student_id = ? AND school_id = ?",
    [student_id, schoolId],
  );
  if (existing) {
    const err = new Error("Student already belongs to a club");
    err.statusCode = 400;
    throw err;
  }
  const id = uuidv4();
  await query(
    `INSERT INTO club_members (id, club_id, student_id, school_id, role)
     VALUES (?, ?, ?, ?, ?)`,
    [id, clubId, student_id, schoolId, role || "member"],
  );
  return queryOne("SELECT * FROM club_members WHERE id = ?", [id]);
};

const addMembersBulk = async (clubId, schoolId, studentIds = []) => {
  const added = [];
  const skipped = [];
  for (const sid of studentIds) {
    try {
      const r = await addMember(clubId, schoolId, { student_id: sid });
      added.push(r);
    } catch (e) {
      skipped.push({ student_id: sid, reason: e.message });
    }
  }
  return { added, skipped };
};

const removeMember = async (clubId, schoolId, studentId) => {
  await query(
    "DELETE FROM club_members WHERE club_id = ? AND student_id = ? AND school_id = ?",
    [clubId, studentId, schoolId],
  );
  // also unset student leader if this was them
  await query(
    "UPDATE clubs SET student_leader_id = NULL WHERE id = ? AND student_leader_id = ?",
    [clubId, studentId],
  );
  return { deleted: true };
};

const setStudentLeader = async (clubId, schoolId, studentId) => {
  // ensure they are a member
  const m = await queryOne(
    "SELECT id FROM club_members WHERE club_id = ? AND student_id = ? AND school_id = ?",
    [clubId, studentId, schoolId],
  );
  if (!m) {
    const err = new Error("Student must be a club member first");
    err.statusCode = 400;
    throw err;
  }
  await query(
    "UPDATE clubs SET student_leader_id = ? WHERE id = ? AND school_id = ?",
    [studentId, clubId, schoolId],
  );
  await query(
    "UPDATE club_members SET role = 'leader' WHERE club_id = ? AND student_id = ?",
    [clubId, studentId],
  );
  return getClub(clubId, schoolId);
};

// ---------- Meetings ----------
const listMeetings = async (clubId, schoolId) => {
  return query(
    `SELECT m.*, (SELECT COUNT(*) FROM club_attendance ca WHERE ca.meeting_id = m.id AND ca.status='present') AS attendance_count
     FROM club_meetings m
     WHERE m.club_id = ? AND m.school_id = ?
     ORDER BY m.meeting_date DESC`,
    [clubId, schoolId],
  );
};

const createMeeting = async (clubId, schoolId, data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO club_meetings
       (id, club_id, school_id, title, meeting_date, start_time, end_time, venue, agenda, minutes, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      clubId,
      schoolId,
      data.title,
      data.meeting_date,
      data.start_time || null,
      data.end_time || null,
      data.venue || null,
      data.agenda || null,
      data.minutes || null,
      data.status || "scheduled",
      data.created_by || null,
    ],
  );
  return queryOne("SELECT * FROM club_meetings WHERE id = ?", [id]);
};

const updateMeeting = async (meetingId, schoolId, data) => {
  const allowed = [
    "title",
    "meeting_date",
    "start_time",
    "end_time",
    "venue",
    "agenda",
    "minutes",
    "status",
  ];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (entries.length === 0)
    return queryOne("SELECT * FROM club_meetings WHERE id = ?", [meetingId]);
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  values.push(meetingId, schoolId);
  await query(
    `UPDATE club_meetings SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    values,
  );
  return queryOne("SELECT * FROM club_meetings WHERE id = ?", [meetingId]);
};

const deleteMeeting = async (meetingId, schoolId) => {
  await query(
    "DELETE FROM club_meetings WHERE id = ? AND school_id = ?",
    [meetingId, schoolId],
  );
  return { deleted: true };
};

// ---------- Attendance ----------
const listAttendance = async (meetingId, schoolId) => {
  return query(
    `SELECT ca.*, s.admission_number, s.first_name, s.last_name
     FROM club_attendance ca
     JOIN students s ON s.id = ca.student_id
     WHERE ca.meeting_id = ? AND ca.school_id = ?
     ORDER BY s.first_name`,
    [meetingId, schoolId],
  );
};

const bulkSaveAttendance = async (meetingId, schoolId, records = []) => {
  // Get club_id from meeting
  const meeting = await queryOne(
    "SELECT club_id FROM club_meetings WHERE id = ? AND school_id = ?",
    [meetingId, schoolId],
  );
  if (!meeting) {
    const err = new Error("Meeting not found");
    err.statusCode = 404;
    throw err;
  }
  for (const rec of records) {
    // upsert
    const existing = await queryOne(
      "SELECT id FROM club_attendance WHERE meeting_id = ? AND student_id = ?",
      [meetingId, rec.student_id],
    );
    if (existing) {
      await query(
        "UPDATE club_attendance SET status = ?, remarks = ? WHERE id = ?",
        [rec.status || "present", rec.remarks || null, existing.id],
      );
    } else {
      await query(
        `INSERT INTO club_attendance
          (id, meeting_id, student_id, club_id, school_id, status, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          meetingId,
          rec.student_id,
          meeting.club_id,
          schoolId,
          rec.status || "present",
          rec.remarks || null,
        ],
      );
    }
  }
  return { saved: records.length };
};

// ---------- Achievements ----------
const listAchievements = async (clubId, schoolId) => {
  return query(
    "SELECT * FROM club_achievements WHERE club_id = ? AND school_id = ? ORDER BY achievement_date DESC",
    [clubId, schoolId],
  );
};

const createAchievement = async (clubId, schoolId, data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO club_achievements
       (id, club_id, school_id, title, description, award_level, achievement_date, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      clubId,
      schoolId,
      data.title,
      data.description || null,
      data.award_level || "school",
      data.achievement_date || null,
      data.position || null,
    ],
  );
  return queryOne("SELECT * FROM club_achievements WHERE id = ?", [id]);
};

const updateAchievement = async (achievementId, schoolId, data) => {
  const allowed = [
    "title",
    "description",
    "award_level",
    "achievement_date",
    "position",
  ];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (entries.length === 0)
    return queryOne("SELECT * FROM club_achievements WHERE id = ?", [
      achievementId,
    ]);
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  values.push(achievementId, schoolId);
  await query(
    `UPDATE club_achievements SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    values,
  );
  return queryOne("SELECT * FROM club_achievements WHERE id = ?", [
    achievementId,
  ]);
};

const deleteAchievement = async (achievementId, schoolId) => {
  await query(
    "DELETE FROM club_achievements WHERE id = ? AND school_id = ?",
    [achievementId, schoolId],
  );
  return { deleted: true };
};

// ---------- Reports ----------
const reportsSummary = async (schoolId) => {
  const [totals] = await query(
    `SELECT
       (SELECT COUNT(*) FROM clubs WHERE school_id = ? AND status='active') AS total_clubs,
       (SELECT COUNT(*) FROM club_members WHERE school_id = ? AND status='active') AS total_members,
       (SELECT COUNT(*) FROM club_meetings WHERE school_id = ?) AS total_meetings,
       (SELECT COUNT(*) FROM club_achievements WHERE school_id = ?) AS total_achievements`,
    [schoolId, schoolId, schoolId, schoolId],
  );
  const byClub = await query(
    `SELECT c.id, c.name,
            (SELECT COUNT(*) FROM club_members cm WHERE cm.club_id = c.id AND cm.status='active') AS members,
            (SELECT COUNT(*) FROM club_meetings m WHERE m.club_id = c.id) AS meetings,
            (SELECT COUNT(*) FROM club_achievements a WHERE a.club_id = c.id) AS achievements
     FROM clubs c WHERE c.school_id = ? ORDER BY members DESC`,
    [schoolId],
  );
  return { totals, byClub };
};

// Students not yet in any club (for membership picker)
const listUnassignedStudents = async (schoolId, search = "") => {
  let sql = `SELECT s.id, s.admission_number, s.first_name, s.last_name, s.full_name,
                    g.name AS grade_name, st.name AS stream_name
             FROM students s
             LEFT JOIN grades g ON g.id = s.current_grade_id
             LEFT JOIN streams st ON st.id = s.current_stream_id
             WHERE s.school_id = ? AND s.status = 'active'
               AND s.id NOT IN (SELECT student_id FROM club_members WHERE school_id = ?)`;
  const params = [schoolId, schoolId];
  if (search) {
    sql += " AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY s.first_name LIMIT 200";
  return query(sql, params);
};

module.exports = {
  listClubs,
  getClub,
  createClub,
  updateClub,
  deleteClub,
  listMembers,
  addMember,
  addMembersBulk,
  removeMember,
  setStudentLeader,
  listMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  listAttendance,
  bulkSaveAttendance,
  listAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  reportsSummary,
  listUnassignedStudents,
};
