// =============================================================================
// PDF & EXCEL GENERATION for Assessment Results
// Produces school-branded CBE / 8-4-4 report cards (A4) and analytics exports.
// =============================================================================
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { queryOne, query } = require("../../config/database");

// ---------- Lato font registration ----------
// All generated PDFs use Lato. We register four variants once per doc.
const FONT_DIR = path.join(__dirname, "..", "..", "..", "assets", "fonts");
const LATO = {
  regular: path.join(FONT_DIR, "Lato-Regular.ttf"),
  bold: path.join(FONT_DIR, "Lato-Bold.ttf"),
  italic: path.join(FONT_DIR, "Lato-Italic.ttf"),
  boldItalic: path.join(FONT_DIR, "Lato-BoldItalic.ttf"),
};
function registerLato(doc) {
  try {
    if (fs.existsSync(LATO.regular)) doc.registerFont("Body", LATO.regular);
    if (fs.existsSync(LATO.bold)) doc.registerFont("Heading", LATO.bold);
    if (fs.existsSync(LATO.italic)) doc.registerFont("Italic", LATO.italic);
    if (fs.existsSync(LATO.boldItalic))
      doc.registerFont("BoldItalic", LATO.boldItalic);
    doc.font("Body");
  } catch {
    // Fall back to built-ins silently
  }
}
// Convenience helpers: doc.font("Heading") / "Body" / "Italic"

// In-memory cache for downloaded logos
const _logoCache = new Map();
async function fetchLogoBuffer(url) {
  if (!url) return null;
  if (_logoCache.has(url)) return _logoCache.get(url);
  try {
    // Local path support (relative to project root or absolute)
    if (!/^https?:\/\//i.test(url)) {
      const abs = path.isAbsolute(url) ? url : path.join(process.cwd(), url);
      if (fs.existsSync(abs)) {
        const buf = fs.readFileSync(abs);
        _logoCache.set(url, buf);
        return buf;
      }
      return null;
    }
    const resp = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 5000,
    });
    const buf = Buffer.from(resp.data);
    _logoCache.set(url, buf);
    return buf;
  } catch {
    return null;
  }
}

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
  if (!termStart || !termEnd)
    return { present: 0, absent: 0, late: 0, total: 0, pct: null };
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
  if (!row || !row.total)
    return { present: 0, absent: 0, late: 0, total: 0, pct: null };
  const pct = row.total
    ? (Number(row.present) / Number(row.total)) * 100
    : null;
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
  EE: "#16a34a",
  ME: "#2563eb",
  AE: "#d97706",
  BE: "#dc2626",
};

