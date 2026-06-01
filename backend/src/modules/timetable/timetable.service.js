const repo = require("./timetable.repository");

const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/**
 * Automatically generate a timetable for a set of grades.
 *
 * Inputs:
 *   - schoolId
 *   - gradeIds: string[]   grades to generate for
 *   - days?: string[]      default Monday..Friday
 *   - replace?: boolean    if true, wipes existing entries for affected streams first
 *
 * Algorithm (greedy with backtracking-lite):
 *   1. Load configured lesson periods (kind='lesson') from timetable_periods
 *   2. Load streams in scope, lesson requirements, teacher allocations
 *   3. Build a slot grid for each stream (day × period)
 *   4. For each stream, expand requirements into a flat list of (subject) lessons
 *      shuffled by descending lessons-per-week (heavy subjects first)
 *   5. For each lesson, find a free slot where:
 *        - the stream slot is empty
 *        - an allocated teacher exists for (subject, grade, stream|null) AND is free at that slot
 *      Prefer slots that spread the subject across distinct days.
 *   6. Insert all assigned rows in one bulk insert
 *
 * Returns { assigned, skipped, warnings }
 */
async function generateTimetable(
  schoolId,
  { gradeIds = [], days = DEFAULT_DAYS, replace = true },
) {
  if (!gradeIds.length) {
    return { assigned: 0, skipped: 0, warnings: ["No grades selected"] };
  }

  const periods = (await repo.listPeriods(schoolId)).filter(
    (p) => p.kind === "lesson" && p.is_active,
  );
  if (!periods.length) {
    return {
      assigned: 0,
      skipped: 0,
      warnings: [
        "No active lesson periods configured. Add them under Period Setup first.",
      ],
    };
  }

  const streams = await repo.getStreamsForGrades(schoolId, gradeIds);
  if (!streams.length) {
    return {
      assigned: 0,
      skipped: 0,
      warnings: ["No streams found for the selected classes."],
    };
  }

  const requirements = await repo.listRequirements(schoolId);
  const reqByGrade = new Map();
  for (const r of requirements) {
    if (!gradeIds.includes(r.grade_id)) continue;
    if (!reqByGrade.has(r.grade_id)) reqByGrade.set(r.grade_id, []);
    reqByGrade.get(r.grade_id).push(r);
  }

  const allocs = await repo.getTeacherAllocations(schoolId, gradeIds);

  // index allocations: key `${grade_id}|${subject_id}|${stream_id || '*'}` -> teacher_id
  const allocLookup = (subject_id, grade_id, stream_id) => {
    const specific = allocs.find(
      (a) =>
        a.subject_id === subject_id &&
        a.grade_id === grade_id &&
        a.stream_id === stream_id,
    );
    if (specific) return specific.teacher_id;
    const generic = allocs.find(
      (a) =>
        a.subject_id === subject_id &&
        a.grade_id === grade_id &&
        !a.stream_id,
    );
    return generic ? generic.teacher_id : null;
  };

  if (replace) {
    await repo.clearForStreams(
      schoolId,
      streams.map((s) => s.id),
    );
  }

  // Booking maps
  // streamBooked: `${streamId}|${day}|${periodPos}` -> true
  // teacherBooked: `${teacherId}|${day}|${periodPos}` -> true
  const streamBooked = new Set();
  const teacherBooked = new Set();

  const warnings = [];
  const rowsToInsert = [];
  let skipped = 0;

  // Iterate stream-by-stream
  for (const stream of streams) {
    const reqs = (reqByGrade.get(stream.grade_id) || []).slice();
    // sort heaviest subjects first for better packing
    reqs.sort(
      (a, b) => (b.lessons_per_week || 0) - (a.lessons_per_week || 0),
    );

    // expand into individual lessons
    const lessons = [];
    for (const r of reqs) {
      for (let i = 0; i < (r.lessons_per_week || 0); i++) {
        lessons.push({
          subject_id: r.subject_id,
          subject_name: r.subject_name,
        });
      }
    }

    // count of (subject, day) already placed, to spread across days
    const subjectDayCount = new Map();

    for (const lesson of lessons) {
      const teacherId = allocLookup(
        lesson.subject_id,
        stream.grade_id,
        stream.id,
      );
      if (!teacherId) {
        skipped++;
        warnings.push(
          `No teacher allocation for ${lesson.subject_name} in ${stream.grade_name} ${stream.name}`,
        );
        continue;
      }

      // build candidate (day, period) list, prefer days with fewest occurrences
      const candidates = [];
      for (const day of days) {
        for (const p of periods) {
          const sKey = `${stream.id}|${day}|${p.position}`;
          const tKey = `${teacherId}|${day}|${p.position}`;
          if (streamBooked.has(sKey)) continue;
          if (teacherBooked.has(tKey)) continue;
          candidates.push({ day, period: p });
        }
      }
      if (!candidates.length) {
        skipped++;
        warnings.push(
          `No free slot for ${lesson.subject_name} in ${stream.grade_name} ${stream.name}`,
        );
        continue;
      }
      candidates.sort((a, b) => {
        const ka = `${lesson.subject_id}|${a.day}`;
        const kb = `${lesson.subject_id}|${b.day}`;
        return (
          (subjectDayCount.get(ka) || 0) - (subjectDayCount.get(kb) || 0)
        );
      });
      const pick = candidates[0];
      const sKey = `${stream.id}|${pick.day}|${pick.period.position}`;
      const tKey = `${teacherId}|${pick.day}|${pick.period.position}`;
      streamBooked.add(sKey);
      teacherBooked.add(tKey);
      subjectDayCount.set(
        `${lesson.subject_id}|${pick.day}`,
        (subjectDayCount.get(`${lesson.subject_id}|${pick.day}`) || 0) + 1,
      );

      rowsToInsert.push({
        grade_id: stream.grade_id,
        stream_id: stream.id,
        subject_id: lesson.subject_id,
        teacher_id: teacherId,
        day: pick.day,
        period: pick.period.position,
        start_time: pick.period.start_time,
        end_time: pick.period.end_time,
      });
    }
  }

  const assigned = await repo.bulkInsertEntries(schoolId, rowsToInsert);
  // dedupe warnings
  const uniqWarnings = Array.from(new Set(warnings)).slice(0, 50);
  return { assigned, skipped, warnings: uniqWarnings };
}

module.exports = {
  listPeriods: (schoolId) => repo.listPeriods(schoolId),
  createPeriod: (data) => repo.createPeriod(data),
  updatePeriod: (id, schoolId, data) => repo.updatePeriod(id, schoolId, data),
  deletePeriod: (id, schoolId) => repo.deletePeriod(id, schoolId),
  listRequirements: (schoolId, gradeId) =>
    repo.listRequirements(schoolId, gradeId),
  upsertRequirement: (data) => repo.upsertRequirement(data),
  bulkUpsertRequirements: async (schoolId, items) => {
    let count = 0;
    for (const it of items) {
      await repo.upsertRequirement({ ...it, school_id: schoolId });
      count++;
    }
    return count;
  },
  deleteRequirement: (id, schoolId) => repo.deleteRequirement(id, schoolId),
  listEntries: (schoolId, q) => repo.listEntries(schoolId, q),
  clearForStreams: (schoolId, streamIds) =>
    repo.clearForStreams(schoolId, streamIds),
  detectClashes: (schoolId) => repo.detectClashes(schoolId),
  generateTimetable,
};
