// =============================================================================
// PDF & EXCEL GENERATION for Assessment Results
// Produces school-branded CBC/CBE report cards (A4) and analytics exports.
// =============================================================================
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const { queryOne, query } = require("../../config/database");

// ---------- helpers ----------
const fmt = (n, d = 1) => (n == null || isNaN(n) ? "—" : Number(n).toFixed(d));
const safe = (v, f = "—") => (v == null || v === "" ? f : String(v));

async function loadSchool(schoolId) {
  const s = await queryOne("SELECT * FROM schools WHERE id=?", [schoolId]);
  const settings = await queryOne(
    "SELECT * FROM school_settings WHERE school_id=?",
    [schoolId],
  ).catch(() => null);
  return { ...s, settings: settings || {} };
}

async function loadAttendance(schoolId, studentId, termStart, termEnd) {
  if (!termStart || !termEnd) return { present: 0, absent: 0, late: 0, total: 0, pct: null };
  const row = await queryOne(
    `SELECT
       SUM(status='present') AS present,
       SUM(status='absent')  AS absent,
       SUM(status='late')    AS late,
       SUM(status='excused') AS excused,
       COUNT(*)              AS total
     FROM student_attendance
     WHERE school_id=? AND student_id=? AND date BETWEEN ? AND ?`,
    [schoolId, studentId, termStart, termEnd],
  );
  if (!row || !row.total) return { present: 0, absent: 0, late: 0, total: 0, pct: null };
  const pct = row.total ? (Number(row.present) / Number(row.total)) * 100 : null;
  return { ...row, pct };
}

// Band → human label
const BAND_LABELS = {
  EE: "Exceeding Expectation",
  ME: "Meeting Expectation",
  AE: "Approaching Expectation",
  BE: "Below Expectation",
};
const BAND_COLORS = {
  EE: "#16a34a", ME: "#2563eb", AE: "#d97706", BE: "#dc2626",
};

