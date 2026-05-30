/**
 * Phase 7 — Exam lifecycle state machine tests.
 * Run with: node --test tests
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  assertTransition,
  normalizeStatus,
} = require("../src/modules/examinations/lifecycle");

test("normalizeStatus rolls legacy lowercase statuses forward", () => {
  assert.equal(normalizeStatus("published"), "APPROVED");
  assert.equal(normalizeStatus("completed"), "APPROVED");
  assert.equal(normalizeStatus("ongoing"), "DRAFT");
  assert.equal(normalizeStatus("scheduled"), "DRAFT");
  assert.equal(normalizeStatus("DRAFT"), "DRAFT");
  assert.equal(normalizeStatus(undefined), "DRAFT");
});

test("teacher can submit a DRAFT exam", () => {
  assert.equal(assertTransition("DRAFT", "submit", "teacher"), "SUBMITTED");
});

test("teacher cannot approve", () => {
  assert.throws(
    () => assertTransition("REVIEWED", "approve", "teacher"),
    /cannot perform/,
  );
});

test("hod can review a SUBMITTED exam", () => {
  assert.equal(assertTransition("SUBMITTED", "review", "hod"), "REVIEWED");
});

test("academic can approve a REVIEWED exam", () => {
  assert.equal(assertTransition("REVIEWED", "approve", "academic"), "APPROVED");
});

test("only admin can lock an APPROVED exam", () => {
  assert.equal(assertTransition("APPROVED", "lock", "admin"), "LOCKED");
  assert.throws(
    () => assertTransition("APPROVED", "lock", "academic"),
    /cannot perform/,
  );
});

test("admin can reopen LOCKED back to DRAFT", () => {
  assert.equal(assertTransition("LOCKED", "reopen", "admin"), "DRAFT");
});

test("illegal transitions are rejected", () => {
  assert.throws(
    () => assertTransition("DRAFT", "approve", "admin"),
    /not allowed/,
  );
  assert.throws(
    () => assertTransition("LOCKED", "submit", "admin"),
    /not allowed/,
  );
});

test("archive from APPROVED or LOCKED is admin-only", () => {
  assert.equal(assertTransition("APPROVED", "archive", "admin"), "ARCHIVED");
  assert.equal(assertTransition("LOCKED", "archive", "admin"), "ARCHIVED");
  assert.throws(
    () => assertTransition("APPROVED", "archive", "hod"),
    /cannot perform/,
  );
});