// ---------- REPORT CARD PDF ----------
exports.streamReportCardPdf = async ({ res, schoolId, card, school }) => {
  const payload =
    typeof card.payload === "string" ? JSON.parse(card.payload) : card.payload;
  const att = await loadAttendance(
    schoolId,
    card.student_id,
    payload?.term_start || payload?.start_date,
    payload?.term_end || payload?.end_date,
  );

  // Template settings (controls position, band, competencies visibility)
  const tpl = (payload && payload.template) || {};
  const showPosition = tpl.show_position !== false && tpl.show_position !== 0;

  const doc = new PDFDocument({ size: "A4", margins: { top: 40, bottom: 20, left: 40, right: 40 } });
  registerLato(doc);
  doc.pipe(res);

  const pageW = doc.page.width - 80;
  const PRIMARY = "#0b1d3a";
  const ACCENT = "#1d4ed8";
  const SOFT = "#475569";
  const MUTED = "#94a3b8";

  // ===== Header band =====
  doc.rect(0, 0, doc.page.width, 85).fill(PRIMARY);
  // Accent ribbon
  doc.rect(0, 85, doc.page.width, 4).fill(ACCENT);

  // School logo (left side, if available)
  const logoUrl =
    school.settings?.logo_url ||
    school.logo_url ||
    school.settings?.report_card_logo ||
    null;
  const logoBuf = await fetchLogoBuffer(logoUrl);
  let textStartX = 40;
  if (logoBuf) {
    try {
      doc.image(logoBuf, 40, 15, { fit: [55, 55] });
      textStartX = 105;
    } catch {
      /* invalid image, ignore */
    }
  }

  doc.fillColor("#ffffff");
  // Full available width for the school name (no curriculum chip on the right anymore)
  const headerRight = doc.page.width - 40;
  const headerTextWidth = headerRight - textStartX;
  doc
    .fontSize(16)
    .font("Heading")
    .text(safe(school.name, "School").toUpperCase(), textStartX, 18, {
      width: headerTextWidth,
      characterSpacing: 0.5,
    });
  doc.fontSize(8).font("Body").fillColor("#cbd5e1");
  doc.text(safe(school.address), textStartX, 38, {
    width: headerTextWidth,
  });
  doc.text(
    `Tel: ${safe(school.phone)}   Email: ${safe(school.email)}`,
    textStartX,
    49,
    { width: headerTextWidth },
  );
  if (school.settings?.motto) {
    doc
      .fillColor("#fde68a")
      .font("Italic")
      .fontSize(8)
      .text(`"${school.settings.motto}"`, textStartX, 62, {
        width: headerTextWidth,
      });
  }
  // Curriculum label (used inside the body, no header chip — keeps header
  // text uncluttered for schools with long names).
  const curriculumRaw = String(school.curriculum_type || "CBC").toUpperCase();
  const curriculumLabel = curriculumRaw === "CBC" ? "CBE" : curriculumRaw;

  doc.fillColor(PRIMARY);
  let y = 98;

  // ===== Title =====
  doc
    .font("Heading")
    .fontSize(14)
    .fillColor(PRIMARY)
    .text("LEARNER'S PROGRESS REPORT", 40, y, {
      width: pageW,
      align: "center",
      characterSpacing: 1,
    });
  y += 16;
  doc
    .font("Italic")
    .fontSize(9)
    .fillColor(SOFT)
    .text(safe(payload.assessment_name), 40, y, {
      width: pageW,
      align: "center",
    });
  y += 14;

  // ===== Student details box =====
  doc.fillColor(PRIMARY).font("Heading").fontSize(8);
  const boxH = 40;
  doc.roundedRect(40, y, pageW, boxH, 6).fillAndStroke("#f8fafc", "#e2e8f0");
  doc.fillColor(PRIMARY);
  const col = (label, val, x, yy) => {
    doc
      .font("Heading")
      .fontSize(6)
      .fillColor(MUTED)
      .text(String(label).toUpperCase(), x, yy, { characterSpacing: 0.6 });
    doc
      .font("Heading")
      .fontSize(9)
      .fillColor(PRIMARY)
      .text(safe(val), x, yy + 8);
  };
  const c1 = 52,
    c2 = 230,
    c3 = 410;
  col(
    "STUDENT NAME",
    `${payload.first_name || ""} ${payload.last_name || ""}`.trim(),
    c1,
    y + 6,
  );
  col("ADMISSION NO.", payload.admission_number, c1, y + 22);
  col("CLASS", payload.grade_name, c2, y + 6);
  col("STREAM", payload.stream_name, c2, y + 22);
  if (showPosition) {
    let posStr = String(payload.class_position || "—");
    if (payload.class_position != null && payload.previous_assessment && payload.previous_assessment.class_position != null) {
      const diff = payload.previous_assessment.class_position - payload.class_position;
      if (diff > 0) posStr += ` (▲${diff})`;
      else if (diff < 0) posStr += ` (▼${Math.abs(diff)})`;
      else posStr += ` (--)`;
    }
    col("POSITION (CLASS)", posStr, c3, y + 6);
  } else {
    col("CURRICULUM", curriculumLabel, c3, y + 6);
  }
  
  let overallPctStr = String(fmt(payload.percentage));
  if (payload.percentage != null && payload.previous_assessment && payload.previous_assessment.percentage != null) {
    const diff = payload.percentage - payload.previous_assessment.percentage;
    const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff < 0 ? diff.toFixed(1) : "0.0";
    overallPctStr += ` (${diffStr}%)`;
  }
  col("OVERALL %", overallPctStr, c3, y + 22);
  y += boxH + 6;

  // ===== Subject table =====
  doc
    .font("Heading")
    .fontSize(9)
    .fillColor(PRIMARY)
    .text("Subject Performance", 36, y);
  y += 12;
  const headers = [
    { t: "Subject", w: 150 },
    { t: "Score", w: 45, a: "right" },
    { t: "Out Of", w: 40, a: "right" },
    { t: "%", w: 35, a: "right" },
    { t: "Dev", w: 40, a: "right" },
    { t: "AL", w: 35, a: "center" },
    { t: "Band", w: 45, a: "center" },
    { t: "Remarks", w: pageW - 390 },
  ];
  // table header
  doc.rect(40, y, pageW, 22).fill(PRIMARY);
  doc.fillColor("#ffffff").font("Heading").fontSize(9);
  let x = 46;
  for (const h of headers) {
    doc.text(String(h.t).toUpperCase(), x, y + 5, {
      width: h.w - 6,
      align: h.a || "left",
      characterSpacing: 0.5,
    });
    x += h.w;
  }
  y += 18;
  doc.font("Body").fontSize(8).fillColor(PRIMARY);

  const marks = payload.marks || [];
  marks.forEach((m, i) => {
    if (y > 780) {
      doc.addPage();
      y = 50;
    }
    const rowH = 14;
    if (i % 2 === 0) doc.rect(40, y, pageW, rowH).fill("#f8fafc");
    doc.fillColor(PRIMARY);
    const pct = m.out_of ? (Number(m.score) / Number(m.out_of)) * 100 : null;
    let devStr = "—";
    if (pct != null && payload.previous_assessment) {
      const prevMark = payload.previous_assessment.marks.find(pm => pm.subject_id === m.subject_id);
      if (prevMark && prevMark.percentage != null) {
        const diff = pct - prevMark.percentage;
        devStr = diff > 0 ? `+${diff.toFixed(0)}` : diff < 0 ? diff.toFixed(0) : "0";
      }
    }

    const cells = [
      m.subject_name,
      m.score == null ? "—" : Number(m.score).toFixed(0),
      m.out_of == null ? "—" : Number(m.out_of).toFixed(0),
      fmt(pct),
      devStr,
      safe(m.achievement_level_code, "—"),
      safe(m.band_code, "—"),
      safe(m.remarks || m.teacher_remark || m.remark, ""),
    ];
    x = 46;
    cells.forEach((c, idx) => {
      doc
        .font("Body")
        .fontSize(8)
        .text(String(c), x, y + 3, {
          width: headers[idx].w - 6,
          align: headers[idx].a || "left",
          ellipsis: true,
        });
      x += headers[idx].w;
    });
    y += rowH;
  });
  if (!marks.length) {
    doc
      .fillColor("#94a3b8")
      .font("Italic")
      .fontSize(8)
      .text("No marks recorded.", 42, y + 3);
    y += 14;
  }

  y += 6;

  // ===== Summary strip =====
  if (y > 720) {
    doc.addPage();
    y = 50;
  }
  const sumH = 40;
  doc.roundedRect(40, y, pageW, sumH, 6).fillAndStroke("#eff6ff", "#bfdbfe");
  doc.fillColor(PRIMARY);
  const sCell = (label, val, x, yy, color) => {
    doc
      .font("Heading")
      .fontSize(6)
      .fillColor(SOFT)
      .text(String(label).toUpperCase(), x, yy, { characterSpacing: 0.6 });
    doc
      .font("Heading")
      .fontSize(11)
      .fillColor(color || PRIMARY)
      .text(safe(val), x, yy + 8);
  };
  sCell(
    "TOTAL SCORE",
    `${fmt(payload.total_score, 0)} / ${fmt(payload.total_out_of, 0)}`,
    52,
    y + 10,
  );
  sCell("MEAN %", overallPctStr, 200, y + 10, ACCENT);
  // Overall AL = sum of subject AL points (CBC convention) — e.g. 6 subjects of AL7 → AL42
  const totalPts =
    payload.total_points != null ? Number(payload.total_points) : null;
  const overallAlLabel =
    totalPts != null && !isNaN(totalPts)
      ? `AL${Math.round(totalPts)}`
      : safe(payload.overall_al);
  sCell("OVERALL AL", overallAlLabel, 310, y + 10);
  sCell(
    "OVERALL BAND",
    payload.overall_band
      ? `${payload.overall_band} — ${BAND_LABELS[payload.overall_band] || ""}`
      : "—",
    400,
    y + 10,
    BAND_COLORS[payload.overall_band],
  );
  y += sumH + 6;

  // ===== Performance Trend =====
  if (payload.progress && payload.progress.trend && payload.progress.trend.length > 1) {
    const trend = payload.progress.trend;
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    
    doc.font("Heading").fontSize(9).fillColor(PRIMARY).text("Performance Trend", 36, y);
    y += 10;
    
    const chartX = 42;
    const chartY = y + 8;
    const chartW = 300;
    const chartH = 50;
    
    // Grid lines
    doc.lineWidth(0.5).strokeColor("#e2e8f0");
    doc.moveTo(chartX, chartY).lineTo(chartX + chartW, chartY).stroke();
    doc.moveTo(chartX, chartY + chartH / 2).lineTo(chartX + chartW, chartY + chartH / 2).stroke();
    doc.moveTo(chartX, chartY + chartH).lineTo(chartX + chartW, chartY + chartH).stroke();
    
    // Calculate scaling
    const pcts = trend.map((t) => Number(t.percentage || 0));
    const minPct = Math.min(...pcts);
    const maxPct = Math.max(...pcts);
    const range = Math.max(10, maxPct - minPct); // Ensure we have a minimum range
    const padMin = Math.max(0, minPct - range * 0.2);
    const padMax = Math.min(100, maxPct + range * 0.2);
    const scale = padMax - padMin;
    
    const stepX = chartW / Math.max(1, trend.length - 1);
    
    // Draw the line
    doc.lineWidth(1.5).strokeColor(ACCENT);
    let first = true;
    trend.forEach((t, i) => {
      const pct = Number(t.percentage || 0);
      const px = chartX + i * stepX;
      const py = chartY + chartH - ((pct - padMin) / scale) * chartH;
      if (first) {
        doc.moveTo(px, py);
        first = false;
      } else {
        doc.lineTo(px, py);
      }
    });
    doc.stroke();
    
    // Draw data points and labels
    trend.forEach((t, i) => {
      const pct = Number(t.percentage || 0);
      const px = chartX + i * stepX;
      const py = chartY + chartH - ((pct - padMin) / scale) * chartH;
      
      // Point
      doc.lineWidth(1.5).circle(px, py, 3).fillAndStroke("#ffffff", ACCENT);
      
      // Score label
      doc.font("Heading").fontSize(7).fillColor(PRIMARY);
      doc.text(pct.toFixed(1) + "%", px - 15, py - 12, { width: 30, align: "center" });
      
      // Assessment name label (bottom)
      doc.font("Body").fontSize(6).fillColor(MUTED);
      const shortName = t.name.length > 12 ? t.name.substring(0, 10) + ".." : t.name;
      doc.text(shortName, px - 25, chartY + chartH + 6, { width: 50, align: "center" });
    });
    
    y = chartY + chartH + 24;
  }

  // ===== Attendance =====
  if (school.settings?.show_attendance_on_card !== 0) {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    doc
      .font("Heading")
      .fontSize(10)
      .fillColor(PRIMARY)
      .text("Attendance Summary", 36, y);
    y += 10;
    doc
      .font("Body")
      .fontSize(8)
      .fillColor(PRIMARY)
      .text(
        `Present: ${att.present || 0}    Absent: ${att.absent || 0}    Late: ${att.late || 0}    Total Days: ${att.total || 0}    Rate: ${att.pct != null ? att.pct.toFixed(1) + "%" : "—"}`,
        36,
        y,
      );
    y += 14;
  }

  // ===== Term Dates =====
  if (tpl.closing_date || tpl.opening_date) {
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
    const datesText = [
      tpl.closing_date ? `Closing: ${tpl.closing_date}` : "",
      tpl.opening_date ? `Opening: ${tpl.opening_date}` : ""
    ].filter(Boolean).join("    |    ");
    
    doc.font("Heading").fontSize(8).fillColor(PRIMARY).text("Term Dates", 36, y);
    y += 10;
    doc.font("Body").fontSize(8).fillColor(PRIMARY).text(datesText, 36, y);
    y += 14;
  }

  // ===== Remarks =====
  const remarkBox = (title, text, h = 32) => {
    if (y > 770 - h) {
      doc.addPage();
      y = 50;
    }
    doc.font("Heading").fontSize(8).fillColor(PRIMARY).text(title, 36, y);
    y += 10;
    doc.roundedRect(36, y, pageW, h, 3).stroke("#cbd5e1");
    doc
      .font("Body")
      .fontSize(8)
      .fillColor("#334155")
      .text(safe(text, "—"), 42, y + 4, { width: pageW - 12, height: h - 8 });
    y += h + 6;
  };
  remarkBox(
    "Class Teacher's Remarks",
    card.class_teacher_remarks || card.teacher_remarks,
    34,
  );
  remarkBox("Principal / Headteacher's Remarks", card.principal_remarks, 34);

  // ===== Signatures =====
  // Reserve enough room for sigs (50px) AND footer (25px) on the same page
  if (y > doc.page.height - 70) {
    doc.addPage();
    y = 50;
  }
  y += 6;
  const sigY = y;
  const sigBlock = (label, name, x) => {
    doc
      .moveTo(x, sigY + 24)
      .lineTo(x + 160, sigY + 24)
      .stroke("#94a3b8");
    doc
      .font("Body")
      .fontSize(7)
      .fillColor("#475569")
      .text(label, x, sigY + 28);
    if (name)
      doc
        .font("Heading")
        .fontSize(8)
        .fillColor(PRIMARY)
        .text(name, x, sigY + 38);
  };
  sigBlock("Class Teacher", null, 36);
  sigBlock("Principal", school.settings?.principal_name, 230);
  sigBlock("Parent / Guardian", null, 420);
  y = sigY + 50;

  // Footer — always pinned to the bottom of the CURRENT page so we never
  // spill onto a near-empty second page. Using Math.max here previously
  // pushed the footer past page.height when signatures sat low, forcing
  // pdfkit to auto-add a blank page just for the footer.
  const footerY = doc.page.height - 30; // safer padding to prevent auto page-break
  doc
    .font("Italic")
    .fontSize(7)
    .fillColor("#94a3b8")
    .text(
      `Generated ${new Date().toLocaleString()}  •  ${safe(school.name)}  •  Confidential`,
      36,
      footerY,
      { width: pageW, align: "center", lineBreak: false, height: 10 },
    );

  doc.end();
};