// ---------- REPORT CARD PDF ----------
exports.streamReportCardPdf = async ({ res, schoolId, card, school }) => {
  const payload = typeof card.payload === "string" ? JSON.parse(card.payload) : card.payload;
  const att = await loadAttendance(
    schoolId,
    card.student_id,
    payload?.term_start || payload?.start_date,
    payload?.term_end || payload?.end_date,
  );

  const doc = new PDFDocument({ size: "A4", margin: 36 });
  doc.pipe(res);

  const pageW = doc.page.width - 72;
  const PRIMARY = "#0f172a";
  const ACCENT = "#2563eb";

  // ===== Header band =====
  doc.rect(0, 0, doc.page.width, 110).fill(PRIMARY);
  doc.fillColor("#ffffff");
  doc.fontSize(18).font("Helvetica-Bold").text(safe(school.name, "School"), 36, 28, { width: pageW - 120 });
  doc.fontSize(9).font("Helvetica").fillColor("#cbd5e1");
  doc.text(safe(school.address), 36, 52, { width: pageW - 120 });
  doc.text(`Tel: ${safe(school.phone)}   Email: ${safe(school.email)}`, 36, 65, { width: pageW - 120 });
  if (school.settings?.motto) {
    doc.fillColor("#fde68a").font("Helvetica-Oblique").fontSize(9)
      .text(`"${school.settings.motto}"`, 36, 80, { width: pageW - 120 });
  }
  // Curriculum chip
  doc.roundedRect(doc.page.width - 110, 28, 74, 22, 4).fill(ACCENT);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10)
    .text(safe(school.curriculum_type, "CBC"), doc.page.width - 110, 33, { width: 74, align: "center" });

  doc.fillColor(PRIMARY);
  let y = 130;

  // ===== Title =====
  doc.font("Helvetica-Bold").fontSize(15)
    .text("LEARNER PROGRESS REPORT", 36, y, { width: pageW, align: "center" });
  y += 22;
  doc.font("Helvetica").fontSize(10).fillColor("#475569")
    .text(safe(payload.assessment_name), 36, y, { width: pageW, align: "center" });
  y += 22;

  // ===== Student details box =====
  doc.fillColor(PRIMARY).font("Helvetica-Bold").fontSize(10);
  const boxH = 70;
  doc.roundedRect(36, y, pageW, boxH, 4).fillAndStroke("#f1f5f9", "#e2e8f0");
  doc.fillColor(PRIMARY);
  const col = (label, val, x, yy) => {
    doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(label, x, yy);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(PRIMARY).text(safe(val), x, yy + 10);
  };
  const c1 = 48, c2 = 230, c3 = 410;
  col("STUDENT NAME", `${payload.first_name || ""} ${payload.last_name || ""}`.trim(), c1, y + 10);
  col("ADMISSION NO.", payload.admission_number, c1, y + 40);
  col("CLASS", payload.grade_name, c2, y + 10);
  col("STREAM", payload.stream_name, c2, y + 40);
  col("POSITION (Class)", school.settings?.show_ranking !== 0 ? payload.class_position : "—", c3, y + 10);
  col("OVERALL %", fmt(payload.percentage), c3, y + 40);
  y += boxH + 16;

  // ===== Subject table =====
  doc.font("Helvetica-Bold").fontSize(11).fillColor(PRIMARY).text("Subject Performance", 36, y);
  y += 16;
  const headers = [
    { t: "Subject", w: 180 },
    { t: "Score", w: 60, a: "right" },
    { t: "Out of", w: 50, a: "right" },
    { t: "%", w: 50, a: "right" },
    { t: "AL", w: 40, a: "center" },
    { t: "Band", w: 60, a: "center" },
    { t: "Remarks", w: pageW - 440 },
  ];
  // table header
  doc.rect(36, y, pageW, 20).fill(PRIMARY);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
  let x = 42;
  for (const h of headers) {
    doc.text(h.t, x, y + 6, { width: h.w - 6, align: h.a || "left" });
    x += h.w;
  }
  y += 20;
  doc.font("Helvetica").fontSize(9).fillColor(PRIMARY);

  const marks = payload.marks || [];
  marks.forEach((m, i) => {
    if (y > 720) { doc.addPage(); y = 50; }
    const rowH = 18;
    if (i % 2 === 0) doc.rect(36, y, pageW, rowH).fill("#f8fafc");
    doc.fillColor(PRIMARY);
    const pct = m.out_of ? (Number(m.score) / Number(m.out_of)) * 100 : null;
    const cells = [
      m.subject_name,
      m.score == null ? "—" : Number(m.score).toFixed(0),
      m.out_of == null ? "—" : Number(m.out_of).toFixed(0),
      fmt(pct),
      safe(m.achievement_level_code, "—"),
      safe(m.band_code, "—"),
      safe(m.teacher_remark || m.remark, ""),
    ];
    x = 42;
    cells.forEach((c, idx) => {
      doc.font("Helvetica").fontSize(9)
        .text(String(c), x, y + 5, { width: headers[idx].w - 6, align: headers[idx].a || "left", ellipsis: true });
      x += headers[idx].w;
    });
    y += rowH;
  });
  if (!marks.length) {
    doc.fillColor("#94a3b8").font("Helvetica-Oblique").fontSize(9)
      .text("No marks recorded.", 42, y + 4); y += 20;
  }

  y += 14;

  // ===== Summary strip =====
  if (y > 640) { doc.addPage(); y = 50; }
  const sumH = 60;
  doc.roundedRect(36, y, pageW, sumH, 4).fillAndStroke("#eff6ff", "#bfdbfe");
  doc.fillColor(PRIMARY);
  const sCell = (label, val, x, yy, color) => {
    doc.font("Helvetica").fontSize(8).fillColor("#475569").text(label, x, yy);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(color || PRIMARY).text(safe(val), x, yy + 10);
  };
  sCell("TOTAL SCORE", `${fmt(payload.total_score, 0)} / ${fmt(payload.total_out_of, 0)}`, 48, y + 12);
  sCell("MEAN %", fmt(payload.percentage), 200, y + 12, ACCENT);
  sCell("OVERALL AL", safe(payload.overall_al), 310, y + 12);
  sCell("OVERALL BAND",
    payload.overall_band ? `${payload.overall_band} — ${BAND_LABELS[payload.overall_band] || ""}` : "—",
    400, y + 12, BAND_COLORS[payload.overall_band]);
  y += sumH + 14;

  // ===== Attendance =====
  if (school.settings?.show_attendance_on_card !== 0) {
    if (y > 700) { doc.addPage(); y = 50; }
    doc.font("Helvetica-Bold").fontSize(10).fillColor(PRIMARY).text("Attendance Summary", 36, y);
    y += 14;
    doc.font("Helvetica").fontSize(9).fillColor(PRIMARY)
      .text(`Present: ${att.present || 0}    Absent: ${att.absent || 0}    Late: ${att.late || 0}    Total Days: ${att.total || 0}    Rate: ${att.pct != null ? att.pct.toFixed(1) + "%" : "—"}`,
        36, y);
    y += 22;
  }

  // ===== Remarks =====
  const remarkBox = (title, text, h = 50) => {
    if (y > 760 - h) { doc.addPage(); y = 50; }
    doc.font("Helvetica-Bold").fontSize(9).fillColor(PRIMARY).text(title, 36, y);
    y += 12;
    doc.roundedRect(36, y, pageW, h, 3).stroke("#cbd5e1");
    doc.font("Helvetica").fontSize(9).fillColor("#334155")
      .text(safe(text, "—"), 42, y + 6, { width: pageW - 12, height: h - 12 });
    y += h + 10;
  };
  remarkBox("Class Teacher's Remarks", card.class_teacher_remarks || card.teacher_remarks, 44);
  remarkBox("Principal / Headteacher's Remarks", card.principal_remarks, 44);

  // ===== Signatures =====
  if (y > 720) { doc.addPage(); y = 50; }
  y += 10;
  const sigY = y;
  const sigBlock = (label, name, x) => {
    doc.moveTo(x, sigY + 30).lineTo(x + 160, sigY + 30).stroke("#94a3b8");
    doc.font("Helvetica").fontSize(8).fillColor("#475569").text(label, x, sigY + 34);
    if (name) doc.font("Helvetica-Bold").fontSize(9).fillColor(PRIMARY).text(name, x, sigY + 46);
  };
  sigBlock("Class Teacher", null, 36);
  sigBlock("Principal", school.settings?.principal_name, 230);
  sigBlock("Parent / Guardian", null, 420);
  y = sigY + 70;

  // Footer
  doc.font("Helvetica-Oblique").fontSize(7).fillColor("#94a3b8")
    .text(
      `Generated ${new Date().toLocaleString()}  •  ${safe(school.name)}  •  Confidential`,
      36, 800, { width: pageW, align: "center" },
    );

  doc.end();
};

