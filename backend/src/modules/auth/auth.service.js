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

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name },
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

  return user;
};

module.exports = { login, register };
