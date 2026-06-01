const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authRepository = require("./auth.repository");
const { query, queryOne } = require("../../config/database");
const AppError = require("../../utils/AppError");

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

const buildToken = (user, roles) =>
  jwt.sign({ id: user.id, email: user.email, roles }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const login = async (email, password) => {
  const user = await queryOne(
    "SELECT id, email, password_hash, full_name, must_change_password FROM users WHERE email = ? AND is_active = 1",
    [email],
  );
  if (!user)
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch)
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  const roles = await authRepository.getUserRoles(user.id);
  const profile = await authRepository.getProfile(user.id);

  await query(
    "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?",
    [user.id],
  );

  return {
    token: buildToken(user, roles),
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      must_change_password: !!user.must_change_password,
    },
    profile: profile || null,
    roles,
  };
};

const register = async ({ email, password, fullName, schoolId, role }) => {
  const existing = await authRepository.findByEmail(email);
  if (existing)
    throw new AppError("Email already registered", 409, "DUPLICATE_EMAIL");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authRepository.create({ email, passwordHash, fullName });
  if (schoolId && role)
    await authRepository.assignRole(user.id, schoolId, role);

  const roles = await authRepository.getUserRoles(user.id);
  const profile = await authRepository.getProfile(user.id);
  return { token: buildToken(user, roles), user, profile, roles };
};

const me = async (userId) => {
  const user = await queryOne(
    "SELECT id, email, full_name, phone, avatar_url, is_active, must_change_password FROM users WHERE id = ?",
    [userId],
  );
  if (!user) throw new AppError("User not found", 404);
  const roles = await authRepository.getUserRoles(userId);
  const profile = await authRepository.getProfile(userId);
  return { user, profile, roles };
};

const verifyPassword = async (userId, password) => {
  if (!password) throw new AppError("Password required", 400);
  const user = await queryOne("SELECT password_hash FROM users WHERE id = ?", [
    userId,
  ]);
  if (!user) throw new AppError("User not found", 404);
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new AppError("Incorrect password", 401, "INVALID_PASSWORD");
  return { verified: true };
};

// New: change password (handles first-login forced change)
const changePassword = async (userId, currentPassword, newPassword) => {
  if (!newPassword || newPassword.length < 8) {
    throw new AppError("New password must be at least 8 characters", 400);
  }
  const user = await queryOne(
    "SELECT password_hash, must_change_password FROM users WHERE id = ?",
    [userId],
  );
  if (!user) throw new AppError("User not found", 404);

  // On forced first-login change we still require the temp password as proof.
  const ok = await bcrypt.compare(currentPassword || "", user.password_hash);
  if (!ok)
    throw new AppError(
      "Current password is incorrect",
      401,
      "INVALID_PASSWORD",
    );

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await query(
    `UPDATE users
        SET password_hash = ?,
            must_change_password = 0,
            password_changed_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    [hash, userId],
  );
  return { changed: true };
};

module.exports = { login, register, me, verifyPassword, changePassword };