// ---------- COMBINED REPORT CARDS PDF ----------
// Renders every card in a run as its own PDF, then merges all pages
// into a single multi-page PDF using pdf-lib.
exports.streamCombinedReportCardsPdf = async ({
  res,
  schoolId,
  school,
  cards,
}) => {
  const { PassThrough } = require("stream");
  const { PDFDocument: PDFLibDoc } = require("pdf-lib");

  const out = await PDFLibDoc.create();
  for (const card of cards) {
    if (!card) continue;
    // Render single card to buffer
    const pt = new PassThrough();
    const chunks = [];
    const done = new Promise((resolve, reject) => {
      pt.on("data", (d) => chunks.push(d));
      pt.on("end", () => resolve(Buffer.concat(chunks)));
      pt.on("error", reject);
    });
    await exports.streamReportCardPdf({ res: pt, schoolId, card, school });
    const buf = await done;
    try {
      const src = await PDFLibDoc.load(buf);
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    } catch (e) {
      console.error("[combined-pdf] failed to merge card", card?.id, e.message);
    }
  }
  const bytes = await out.save();
  res.end(Buffer.from(bytes));
};

// ---------- ANALYTICS PDF ----------
exports.streamAnalyticsPdf = async ({ res, school, assessment, data }) => {
  const doc = new PDFDocument({ size: "A4", margins: { top: 36, bottom: 20, left: 36, right: 36 } });
  registerLato(doc);
  doc.pipe(res);
  const pageW = doc.page.width - 72;
  const PRIMARY = "#0b1d3a";
  const ACCENT = "#1d4ed8";
  const SOFT = "#475569";
  const MUTED = "#94a3b8";

  // ===== Branded header =====
  doc.rect(0, 0, doc.page.width, 110).fill(PRIMARY);
  doc.rect(0, 110, doc.page.width, 4).fill(ACCENT);

  const logoUrl =
    school.settings?.logo_url ||
    school.logo_url ||
    school.settings?.report_card_logo ||
    null;
  const logoBuf = await fetchLogoBuffer(logoUrl);
  let textStartX = 36;
  if (logoBuf) {
    try {
      doc.image(logoBuf, 36, 22, { fit: [66, 66] });
      textStartX = 112;
    } catch {
      /* ignore */
    }
  }

  const headerW = doc.page.width - 36 - textStartX;
  doc
    .fillColor("#ffffff")
    .font("Heading")
    .fontSize(18)
    .text(safe(school.name, "School").toUpperCase(), textStartX, 26, {
      width: headerW,
      characterSpacing: 0.4,
    });
  doc
    .font("Body")
    .fontSize(9)
    .fillColor("#cbd5e1")
    .text(safe(school.address), textStartX, 52, { width: headerW });
  doc.text(
    `Tel: ${safe(school.phone)}   Email: ${safe(school.email)}`,
    textStartX,
    65,
    { width: headerW },
  );
  if (school.settings?.motto) {
    doc
      .font("Italic")
      .fontSize(9)
      .fillColor("#fde68a")
      .text(`"${school.settings.motto}"`, textStartX, 82, { width: headerW });
  }

  let y = 134;

  // ===== Title =====
  doc
    .font("Heading")
    .fontSize(15)
    .fillColor(PRIMARY)
    .text("ASSESSMENT ANALYTICS REPORT", 36, y, {
      width: pageW,
      align: "center",
      characterSpacing: 0.6,
    });
  y += 22;
  doc
    .font("Italic")
    .fontSize(10)
    .fillColor(SOFT)
    .text(safe(assessment.name), 36, y, { width: pageW, align: "center" });
  y += 18;

  // Filter chips (if any)
  const f = data.filters || {};
  const chips = [];
  if (f.grade_id) chips.push(`Class filter applied`);
  if (f.stream_id) chips.push(`Stream filter applied`);
  if (f.subject_id) chips.push(`Subject filter applied`);
  if (chips.length) {
    doc
      .font("Body")
      .fontSize(9)
      .fillColor(ACCENT)
      .text(chips.join("   •   "), 36, y, { width: pageW, align: "center" });
    y += 14;
  }
  doc
    .font("Body")
    .fontSize(8)
    .fillColor(MUTED)
    .text(
      `Status: ${safe(assessment.status)}   •   Generated: ${new Date().toLocaleString()}`,
      36,
      y,
      { width: pageW, align: "center" },
    );
  y += 22;

  // ===== Overview cards =====
  const overview = data.overview || {};
  const stats = [
    { label: "STUDENTS", value: String(overview.students_count || 0) },
    { label: "MARKS RECORDED", value: String(overview.marks_count || 0) },
    { label: "MEAN %", value: fmt(overview.mean_pct) },
    { label: "TOP %", value: fmt(overview.max_pct) },
  ];
  const cardW = (pageW - 18) / 4;
  stats.forEach((s, i) => {
    const cx = 36 + i * (cardW + 6);
    doc.roundedRect(cx, y, cardW, 58, 6).fillAndStroke("#f8fafc", "#e2e8f0");
    doc
      .font("Heading")
      .fontSize(7)
      .fillColor(MUTED)
      .text(s.label, cx + 10, y + 10, {
        width: cardW - 20,
        characterSpacing: 0.6,
      });
    doc
      .font("Heading")
      .fontSize(18)
      .fillColor(PRIMARY)
      .text(s.value, cx + 10, y + 24, { width: cardW - 20 });
  });
  y += 76;

  const drawTable = (title, rows, cols) => {
    // Estimate table height (header + rows) and break early if needed.
    const estimated = 30 + rows.length * 16 + 20;
    if (y + estimated > doc.page.height - 40 && rows.length > 4) {
      // only break if there isn't enough room AND we have meaningful content
    }
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 50;
    }
    doc.font("Heading").fontSize(12).fillColor(PRIMARY).text(title, 36, y);
    y += 18;
    doc.rect(36, y, pageW, 20).fill(PRIMARY);
    doc.fillColor("#ffffff").font("Heading").fontSize(9);
    let x = 42;
    cols.forEach((c) => {
      doc.text(c.label.toUpperCase(), x, y + 6, {
        width: c.w - 6,
        align: c.a || "left",
        characterSpacing: 0.5,
      });
      x += c.w;
    });
    y += 20;
    doc.fillColor(PRIMARY).font("Body").fontSize(9);
    if (!rows.length) {
      doc
        .font("Italic")
        .fontSize(9)
        .fillColor(MUTED)
        .text("No data for the selected filters.", 42, y + 6);
      y += 22;
    }
    rows.forEach((r, i) => {
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 50;
      }
      const rowH = 18;
      if (i % 2 === 0) doc.rect(36, y, pageW, rowH).fill("#f8fafc");
      doc.fillColor(PRIMARY);
      x = 42;
      cols.forEach((c) => {
        doc
          .font("Body")
          .fontSize(9)
          .text(String(c.fn(r) ?? "—"), x, y + 5, {
            width: c.w - 6,
            align: c.a || "left",
            ellipsis: true,
          });
        x += c.w;
      });
      y += rowH;
    });
    y += 16;
  };

  drawTable("Subject Means", data.subjects || [], [
    { label: "Subject", w: 220, fn: (r) => r.subject_name },
    { label: "N", w: 50, a: "right", fn: (r) => r.n },
    { label: "Mean %", w: 70, a: "right", fn: (r) => fmt(r.mean_pct) },
    { label: "Min %", w: 70, a: "right", fn: (r) => fmt(r.min_pct) },
    { label: "Max %", w: 70, a: "right", fn: (r) => fmt(r.max_pct) },
  ]);

  drawTable("Performance Band Distribution", data.bands || [], [
    {
      label: "Band",
      w: 100,
      fn: (r) => `${r.band_code} — ${BAND_LABELS[r.band_code] || ""}`,
    },
    { label: "Learners", w: 100, a: "right", fn: (r) => r.n },
  ]);

  drawTable("Achievement Level Distribution", data.levels || [], [
    { label: "AL", w: 100, fn: (r) => r.code },
    { label: "Learners", w: 100, a: "right", fn: (r) => r.n },
  ]);

  const topPerformers = (data.leaderboard || [])
    .slice()
    .sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0))
    .slice(0, 20)
    .map((r, i) => ({ ...r, _rank: i + 1 }));
  drawTable("Top Performers", topPerformers, [
    { label: "Rank", w: 40, fn: (r) => r._rank },
    { label: "Student", w: 220, fn: (r) => `${r.first_name} ${r.last_name}` },
    {
      label: "Class",
      w: 110,
      fn: (r) =>
        `${r.grade_name || ""}${r.stream_name ? " · " + r.stream_name : ""}`,
    },
    { label: "Mean %", w: 80, a: "right", fn: (r) => fmt(r.percentage) },
    { label: "AL", w: 50, fn: (r) => r.overall_al },
  ]);

  doc
    .font("Italic")
    .fontSize(7)
    .fillColor("#94a3b8")
    .text(
      `Generated ${new Date().toLocaleString()}  •  ${safe(school.name)}  •  Confidential`,
      36,
      doc.page.height - 25,
      {
        width: pageW,
        align: "center",
        lineBreak: false,
      },
    );

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
  sub.addRow(["Subject", "Code", "N", "Mean %", "Min %", "Max %"]).font = {
    bold: true,
  };
  (data.subjects || []).forEach((r) =>
    sub.addRow([
      r.subject_name,
      r.subject_code,
      r.n,
      +Number(r.mean_pct || 0).toFixed(2),
      +Number(r.min_pct || 0).toFixed(2),
      +Number(r.max_pct || 0).toFixed(2),
    ]),
  );
  sub.columns.forEach((c) => (c.width = 18));

  const bands = wb.addWorksheet("Bands");
  bands.addRow(["Band", "Label", "Learners"]).font = { bold: true };
  (data.bands || []).forEach((r) =>
    bands.addRow([r.band_code, BAND_LABELS[r.band_code] || "", r.n]),
  );

  const lvl = wb.addWorksheet("Achievement Levels");
  lvl.addRow(["AL", "Learners"]).font = { bold: true };
  (data.levels || []).forEach((r) => lvl.addRow([r.code, r.n]));

  const lb = wb.addWorksheet("Leaderboard");
  lb.addRow([
    "Pos",
    "Student",
    "Adm No.",
    "Class",
    "Stream",
    "Total",
    "Out of",
    "Mean %",
    "AL",
    "Band",
  ]).font = { bold: true };
  (data.leaderboard || []).forEach((r) =>
    lb.addRow([
      r.class_position,
      `${r.first_name} ${r.last_name}`,
      r.admission_number,
      r.grade_name,
      r.stream_name,
      r.total_score,
      r.total_out_of,
      +Number(r.percentage || 0).toFixed(2),
      r.overall_al,
      r.overall_band,
    ]),
  );
  lb.columns.forEach((c) => (c.width = 16));

  const grades = wb.addWorksheet("Class Means");
  grades.addRow(["Class", "N", "Mean %"]).font = { bold: true };
  (data.grades || []).forEach((r) =>
    grades.addRow([r.grade_name, r.n, +Number(r.mean_pct || 0).toFixed(2)]),
  );

  const streams = wb.addWorksheet("Stream Means");
  streams.addRow(["Class", "Stream", "N", "Mean %"]).font = { bold: true };
  (data.streams || []).forEach((r) =>
    streams.addRow([
      r.grade_name,
      r.stream_name,
      r.n,
      +Number(r.mean_pct || 0).toFixed(2),
    ]),
  );

  return wb;
};

