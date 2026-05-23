const { queryOne } = require('../config/database');
const { error } = require('../utils/response');

/**
 * Resolves the active academic session for a request.
 *
 * Source of truth (in priority order):
 *   1. X-Academic-Year-Id + X-Term-Id headers from the frontend SessionContext
 *   2. The school's current_academic_year_id / current_term_id columns
 *
 * Attaches req.session = { academicYearId, termId, isCurrent, isArchived }.
 * Repositories should use req.session to filter every academic / finance query.
 *
 * Routes that are explicitly session-agnostic (auth, users, staff, school
 * config) should mount BEFORE this middleware or simply ignore req.session.
 */
const resolveSession = async (req, res, next) => {
  try {
    if (!req.schoolId) return next();

    const headerYear = req.headers['x-academic-year-id'] || null;
    const headerTerm = req.headers['x-term-id'] || null;

    let academicYearId = headerYear;
    let termId = headerTerm;

    if (!academicYearId || !termId) {
      const school = await queryOne(
        'SELECT current_academic_year_id, current_term_id FROM schools WHERE id = ?',
        [req.schoolId],
      );
      academicYearId = academicYearId || school?.current_academic_year_id || null;
      termId = termId || school?.current_term_id || null;
    }

    let isCurrent = true;
    let isArchived = false;
    if (academicYearId) {
      const ay = await queryOne(
        'SELECT is_current, is_archived FROM academic_years WHERE id = ?',
        [academicYearId],
      );
      if (ay) {
        isCurrent = Boolean(ay.is_current);
        isArchived = Boolean(ay.is_archived);
      }
    }

    req.session = { academicYearId, termId, isCurrent, isArchived };
    next();
  } catch (err) {
    return error(res, `Session resolution failed: ${err.message}`, 500);
  }
};

/**
 * Guard for mutating endpoints — rejects writes against an archived session
 * unless the request explicitly opts in with X-Force-Write: true (admin only).
 */
const blockArchivedWrites = (req, res, next) => {
  if (!req.session?.isArchived) return next();
  if (req.headers['x-force-write'] === 'true' && req.user?.role === 'admin') {
    return next();
  }
  return error(res, 'This academic session is archived and read-only', 409);
};

module.exports = { resolveSession, blockArchivedWrites };
