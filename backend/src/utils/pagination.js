const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

// Alias for backward compatibility
const paginate = (query) => parsePagination(query);

module.exports = { parsePagination, paginate };
