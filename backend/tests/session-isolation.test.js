/**
 * Phase 6 — Session isolation integration tests.
 *
 * Uses Node's built-in test runner. Run with:
 *   npm test    (or: node --test tests)
 *
 * The DB layer is pre-stubbed in require.cache before loading the
 * middleware, so these tests run in CI without a live MySQL instance.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// --- in-memory db stub, injected via require.cache -----------------------
const schools = {
  'school-1': { current_academic_year_id: 'ay-current', current_term_id: 'term-current' },
};
const academicYears = {
  'ay-current': { is_current: 1, is_archived: 0 },
  'ay-old': { is_current: 0, is_archived: 1 },
};

const dbStubPath = require.resolve('../src/config/database');
require.cache[dbStubPath] = {
  id: dbStubPath,
  filename: dbStubPath,
  loaded: true,
  exports: {
    query: async () => [],
    execute: async () => ({ insertId: 1, affectedRows: 1 }),
    queryOne: async (sql, params) => {
      if (/FROM schools/i.test(sql)) return schools[params[0]] || null;
      if (/FROM academic_years/i.test(sql)) return academicYears[params[0]] || null;
      return null;
    },
  },
};

const { resolveSession, blockArchivedWrites } = require('../src/middlewares/session.middleware');

function mockReqRes(headers = {}, { schoolId = 'school-1', user = { role: 'admin' } } = {}) {
  const req = { headers, schoolId, user };
  const res = {
    _status: 200,
    _body: null,
    status(c) { this._status = c; return this; },
    json(b) { this._body = b; return this; },
  };
  return { req, res };
}

test('resolveSession falls back to school current session', async () => {
  const { req, res } = mockReqRes();
  await new Promise((done) => resolveSession(req, res, done));
  assert.equal(req.session.academicYearId, 'ay-current');
  assert.equal(req.session.termId, 'term-current');
  assert.equal(req.session.isCurrent, true);
  assert.equal(req.session.isArchived, false);
});

test('resolveSession honors X-Academic-Year-Id / X-Term-Id headers', async () => {
  const { req, res } = mockReqRes({
    'x-academic-year-id': 'ay-old',
    'x-term-id': 'term-old',
  });
  await new Promise((done) => resolveSession(req, res, done));
  assert.equal(req.session.academicYearId, 'ay-old');
  assert.equal(req.session.termId, 'term-old');
  assert.equal(req.session.isArchived, true);
  assert.equal(req.session.isCurrent, false);
});

test('blockArchivedWrites rejects mutations on archived sessions', () => {
  const { req, res } = mockReqRes({}, { user: { role: 'teacher' } });
  req.session = { isArchived: true };
  let called = false;
  blockArchivedWrites(req, res, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res._status, 409);
});

test('blockArchivedWrites allows admin override with X-Force-Write', () => {
  const { req, res } = mockReqRes({ 'x-force-write': 'true' });
  req.session = { isArchived: true };
  let called = false;
  blockArchivedWrites(req, res, () => { called = true; });
  assert.equal(called, true);
});

test('blockArchivedWrites passes through on current session', () => {
  const { req, res } = mockReqRes();
  req.session = { isArchived: false };
  let called = false;
  blockArchivedWrites(req, res, () => { called = true; });
  assert.equal(called, true);
});
