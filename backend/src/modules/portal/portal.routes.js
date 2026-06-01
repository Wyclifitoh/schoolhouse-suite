// =============================================================================
// PORTAL ROUTES — Public login, then JWT-protected portal endpoints.
// Mounted at /portal (NO requireSchool, NO admin auth).
// =============================================================================
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { success, error } = require("../../utils/response");
const portal = require("./portal.repository");
const rcRepo = require("../assessments/report_cards.repository");

const TOKEN_TTL = "30d";

const issueToken = (acc) =>
  jwt.sign(
    {
      pid: acc.id,
      type: acc.account_type,
      school_id: acc.school_id,
      parent_id: acc.parent_id,
      student_id: acc.student_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  );

// ---- public: login ----
router.post("/login", async (req, res) => {
  try {
    const { account_type, identifier, pin } = req.body || {};
    if (!["parent", "student"].includes(account_type))
      return error(res, "Invalid account type", 400);
    if (!identifier || !pin)
      return error(res, "Identifier and PIN required", 400);

    const acc = await portal.findAccount(
      account_type,
      String(identifier).trim(),
    );
    if (!acc) return error(res, "Account not found", 404);

    const ok = await bcrypt.compare(String(pin), acc.pin_hash);
    if (!ok) return error(res, "Invalid PIN", 401);

    await portal.touchLogin(acc.id);
    return success(res, {
      token: issueToken(acc),
      account: {
        id: acc.id,
        type: acc.account_type,
        school_id: acc.school_id,
        school_name: acc.school_name,
        must_change_pin: !!acc.must_change_pin,
      },
    });
  } catch (e) {
    console.error("[portal/login]", e);
    return error(res, e.message || "Login failed", 500);
  }
});

// ---- middleware: auth ----
const authPortal = (req, res, next) => {
  const hdr = req.headers.authorization || "";
  if (!hdr.startsWith("Bearer ")) return error(res, "Auth required", 401);
  try {
    req.portal = jwt.verify(hdr.split(" ")[1], process.env.JWT_SECRET);
    if (!req.portal.pid) return error(res, "Invalid portal token", 401);
    next();
  } catch {
    return error(res, "Invalid token", 401);
  }
};

// ---- change pin ----
router.post("/change-pin", authPortal, async (req, res) => {
  try {
    const { new_pin } = req.body || {};
    if (!new_pin || String(new_pin).length < 4)
      return error(res, "PIN must be at least 4 digits", 400);
    const hash = await bcrypt.hash(String(new_pin), 10);
    await portal.setPin(req.portal.pid, hash);
    return success(res, { changed: true });
  } catch (e) {
    return error(res, e.message, 500);
  }
});

// ---- me ----
router.get("/me", authPortal, async (req, res) => {
  try {
    const { type, parent_id, student_id, school_id } = req.portal;
    if (type === "parent") {
      const children = parent_id ? await portal.parentChildren(parent_id) : [];
      return success(res, { type, school_id, children });
    }
    const student = student_id ? await portal.getStudent(student_id) : null;
    return success(res, { type, school_id, student });
  } catch (e) {
    return error(res, e.message, 500);
  }
});

// ---- assert access helper ----
const assertStudentAccess = async (req, studentId) => {
  if (req.portal.type === "student") {
    if (req.portal.student_id !== studentId) {
      const e = new Error("Forbidden");
      e.statusCode = 403;
      throw e;
    }
    return;
  }
  // parent
  if (!req.portal.parent_id) {
    const e = new Error("Forbidden");
    e.statusCode = 403;
    throw e;
  }
  const owns = await portal.parentOwnsStudent(req.portal.parent_id, studentId);
  if (!owns) {
    const e = new Error("Forbidden");
    e.statusCode = 403;
    throw e;
  }
};

// ---- student summary ----
router.get("/students/:id/summary", authPortal, async (req, res) => {
  try {
    await assertStudentAccess(req, req.params.id);
    const [student, attendance, fees] = await Promise.all([
      portal.getStudent(req.params.id),
      portal.attendanceSummary(req.params.id),
      portal.feesSummary(req.params.id),
    ]);
    return success(res, { student, attendance, fees });
  } catch (e) {
    return error(res, e.message, e.statusCode || 500);
  }
});

// ---- report cards (CBC published only) ----
router.get("/students/:id/report-cards", authPortal, async (req, res) => {
  try {
    await assertStudentAccess(req, req.params.id);
    const cards = await rcRepo.portalCards(req.params.id);
    // Parse payload JSON
    const parsed = (cards || []).map((c) => ({
      ...c,
      payload:
        typeof c.payload === "string" ? JSON.parse(c.payload) : c.payload,
    }));
    return success(res, parsed);
  } catch (e) {
    return error(res, e.message, e.statusCode || 500);
  }
});

module.exports = router;
