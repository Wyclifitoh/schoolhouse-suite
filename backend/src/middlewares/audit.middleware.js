const { writeAudit } = require("../utils/audit");

// Map URL prefix → entity_type for nicer audit logs
const ENTITY_MAP = [
  ["/students", "student"],
  ["/parents", "parent"],
  ["/staff", "staff"],
  ["/staff-attendance", "staff_attendance"],
  ["/classes", "class"],
  ["/streams", "stream"],
  ["/finance", "finance"],
  ["/payments", "payment"],
  ["/expenses", "expense"],
  ["/inventory", "inventory"],
  ["/attendance", "attendance"],
  ["/examinations", "examination"],
  ["/assessments", "assessment"],
  ["/promotion", "promotion"],
  ["/notifications", "notification"],
  ["/clubs", "club"],
  ["/lesson-plans", "lesson_plan"],
  ["/leaves", "leave"],
  ["/ratings", "rating"],
  ["/payroll", "payroll"],
  ["/timetable", "timetable"],
  ["/homework", "homework"],
  ["/events", "event"],
  ["/communication", "communication"],
  ["/departments", "department"],
  ["/designations", "designation"],
  ["/users", "user"],
  ["/roles", "role"],
  ["/schools", "school"],
  ["/reports", "report"],
];

const resolveEntity = (url) => {
  for (const [prefix, name] of ENTITY_MAP) {
    if (url.startsWith(prefix)) return name;
  }
  return "system";
};

const ACTION_MAP = {
  POST: "CREATE",
  PUT: "UPDATE",
  PATCH: "UPDATE",
  DELETE: "DELETE",
};

// Skip noisy or sensitive paths
const SKIP_PATTERNS = [/^\/auth\//, /^\/portal\//, /^\/webhooks\//];

// Strip secrets before persisting request body
const REDACT_KEYS = new Set([
  "password",
  "new_password",
  "current_password",
  "token",
  "access_token",
  "refresh_token",
  "secret",
  "api_key",
]);

const sanitize = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (REDACT_KEYS.has(k)) out[k] = "[REDACTED]";
    else if (v && typeof v === "object") out[k] = sanitize(v);
    else out[k] = v;
  }
  return out;
};

/**
 * Global audit middleware. Logs every mutating request (POST/PUT/PATCH/DELETE)
 * to the audit_logs table after the response is sent. Best-effort: never blocks
 * or fails the request.
 */
const auditMiddleware = (req, res, next) => {
  const method = req.method;
  if (!ACTION_MAP[method]) return next();

  const url = req.originalUrl.replace(/^\/api\/v1/, "").split("?")[0];
  if (SKIP_PATTERNS.some((re) => re.test(url))) return next();

  const startedAt = Date.now();
  const body = sanitize(req.body);

  res.on("finish", () => {
    // Only log successful mutations (2xx). Failed ones already surface in error logs.
    if (res.statusCode >= 400) return;
    const entity = resolveEntity(url);
    // Last URL segment is usually the entity id (when it looks like a uuid/number)
    const segments = url.split("/").filter(Boolean);
    const tail = segments[segments.length - 1];
    const entityId = tail && /^[0-9a-f-]{8,}$/i.test(tail) ? tail : null;
    writeAudit({
      schoolId: req.schoolId || null,
      userId: req.user?.id || null,
      action: `${ACTION_MAP[method]} ${url}`,
      entityType: entity,
      entityId,
      newValues: {
        method,
        url,
        body,
        status: res.statusCode,
        duration_ms: Date.now() - startedAt,
      },
      ipAddress:
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || null,
      userAgent: req.headers["user-agent"] || null,
    });
  });

  next();
};

module.exports = { auditMiddleware };
