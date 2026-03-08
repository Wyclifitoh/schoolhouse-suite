const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepository = require('./auth.repository');
const AppError = require('../../utils/AppError');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

const login = async (email, password) => {
  const user = await authRepository.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const roles = await authRepository.getUserRoles(user.id);
  const profile = await authRepository.getProfile(user.id);

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name },
    profile: profile || null,
    roles,
  };
};

const register = async ({ email, password, fullName, schoolId, role }) => {
  const existing = await authRepository.findByEmail(email);
  if (existing) {
    throw new AppError('Email already registered', 409, 'DUPLICATE_EMAIL');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authRepository.create({ email, passwordHash, fullName });

  if (schoolId && role) {
    await authRepository.assignRole(user.id, schoolId, role);
  }

  const roles = await authRepository.getUserRoles(user.id);
  const profile = await authRepository.getProfile(user.id);

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return { token, user, profile, roles };
};

const me = async (userId) => {
  const user = await authRepository.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  const roles = await authRepository.getUserRoles(userId);
  const profile = await authRepository.getProfile(userId);
  return { user, profile, roles };
};

module.exports = { login, register, me };
