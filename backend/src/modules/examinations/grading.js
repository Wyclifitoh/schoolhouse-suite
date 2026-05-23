const { queryOne, query } = require("../../config/database");

/**
 * Resolve a numeric score to {grade, points, remark, descriptor} using a grading scale.
 * Falls back to {grade:null, points:null} if no scale or no matching band.
 */
const resolveGrade = async (score, gradingScaleId) => {
  if (score == null || !gradingScaleId) return { grade: null, points: null, remark: null };
  const band = await queryOne(
    `SELECT grade, points, remark, descriptor
     FROM grading_bands
     WHERE scale_id = ? AND ? BETWEEN min_score AND max_score
     ORDER BY min_score DESC LIMIT 1`,
    [gradingScaleId, score],
  );
  return band
    ? { grade: band.grade, points: band.points, remark: band.remark || band.descriptor || null }
    : { grade: null, points: null, remark: null };
};

/**
 * Pick the default school-wide grading scale (used when an exam/subject has no scale set).
 */
const defaultScaleForSchool = (schoolId) =>
  queryOne(
    `SELECT id, kind FROM grading_scales WHERE school_id = ? AND is_default = 1 LIMIT 1`,
    [schoolId],
  );

const getScale = (id) =>
  queryOne(`SELECT * FROM grading_scales WHERE id = ?`, [id]);

const listBands = (scaleId) =>
  query(
    `SELECT * FROM grading_bands WHERE scale_id = ? ORDER BY min_score DESC`,
    [scaleId],
  );

module.exports = { resolveGrade, defaultScaleForSchool, getScale, listBands };
