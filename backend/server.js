require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const routes = require("./src/routes");
const { errorHandler } = require("./src/middlewares/error.middleware");
const { ensureSessionColumns } = require("./src/utils/sessionScope");

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

app.use("/api/v1", routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CHUO API running on port ${PORT}...`);
  // Bring the schema into the session-scoped contract: add
  // term_id/academic_year_id (and indexes) to operational tables and
  // back-fill any legacy NULL rows. Runs once, non-fatal on failure.
  ensureSessionColumns().catch((e) =>
    console.warn("[boot] ensureSessionColumns failed:", e.message),
  );
});

module.exports = app;
