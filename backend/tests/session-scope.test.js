/**
 * Tests for backend/src/utils/sessionScope.js.
 * Stubs the DB layer so no MySQL is required.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const dbStubPath = require.resolve("../src/config/database");
require.cache[dbStubPath] = {
  id: dbStubPath,
  filename: dbStubPath,
  loaded: true,
  exports: {
    query: async () => [],
    queryOne: async () => null,
    execute: async () => ({}),
  },
};

const {
  sessionFilterSql,
  stampSession,
  requireActiveSession,
} = require("../src/utils/sessionScope");

test("sessionFilterSql returns empty when session is absent", () => {
  const r = sessionFilterSql("p", null);
  assert.equal(r.sql, "");
  assert.deepEqual(r.params, []);
});

test("sessionFilterSql emits both year + term predicates with legacy NULL fallback", () => {
  const r = sessionFilterSql("p", {
    academicYearId: "ay-1",
    termId: "term-1",
  });
  assert.match(r.sql, /p\.academic_year_id = \? OR p\.academic_year_id IS NULL/);
  assert.match(r.sql, /p\.term_id = \? OR p\.term_id IS NULL/);
  assert.deepEqual(r.params, ["ay-1", "term-1"]);
});

test("sessionFilterSql strict mode drops the NULL escape hatch", () => {
  const r = sessionFilterSql(
    "p",
    { academicYearId: "ay-1", termId: "term-1" },
    { strict: true },
  );
  assert.equal(
    r.sql,
    " AND p.academic_year_id = ? AND p.term_id = ?",
  );
});

test("sessionFilterSql omits empty alias prefix gracefully", () => {
  const r = sessionFilterSql("", { termId: "t" });
  assert.match(r.sql, /^ AND \(term_id = \? OR term_id IS NULL\)$/);
});

test("stampSession defaults missing ids from session and never mutates input", () => {
  const row = { foo: 1 };
  const out = stampSession(row, { academicYearId: "ay", termId: "t" });
  assert.equal(out.term_id, "t");
  assert.equal(out.academic_year_id, "ay");
  assert.equal(row.term_id, undefined, "input row not mutated");
});

test("stampSession honors explicit caller overrides", () => {
  const out = stampSession(
    { term_id: "explicit", academic_year_id: "ay-explicit" },
    { academicYearId: "ay-session", termId: "t-session" },
  );
  assert.equal(out.term_id, "explicit");
  assert.equal(out.academic_year_id, "ay-explicit");
});

test("requireActiveSession lets GETs through without a session", () => {
  let called = false;
  requireActiveSession({ method: "GET", session: {} }, {}, () => {
    called = true;
  });
  assert.equal(called, true);
});

test("requireActiveSession blocks writes when session is incomplete", () => {
  let called = false;
  let status = null;
  const res = {
    status(c) {
      status = c;
      return this;
    },
    json() {
      return this;
    },
  };
  requireActiveSession({ method: "POST", session: {} }, res, () => {
    called = true;
  });
  assert.equal(called, false);
  assert.equal(status, 409);
});

test("requireActiveSession allows writes when session is fully resolved", () => {
  let called = false;
  requireActiveSession(
    {
      method: "POST",
      session: { academicYearId: "ay", termId: "t" },
    },
    {},
    () => {
      called = true;
    },
  );
  assert.equal(called, true);
});