// =============================================================================
// SUMMATIVE REPORT CARDS PDF
// =============================================================================

exports.streamSummativeCardPdf = async ({ res, school, card, assessments, title }) => {
  const doc = new PDFDocument({ size: "A4", margins: { top: 40, bottom: 20, left: 40, right: 40 } });
  registerLato(doc);
  doc.pipe(res);

  const pageW = doc.page.width - 80;
  const PRIMARY = "#0b1d3a";
  const ACCENT = "#1d4ed8";
  const SOFT = "#475569";
  const MUTED = "#94a3b8";

  // Header band
  doc.rect(0, 0, doc.page.width, 116).fill(PRIMARY);
  doc.rect(0, 116, doc.page.width, 4).fill(ACCENT);

  const logoUrl = school.settings?.logo_url || school.logo_url || null;
  const logoBuf = await fetchLogoBuffer(logoUrl);
  let textStartX = 40;
  if (logoBuf) {
    try {
      doc.image(logoBuf, 40, 26, { fit: [70, 70] });
      textStartX = 120;
    } catch {}
  }

  const headerRight = doc.page.width - 40;
  const headerTextWidth = headerRight - textStartX;
  doc.fillColor("#ffffff").fontSize(20).font("Heading").text(safe(school.name, "School").toUpperCase(), textStartX, 30, { width: headerTextWidth, characterSpacing: 0.5 });
  doc.fontSize(9).font("Body").fillColor("#cbd5e1").text(safe(school.address), textStartX, 56, { width: headerTextWidth });
  doc.text(`Tel: ${safe(school.phone)}   Email: ${safe(school.email)}`, textStartX, 69, { width: headerTextWidth });
  if (school.settings?.motto) {
    doc.fillColor("#fde68a").font("Italic").fontSize(9).text(`"${school.settings.motto}"`, textStartX, 86, { width: headerTextWidth });
  }

  doc.fillColor(PRIMARY);
  let y = 136;

  // Title
  doc.font("Heading").fontSize(16).fillColor(PRIMARY).text(title || "SUMMATIVE REPORT", 40, y, { width: pageW, align: "center", characterSpacing: 1 });
  y += 22;
  const subtitle = assessments.map(a => a.name).join(" + ");
  doc.font("Italic").fontSize(10).fillColor(SOFT).text(subtitle, 40, y, { width: pageW, align: "center" });
  y += 24;

  // Student details
  doc.fillColor(PRIMARY).font("Heading").fontSize(10);
  const boxH = 50;
  doc.roundedRect(40, y, pageW, boxH, 6).fillAndStroke("#f8fafc", "#e2e8f0");
  doc.fillColor(PRIMARY);
  const col = (label, val, x, yy) => {
    doc.font("Heading").fontSize(7).fillColor(MUTED).text(String(label).toUpperCase(), x, yy, { characterSpacing: 0.6 });
    doc.font("Heading").fontSize(11).fillColor(PRIMARY).text(safe(val), x, yy + 11);
  };
  
  col("STUDENT NAME", `${card.first_name || ""} ${card.last_name || ""}`.trim(), 52, y + 12);
  col("ADMISSION NO.", card.admission_number, 230, y + 12);
  col("CLASS", `${card.grade_name || ""}${card.stream_name ? " - " + card.stream_name : ""}`, 380, y + 12);
  col("OVERALL %", fmt(card.percentage), 470, y + 12);
  
  y += boxH + 16;

  // Subject table
  doc.font("Heading").fontSize(11).fillColor(PRIMARY).text("Subject Performance", 36, y);
  y += 16;
  
  // Calculate column widths
  const subjectW = 150;
  const scoreCols = assessments.length;
  const colW = Math.min(80, Math.floor(320 / scoreCols));
  
  doc.rect(40, y, pageW, 22).fill(PRIMARY);
  doc.fillColor("#ffffff").font("Heading").fontSize(9);
  
  doc.text("SUBJECT", 46, y + 7, { width: subjectW - 6, characterSpacing: 0.5 });
  let x = 46 + subjectW;
  assessments.forEach(a => {
    const shortName = a.name.length > 10 ? a.name.substring(0, 8) + ".." : a.name;
    doc.text(shortName.toUpperCase(), x, y + 7, { width: colW - 6, align: "center" });
    x += colW;
  });
  doc.text("AVG %", x, y + 7, { width: 50, align: "center" });
  
  y += 22;
  
  doc.font("Body").fontSize(9).fillColor(PRIMARY);
  const marks = card.marks || [];
  
  marks.forEach((m, i) => {
    if (y > 720) { doc.addPage(); y = 50; }
    const rowH = 20;
    if (i % 2 === 0) doc.rect(40, y, pageW, rowH).fill("#f8fafc");
    
    doc.fillColor(PRIMARY);
    doc.font("Body").fontSize(9).text(m.subject_name, 46, y + 6, { width: subjectW - 6, ellipsis: true });
    
    let xx = 46 + subjectW;
    assessments.forEach(a => {
      const val = m.assessments[a.id];
      const txt = val && val.percentage != null ? Number(val.percentage).toFixed(0) + "%" : "—";
      doc.text(txt, xx, y + 6, { width: colW - 6, align: "center" });
      xx += colW;
    });
    
    doc.font("Heading").text(m.average_percentage != null ? m.average_percentage.toFixed(1) + "%" : "—", xx, y + 6, { width: 50, align: "center" });
    
    y += rowH;
  });
  
  y += 14;

  // Summary strip
  if (y > 640) { doc.addPage(); y = 50; }
  const sumH = 66;
  doc.roundedRect(40, y, pageW, sumH, 6).fillAndStroke("#eff6ff", "#bfdbfe");
  doc.fillColor(PRIMARY);
  const sCell = (label, val, cx, yy, color) => {
    doc.font("Heading").fontSize(7).fillColor(SOFT).text(String(label).toUpperCase(), cx, yy, { characterSpacing: 0.6 });
    doc.font("Heading").fontSize(14).fillColor(color || PRIMARY).text(safe(val), cx, yy + 11);
  };
  
  sCell("OVERALL MEAN %", fmt(card.percentage), 52, y + 14, ACCENT);
  sCell("OVERALL AL", safe(card.overall_al), 200, y + 14);
  sCell("OVERALL BAND", safe(card.overall_band), 300, y + 14);
  sCell("CLASS POSITION", safe(card.class_position), 420, y + 14);
  
  y += sumH + 30;

  // Footer
  const footerY = doc.page.height - 25;
  doc.font("Italic").fontSize(7).fillColor("#94a3b8").text(`Generated ${new Date().toLocaleString()}  •  ${safe(school.name)}  •  Confidential`, 36, footerY, { width: pageW, align: "center", lineBreak: false });

  doc.end();
};

exports.streamCombinedSummativePdf = async ({ res, school, cards, assessments, title }) => {
  const { PassThrough } = require("stream");
  const { PDFDocument: PDFLibDoc } = require("pdf-lib");

  const out = await PDFLibDoc.create();
  for (const card of cards) {
    if (!card) continue;
    const pt = new PassThrough();
    const chunks = [];
    const done = new Promise((resolve, reject) => {
      pt.on("data", (d) => chunks.push(d));
      pt.on("end", () => resolve(Buffer.concat(chunks)));
      pt.on("error", reject);
    });
    await exports.streamSummativeCardPdf({ res: pt, school, card, assessments, title });
    const buf = await done;
    try {
      const src = await PDFLibDoc.load(buf);
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    } catch (e) {
      console.error("[summative-pdf] failed to merge card", card?.student_id, e.message);
    }
  }
  const bytes = await out.save();
  res.end(Buffer.from(bytes));
};
