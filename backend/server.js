require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const routes = require("./src/routes");
const { errorHandler } = require("./src/middlewares/error.middleware");
const { ensureSessionColumns } = require("./src/utils/sessionScope");
const { bootstrapRolesAndPermissions } = require("./src/utils/rolesBootstrap");
const { runMigrations } = require("./src/utils/migrationRunner");
const {
  bootstrap: platformBootstrap,
} = require("./src/modules/platform/platform.bootstrap");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(
  cors({
    origin: "*",
  }),
);
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// School-scoped API
app.use("/api/v1", routes);

// Platform admin console API (separate auth, no school context needed)
app.use("/api/platform", require("./src/modules/platform/platform.routes"));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CHUO API running on port ${PORT}...`);
  // Apply pending SQL migrations from /backend/migrations before any
  // schema-touching bootstrap runs. Non-fatal: log and continue so the
  // API stays up if a single migration is broken.
  runMigrations().catch((e) =>
    console.error("[boot] runMigrations failed:", e.message),
  );
  // SaaS platform tables + subscription auto-provision for existing schools
  platformBootstrap().catch((e) =>
    console.warn("[boot] platformBootstrap failed:", e.message),
  );
  // Bring the schema into the session-scoped contract: add
  // term_id/academic_year_id (and indexes) to operational tables and
  // back-fill any legacy NULL rows. Runs once, non-fatal on failure.
  ensureSessionColumns().catch((e) =>
    console.warn("[boot] ensureSessionColumns failed:", e.message),
  );
  bootstrapRolesAndPermissions().catch((e) =>
    console.warn("[boot] bootstrapRolesAndPermissions failed:", e.message),
  );

  // Auto clock-out scheduler: every 30 minutes after the school-day cutoff,
  // close any staff attendance rows that still have no check_out.
  try {
    const staffAttRepo = require("./src/modules/staff-attendance/staff-attendance.repository");
    const cutoff = process.env.STAFF_AUTO_CLOCKOUT_AFTER || "18:00:00";
    const runAutoClose = () =>
      staffAttRepo
        .autoCloseOpen({ cutoffTime: cutoff })
        .then((r) => {
          if (r && r.closed) {
            console.log(`[auto-clockout] closed ${r.closed} open record(s)`);
          }
        })
        .catch((e) => console.warn("[auto-clockout]", e.message));
    setInterval(runAutoClose, 30 * 60 * 1000).unref?.();
    // Kick off once shortly after boot
    setTimeout(runAutoClose, 60 * 1000).unref?.();
  } catch (e) {
    console.warn("[boot] auto-clockout scheduler failed:", e.message);
  }
});

module.exports = app;
