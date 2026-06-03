const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const { queryOne, query } = require("../../config/database");
const financeRepository = require("./finance.repository");

const fetchContext = async (studentId, schoolId, termId) => {
  const school = await queryOne(
    "SELECT name, code, email, phone, address, logo_url FROM schools WHERE id = ?",
    [schoolId],
  );
  const student = await queryOne(
    "SELECT id, admission_number, first_name, middle_name, last_name, full_name, grade, stream, parent_name, parent_phone FROM students WHERE id = ? AND school_id = ?",
    [studentId, schoolId],
  );
  if (!student) {
    const err = new Error("Student not found");
    err.statusCode = 404;
    throw err;
  }
  const fees = await financeRepository.findStudentFees(studentId, schoolId, {
    termId: termId || null,
    includeZero: false,
  });
  const payments = await query(
    `SELECT id, amount, payment_method, reference_number, received_at, status, notes
     FROM payments WHERE school_id = ? AND student_id = ? AND status IN ('completed','succeeded','success','paid')
     ORDER BY received_at ASC`,
    [schoolId, studentId],
  );
  const termRow = termId
    ? await queryOne("SELECT name FROM terms WHERE id = ?", [termId])
    : null;
  return { school, student, fees, payments, term: termRow };
};

const fmt = (n) =>
  "KES " +
  Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const displayName = (s) =>
  s.full_name || `${s.first_name || ""} ${s.middle_name || ""} ${s.last_name || ""}`.replace(/\s+/g, " ").trim();

