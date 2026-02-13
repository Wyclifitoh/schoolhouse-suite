const authService = require('./auth.service');
const { success, error } = require('../../utils/response');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return error(res, 'Email and password are required', 400);
    }
    const result = await authService.login(email, password);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const register = async (req, res) => {
  try {
    const { email, password, full_name, school_id, role } = req.body;
    if (!email || !password || !full_name) {
      return error(res, 'Email, password, and full_name are required', 400);
    }
    const user = await authService.register({
      email,
      password,
      fullName: full_name,
      schoolId: school_id,
      role,
    });
    return success(res, user, 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = { login, register };
