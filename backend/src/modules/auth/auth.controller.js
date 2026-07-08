const authService = require("./auth.service");
const { success, error } = require("../../utils/response");
const { writeAudit, auditFromReq } = require("../../utils/audit");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return error(res, "Email and password are required", 400);
    const result = await authService.login(email, password);
    writeAudit({
      userId: result?.user?.id || null,
      action: "LOGIN",
      entityType: "user",
      entityId: result?.user?.id || null,
      ipAddress:
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || null,
      userAgent: req.headers["user-agent"] || null,
      newValues: { email },
    });
    return success(res, result);
  } catch (err) {
    writeAudit({
      action: "LOGIN_FAILED",
      entityType: "user",
      ipAddress:
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || null,
      userAgent: req.headers["user-agent"] || null,
      newValues: { email: req.body?.email, reason: err.message },
    });
    return error(res, err.message, err.statusCode || 500);
  }
};

const register = async (req, res) => {
  try {
    const { email, password, full_name, school_id, role } = req.body;
    if (!email || !password || !full_name)
      return error(res, "Email, password, and full_name are required", 400);
    const result = await authService.register({
      email,
      password,
      fullName: full_name,
      schoolId: school_id,
      role,
    });
    return success(res, result, 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const me = async (req, res) => {
  try {
    return success(res, await authService.me(req.user.id));
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const verifyPassword = async (req, res) => {
  try {
    const result = await authService.verifyPassword(
      req.user.id,
      req.body.password,
    );
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};
    const result = await authService.changePassword(
      req.user.id,
      current_password,
      new_password,
    );
    auditFromReq(req, {
      action: "PASSWORD_CHANGED",
      entityType: "user",
      entityId: req.user.id,
    });
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = { login, register, me, verifyPassword, changePassword };