const buildPdf = (ctx, res) => {
  const { school, student, fees, payments, term } = ctx;
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="fee-statement-${student.admission_number}.pdf"`,
  );
  doc.pipe(res);

  const PRIMARY = "#0F172A";
  const ACCENT = "#2563EB";
  const MUTED = "#64748B";
  const LIGHT = "#F1F5F9";

  // Header bar
  doc.rect(0, 0, doc.page.width, 90).fill(PRIMARY);
  doc
    .fillColor("white")
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(school?.name || "School", 40, 28);
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#CBD5E1")
    .text(
      [school?.address, school?.phone, school?.email].filter(Boolean).join("  •  "),
      40,
      54,
    );
  doc
    .fontSize(11)
    .fillColor("white")
    .font("Helvetica-Bold")
    .text("FEE STATEMENT", 40, 70, { align: "right", width: doc.page.width - 80 });

  doc.moveDown(2);
  doc.y = 110;

  // Student info card
  const cardTop = doc.y;
  doc.rect(40, cardTop, doc.page.width - 80, 80).fill(LIGHT).stroke();
  doc
    .fillColor(PRIMARY)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(displayName(student), 52, cardTop + 10);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(MUTED)
    .text(
      `Adm. No: ${student.admission_number}   •   Class: ${student.grade || "—"} ${student.stream || ""}`,
      52,
      cardTop + 30,
    );
  doc.text(
    `Guardian: ${student.parent_name || "—"}   •   Phone: ${student.parent_phone || "—"}`,
    52,
    cardTop + 46,
  );
  const meta = [
    `Date: ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`,
    term?.name ? `Term: ${term.name}` : "All Terms",
  ].join("   •   ");
  doc.text(meta, 52, cardTop + 62);

  doc.y = cardTop + 100;

  // Fee items table
  doc
    .fillColor(PRIMARY)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("Fee Items", 40, doc.y);
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const cols = [
    { label: "Fee Name", x: 40, w: 200 },
    { label: "Term", x: 240, w: 100 },
    { label: "Amount", x: 340, w: 70, align: "right" },
    { label: "Paid", x: 410, w: 70, align: "right" },
    { label: "Balance", x: 480, w: 75, align: "right" },
  ];
  doc.rect(40, tableTop, doc.page.width - 80, 22).fill(ACCENT);
  doc.fillColor("white").font("Helvetica-Bold").fontSize(10);
  cols.forEach((c) => doc.text(c.label, c.x + 4, tableTop + 7, { width: c.w - 8, align: c.align || "left" }));

  let y = tableTop + 22;
  doc.font("Helvetica").fontSize(9).fillColor(PRIMARY);
  let totalAmount = 0, totalPaid = 0, totalBalance = 0;
  fees.forEach((f, i) => {
    if (y > doc.page.height - 120) {
      doc.addPage();
      y = 40;
    }
    if (i % 2 === 0) doc.rect(40, y, doc.page.width - 80, 20).fill(LIGHT);
    doc.fillColor(PRIMARY);
    const amount = Number(f.amount || 0);
    const paid = Number(f.paid || 0);
    const balance = Number(f.balance || 0);
    totalAmount += amount; totalPaid += paid; totalBalance += balance;
    doc.text(f.fee_name || "Fee", cols[0].x + 4, y + 6, { width: cols[0].w - 8 });
    doc.text(f.term_name || "—", cols[1].x + 4, y + 6, { width: cols[1].w - 8 });
    doc.text(amount.toLocaleString(), cols[2].x + 4, y + 6, { width: cols[2].w - 8, align: "right" });
    doc.text(paid.toLocaleString(), cols[3].x + 4, y + 6, { width: cols[3].w - 8, align: "right" });
    doc.fillColor(balance > 0 ? "#DC2626" : "#16A34A").text(
      balance.toLocaleString(),
      cols[4].x + 4,
      y + 6,
      { width: cols[4].w - 8, align: "right" },
    );
    y += 20;
  });
  if (fees.length === 0) {
    doc.fillColor(MUTED).text("No fee items recorded.", 50, y + 8);
    y += 30;
  }

  // Totals row
  doc.rect(40, y, doc.page.width - 80, 24).fill(PRIMARY);
  doc.fillColor("white").font("Helvetica-Bold").fontSize(10);
  doc.text("TOTAL", cols[0].x + 4, y + 8, { width: cols[0].w - 8 });
  doc.text(totalAmount.toLocaleString(), cols[2].x + 4, y + 8, { width: cols[2].w - 8, align: "right" });
  doc.text(totalPaid.toLocaleString(), cols[3].x + 4, y + 8, { width: cols[3].w - 8, align: "right" });
  doc.text(totalBalance.toLocaleString(), cols[4].x + 4, y + 8, { width: cols[4].w - 8, align: "right" });
  y += 40;

  // Payment history
  if (y > doc.page.height - 200) { doc.addPage(); y = 40; }
  doc.fillColor(PRIMARY).font("Helvetica-Bold").fontSize(12).text("Payment History", 40, y);
  y += 20;

  const pcols = [
    { label: "Date", x: 40, w: 100 },
    { label: "Reference", x: 140, w: 140 },
    { label: "Method", x: 280, w: 90 },
    { label: "Amount", x: 370, w: 185, align: "right" },
  ];
  doc.rect(40, y, doc.page.width - 80, 22).fill(ACCENT);
  doc.fillColor("white").font("Helvetica-Bold").fontSize(10);
  pcols.forEach((c) => doc.text(c.label, c.x + 4, y + 7, { width: c.w - 8, align: c.align || "left" }));
  y += 22;

  doc.font("Helvetica").fontSize(9);
  let totalReceived = 0;
  payments.forEach((p, i) => {
    if (y > doc.page.height - 80) { doc.addPage(); y = 40; }
    if (i % 2 === 0) doc.rect(40, y, doc.page.width - 80, 20).fill(LIGHT);
    doc.fillColor(PRIMARY);
    const d = p.received_at ? new Date(p.received_at).toLocaleDateString("en-GB") : "—";
    doc.text(d, pcols[0].x + 4, y + 6, { width: pcols[0].w - 8 });
    doc.text(p.reference_number || "—", pcols[1].x + 4, y + 6, { width: pcols[1].w - 8 });
    doc.text((p.payment_method || "").toUpperCase(), pcols[2].x + 4, y + 6, { width: pcols[2].w - 8 });
    doc.fillColor("#16A34A").text(
      Number(p.amount || 0).toLocaleString(),
      pcols[3].x + 4, y + 6,
      { width: pcols[3].w - 8, align: "right" },
    );
    totalReceived += Number(p.amount || 0);
    y += 20;
  });
  if (payments.length === 0) {
    doc.fillColor(MUTED).text("No payments recorded.", 50, y + 8);
    y += 30;
  }

  doc.rect(40, y, doc.page.width - 80, 24).fill(PRIMARY);
  doc.fillColor("white").font("Helvetica-Bold").fontSize(10);
  doc.text("TOTAL RECEIVED", pcols[0].x + 4, y + 8);
  doc.text(totalReceived.toLocaleString(), pcols[3].x + 4, y + 8, { width: pcols[3].w - 8, align: "right" });
  y += 40;

  // Summary box
  if (y > doc.page.height - 140) { doc.addPage(); y = 40; }
  doc.rect(40, y, doc.page.width - 80, 90).fill(LIGHT).stroke();
  doc.fillColor(PRIMARY).font("Helvetica-Bold").fontSize(11).text("Summary", 52, y + 10);
  doc.font("Helvetica").fontSize(10).fillColor(MUTED);
  doc.text("Total Billed:", 52, y + 32);
  doc.fillColor(PRIMARY).text(fmt(totalAmount), 200, y + 32);
  doc.fillColor(MUTED).text("Total Paid:", 52, y + 50);
  doc.fillColor("#16A34A").text(fmt(totalPaid), 200, y + 50);
  doc.fillColor(MUTED).font("Helvetica-Bold").text("Outstanding Balance:", 52, y + 68);
  doc
    .fillColor(totalBalance > 0 ? "#DC2626" : "#16A34A")
    .font("Helvetica-Bold")
    .text(fmt(totalBalance), 200, y + 68);

  // Footer
  doc
    .fontSize(8)
    .fillColor(MUTED)
    .font("Helvetica")
    .text(
      `Generated on ${new Date().toLocaleString("en-GB")} • ${school?.name || ""} • Confidential`,
      40,
      doc.page.height - 30,
      { align: "center", width: doc.page.width - 80 },
    );

  doc.end();
};

const buildExcel = async (ctx, res) => {
  const { school, student, fees, payments, term } = ctx;
  const wb = new ExcelJS.Workbook();
  wb.creator = school?.name || "School";
  const ws = wb.addWorksheet("Fee Statement");

  ws.mergeCells("A1:E1");
  ws.getCell("A1").value = school?.name || "School";
  ws.getCell("A1").font = { size: 16, bold: true, color: { argb: "FF0F172A" } };
  ws.mergeCells("A2:E2");
  ws.getCell("A2").value = [school?.address, school?.phone, school?.email].filter(Boolean).join(" • ");
  ws.getCell("A2").font = { size: 9, color: { argb: "FF64748B" } };
  ws.mergeCells("A3:E3");
  ws.getCell("A3").value = "FEE STATEMENT";
  ws.getCell("A3").font = { size: 13, bold: true, color: { argb: "FF2563EB" } };

  ws.getCell("A5").value = "Student:";
  ws.getCell("B5").value = displayName(student);
  ws.getCell("A6").value = "Adm. No:";
  ws.getCell("B6").value = student.admission_number;
  ws.getCell("A7").value = "Class:";
  ws.getCell("B7").value = `${student.grade || "—"} ${student.stream || ""}`;
  ws.getCell("A8").value = "Guardian:";
  ws.getCell("B8").value = student.parent_name || "—";
  ws.getCell("A9").value = "Date:";
  ws.getCell("B9").value = new Date();
  ws.getCell("A9").font = { bold: true };
  if (term?.name) {
    ws.getCell("D5").value = "Term:";
    ws.getCell("E5").value = term.name;
  }
  ["A5","A6","A7","A8","A9","D5"].forEach((c) => (ws.getCell(c).font = { bold: true }));

  // Fees table
  let row = 11;
  ws.getCell(`A${row}`).value = "FEE ITEMS";
  ws.getCell(`A${row}`).font = { bold: true, size: 12 };
  row++;
  const header = ws.getRow(row);
  header.values = ["Fee Name", "Term", "Amount", "Paid", "Balance"];
  header.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    c.alignment = { vertical: "middle", horizontal: "center" };
  });
  row++;
  let totA = 0, totP = 0, totB = 0;
  for (const f of fees) {
    const a = Number(f.amount || 0), p = Number(f.paid || 0), b = Number(f.balance || 0);
    totA += a; totP += p; totB += b;
    ws.addRow([f.fee_name || "Fee", f.term_name || "—", a, p, b]);
    row++;
  }
  const totalsRow = ws.addRow(["TOTAL", "", totA, totP, totB]);
  totalsRow.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  });
  row++;
  ws.addRow([]); row++;

  // Payments
  ws.getCell(`A${row}`).value = "PAYMENT HISTORY";
  ws.getCell(`A${row}`).font = { bold: true, size: 12 };
  row++;
  const ph = ws.getRow(row);
  ph.values = ["Date", "Reference", "Method", "Amount", ""];
  ph.eachCell((c, i) => {
    if (i > 4) return;
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  });
  row++;
  let totR = 0;
  for (const p of payments) {
    const amt = Number(p.amount || 0);
    totR += amt;
    ws.addRow([
      p.received_at ? new Date(p.received_at) : "—",
      p.reference_number || "—",
      (p.payment_method || "").toUpperCase(),
      amt,
      "",
    ]);
    row++;
  }
  const tr = ws.addRow(["TOTAL RECEIVED", "", "", totR, ""]);
  tr.eachCell((c, i) => {
    if (i > 4) return;
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  });

  ws.columns = [
    { width: 32 }, { width: 18 }, { width: 16 }, { width: 16 }, { width: 16 },
  ];
  ws.getColumn(3).numFmt = '"KES "#,##0.00';
  ws.getColumn(4).numFmt = '"KES "#,##0.00';
  ws.getColumn(5).numFmt = '"KES "#,##0.00';

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="fee-statement-${student.admission_number}.xlsx"`,
  );
  await wb.xlsx.write(res);
  res.end();
};

const downloadStatement = async (req, res) => {
  try {
    const format = (req.query.format || "pdf").toLowerCase();
    const termId = req.query.term_id || null;
    const ctx = await fetchContext(req.params.studentId, req.schoolId, termId);
    if (format === "excel" || format === "xlsx") {
      return await buildExcel(ctx, res);
    }
    return buildPdf(ctx, res);
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { message: err.message || "Failed to generate statement" },
    });
  }
};

module.exports = { downloadStatement };