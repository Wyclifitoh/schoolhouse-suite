const { error } = require('../utils/response');

const requireSchool = (req, res, next) => {
  const schoolId = req.headers['x-school-id'];
  if (!schoolId) {
    return error(res, 'X-School-ID header is required', 400);
  }
  req.schoolId = schoolId;
  next();
};

module.exports = { requireSchool };