// ---------- ANALYTICS PDF ----------
exports.streamAnalyticsPdf = async ({ res, school, assessment, data }) => {
  const doc = new PDFDocument({ size: "A4", margin: 36 });
  doc.pipe(res);
  const pageW = doc.page.width - 72;
  const PRIMARY = "#0f172a";

  doc.rect(0, 0, doc.page.width, 80).fill(PRIMARY);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16)
    .text(safe(school.name), 36, 22);
  doc.font("Helvetica").fontSize(10).fillColor("#cbd5e1")
    .text("Assessment Analytics Report", 36, 46);
  doc.fillColor(PRIMARY);

  let y = 100;
  doc.font("Helvetica-Bold").fontSize(14).text(safe(assessment.name), 36, y);
  y += 20;
  doc.font("Helvetica").fontSize(10).fillColor("#475569")
    .text(`Status: ${safe(assessment.status)}  •  Generated: ${new Date().toLocaleString()}`, 36, y);
  y += 20;

  const overview = data.overview || {};
  doc.fillColor(PRIMARY).font("Helvetica-Bold").fontSize(11).text("Overview", 36, y); y += 14;
  doc.font("Helvetica").fontSize(10).fillColor(PRIMARY).text(
    `Students: ${overview.students_count || 0}    Marks: ${overview.marks_count || 0}    Mean %: ${fmt(overview.mean_pct)}    Max %: ${fmt(overview.max_pct)}`,
    36, y,
  ); y += 24;

  const drawTable = (title, rows, cols) => {
    if (y > 700) { doc.addPage(); y = 50; }
    doc.font("Helvetica-Bold").fontSize(11).fillColor(PRIMARY).text(title, 36, y); y += 14;
    doc.rect(36, y, pageW, 18).fill(PRIMARY);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    let x = 42;
    cols.forEach((c) => { doc.text(c.label, x, y + 5, { width: c.w - 6, align: c.a || "left" }); x += c.w; });
    y += 18;
    doc.fillColor(PRIMARY).font("Helvetica").fontSize(9);
    rows.forEach((r, i) => {
      if (y > 760) { doc.addPage(); y = 50; }
      if (i % 2 === 0) doc.rect(36, y, pageW, 16).fill("#f8fafc");
      doc.fillColor(PRIMARY);
      x = 42;
      cols.forEach((c) => {
        doc.text(String(c.fn(r) ?? "—"), x, y + 4, { width: c.w - 6, align: c.a || "left", ellipsis: true });
        x += c.w;
      });
      y += 16;
    });
    y += 10;
  };

  drawTable("Subject Means", data.subjects || [], [
    { label: "Subject", w: 220, fn: (r) => r.subject_name },
    { label: "N", w: 50, a: "right", fn: (r) => r.n },
    { label: "Mean %", w: 70, a: "right", fn: (r) => fmt(r.mean_pct) },
    { label: "Min %", w: 70, a: "right", fn: (r) => fmt(r.min_pct) },
    { label: "Max %", w: 70, a: "right", fn: (r) => fmt(r.max_pct) },
  ]);

  drawTable("Performance Band Distribution", data.bands || [], [
    { label: "Band", w: 100, fn: (r) => `${r.band_code} — ${BAND_LABELS[r.band_code] || ""}` },
    { label: "Learners", w: 100, a: "right", fn: (r) => r.n },
  ]);

  drawTable("Achievement Level Distribution", data.levels || [], [
    { label: "AL", w: 100, fn: (r) => r.code },
    { label: "Learners", w: 100, a: "right", fn: (r) => r.n },
  ]);

  drawTable("Top Performers", (data.leaderboard || []).slice(0, 20), [
    { label: "#", w: 30, fn: (r) => r.class_position },
    { label: "Student", w: 220, fn: (r) => `${r.first_name} ${r.last_name}` },
    { label: "Class", w: 120, fn: (r) => r.grade_name },
    { label: "Mean %", w: 80, a: "right", fn: (r) => fmt(r.percentage) },
    { label: "AL", w: 50, fn: (r) => r.overall_al },
  ]);

  doc.font("Helvetica-Oblique").fontSize(7).fillColor("#94a3b8")
    .text(`${safe(school.name)} — Confidential`, 36, 810, { width: pageW, align: "center" });

  doc.end();
};

