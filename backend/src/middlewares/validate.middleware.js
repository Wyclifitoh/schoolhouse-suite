const { error } = require('../utils/response');

const validate = (schema) => {
  return (req, res, next) => {
    const { body } = req;
    const keys = Object.keys(schema);
    const errors = [];

    for (const key of keys) {
      const rule = schema[key];
      const value = body[key];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${key} is required`);
      }
      if (rule.type && value !== undefined && value !== null) {
        if (rule.type === 'number' && typeof value !== 'number') {
          errors.push(`${key} must be a number`);
        }
        if (rule.type === 'string' && typeof value !== 'string') {
          errors.push(`${key} must be a string`);
        }
        if (rule.type === 'array' && !Array.isArray(value)) {
          errors.push(`${key} must be an array`);
        }
      }
      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        errors.push(`${key} must be at least ${rule.min}`);
      }
      if (rule.maxLength !== undefined && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push(`${key} must be at most ${rule.maxLength} characters`);
      }
    }

    if (errors.length > 0) {
      return error(res, 'Validation failed', 400, errors);
    }
    next();
  };
};

module.exports = { validate };