// ---------- ANALYTICS EXCEL ----------
exports.buildAnalyticsXlsx = async ({ school, assessment, data }) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = safe(school.name, "School");
  wb.created = new Date();

  const overview = wb.addWorksheet("Overview");
  overview.columns = [{ width: 28 }, { width: 30 }];
  overview.addRows([
    ["School", safe(school.name)],
    ["Assessment", safe(assessment.name)],
    ["Status", safe(assessment.status)],
    ["Generated", new Date().toISOString()],
    [],
    ["Students", data.overview?.students_count || 0],
    ["Marks recorded", data.overview?.marks_count || 0],
    ["Mean %", Number(data.overview?.mean_pct || 0).toFixed(2)],
    ["Max %", Number(data.overview?.max_pct || 0).toFixed(2)],
  ]);
  overview.getRow(1).font = { bold: true };

  const sub = wb.addWorksheet("Subject Means");
  sub.addRow(["Subject", "Code", "N", "Mean %", "Min %", "Max %"]).font = { bold: true };
  (data.subjects || []).forEach((r) =>
    sub.addRow([r.subject_name, r.subject_code, r.n, +Number(r.mean_pct || 0).toFixed(2),
      +Number(r.min_pct || 0).toFixed(2), +Number(r.max_pct || 0).toFixed(2)]));
  sub.columns.forEach((c) => (c.width = 18));

  const bands = wb.addWorksheet("Bands");
  bands.addRow(["Band", "Label", "Learners"]).font = { bold: true };
  (data.bands || []).forEach((r) => bands.addRow([r.band_code, BAND_LABELS[r.band_code] || "", r.n]));

  const lvl = wb.addWorksheet("Achievement Levels");
  lvl.addRow(["AL", "Learners"]).font = { bold: true };
  (data.levels || []).forEach((r) => lvl.addRow([r.code, r.n]));

  const lb = wb.addWorksheet("Leaderboard");
  lb.addRow(["Pos", "Student", "Adm No.", "Class", "Stream", "Total", "Out of", "Mean %", "AL", "Band"])
    .font = { bold: true };
  (data.leaderboard || []).forEach((r) =>
    lb.addRow([r.class_position, `${r.first_name} ${r.last_name}`, r.admission_number,
      r.grade_name, r.stream_name, r.total_score, r.total_out_of,
      +Number(r.percentage || 0).toFixed(2), r.overall_al, r.overall_band]));
  lb.columns.forEach((c) => (c.width = 16));

  const grades = wb.addWorksheet("Class Means");
  grades.addRow(["Class", "N", "Mean %"]).font = { bold: true };
  (data.grades || []).forEach((r) => grades.addRow([r.grade_name, r.n, +Number(r.mean_pct || 0).toFixed(2)]));

  const streams = wb.addWorksheet("Stream Means");
  streams.addRow(["Class", "Stream", "N", "Mean %"]).font = { bold: true };
  (data.streams || []).forEach((r) =>
    streams.addRow([r.grade_name, r.stream_name, r.n, +Number(r.mean_pct || 0).toFixed(2)]));

  return wb;
};
