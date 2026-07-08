const router = require("express").Router();
const ctrl = require("./reports.controller");
const repo = require("./reports.repository");
const svc = require("./reports.service");
const {
  streamPdf,
  streamXlsx,
  pdfHeader,
  pdfTable,
  applyHeaderStyle,
} = require("./export.service");

router.get("/finance", ctrl.financeReport);
router.get("/payments", ctrl.paymentsReport);
router.get("/students", ctrl.studentReport);
router.get("/attendance", ctrl.attendanceReport);
router.get("/exams", ctrl.examReport);
router.get("/hr", ctrl.hrReport);
router.get("/audit-trail", ctrl.auditTrail);
router.get("/user-logs", ctrl.userLogs);

// ---------- EXPORTS ----------
const buildFilters = (req) => ({ ...req.query });

const fmt = (n) =>
  "KES " + Number(n || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 });

// Finance — Excel
router.get("/finance/export.xlsx", async (req, res) => {
  try {
    const r = await svc.getFinanceReport(req.schoolId, buildFilters(req));
    await streamXlsx(res, `finance-report-${Date.now()}.xlsx`, async (wb) => {
      const dc = wb.addWorksheet("Daily Collections");
      applyHeaderStyle(dc, [
        { header: "Date", key: "date", width: 14 },
        { header: "Cash", key: "cash", width: 14 },
        { header: "M-Pesa", key: "mpesa", width: 14 },
        { header: "Bank", key: "bank", width: 14 },
        { header: "Total", key: "total", width: 16 },
        { header: "Transactions", key: "transactions", width: 14 },
      ]);
      (r.dailyCollections || []).forEach((row) =>
        dc.addRow({
          ...row,
          cash: Number(row.cash) || 0,
          mpesa: Number(row.mpesa) || 0,
          bank: Number(row.bank) || 0,
          total: Number(row.total) || 0,
          transactions: Number(row.transactions) || 0,
        }),
      );

      const bf = wb.addWorksheet("Outstanding Fees");
      applyHeaderStyle(bf, [
        { header: "Adm No", key: "admission_no", width: 14 },
        { header: "Student", key: "student_name", width: 28 },
        { header: "Class", key: "class_name", width: 16 },
        { header: "Billed", key: "total_fees", width: 14 },
        { header: "Paid", key: "paid", width: 14 },
        { header: "Balance", key: "balance", width: 14 },
      ]);
      (r.balanceFees || []).forEach((row) =>
        bf.addRow({
          ...row,
          total_fees: Number(row.total_fees) || 0,
          paid: Number(row.paid) || 0,
          balance: Number(row.balance) || 0,
        }),
      );

      const ex = wb.addWorksheet("Expenses");
      applyHeaderStyle(ex, [
        { header: "Date", key: "expense_date", width: 14 },
        { header: "Title", key: "title", width: 30 },
        { header: "Category", key: "category_name", width: 18 },
        { header: "Amount", key: "amount", width: 14 },
        { header: "Status", key: "status", width: 12 },
      ]);
      (r.expenses || []).forEach((row) =>
        ex.addRow({ ...row, amount: Number(row.amount) || 0 }),
      );
    });
  } catch (e) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

// Finance — PDF
router.get("/finance/export.pdf", async (req, res) => {
  try {
    const r = await svc.getFinanceReport(req.schoolId, buildFilters(req));
    streamPdf(res, `finance-report-${Date.now()}.pdf`, (doc) => {
      pdfHeader(doc, {
        title: "Finance Report",
        subtitle: `Generated ${new Date().toLocaleDateString()}`,
        school: "School",
      });

      const totalCollected = (r.dailyCollections || []).reduce(
        (s, d) => s + (Number(d.total) || 0),
        0,
      );
      const totalOutstanding = (r.balanceFees || []).reduce(
        (s, d) => s + (Number(d.balance) || 0),
        0,
      );
      const totalExpenses = (r.expenses || []).reduce(
        (s, d) => s + (Number(d.amount) || 0),
        0,
      );
      doc.font("Helvetica").fontSize(10).fillColor("#374151");
      doc.text(`Total Collected: ${fmt(totalCollected)}`);
      doc.text(`Outstanding: ${fmt(totalOutstanding)}`);
      doc.text(`Expenses: ${fmt(totalExpenses)}`);
      doc.moveDown(0.5);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#111827")
        .text("Outstanding Fees");
      pdfTable(
        doc,
        [
          { header: "Adm", key: "admission_no", width: 60 },
          { header: "Student", key: "student_name", width: 180 },
          { header: "Class", key: "class_name", width: 80 },
          { header: "Billed", key: "total_fees", width: 70 },
          { header: "Paid", key: "paid", width: 70 },
          { header: "Balance", key: "balance", width: 70 },
        ],
        (r.balanceFees || []).slice(0, 80).map((x) => ({
          ...x,
          total_fees: fmt(x.total_fees),
          paid: fmt(x.paid),
          balance: fmt(x.balance),
        })),
      );
    });
  } catch (e) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

// Students Report — Excel
router.get("/students/export.xlsx", async (req, res) => {
  try {
    const r = await svc.getStudentReport(req.schoolId, buildFilters(req));
    await streamXlsx(res, `student-report-${Date.now()}.xlsx`, async (wb) => {
      const ws = wb.addWorksheet("Students");
      applyHeaderStyle(ws, [
        { header: "Adm No", key: "admission_number", width: 14 },
        { header: "Name", key: "name", width: 28 },
        { header: "Gender", key: "gender", width: 10 },
        { header: "Class", key: "grade_name", width: 14 },
        { header: "Stream", key: "stream_name", width: 14 },
        { header: "Status", key: "status", width: 12 },
        { header: "Parent", key: "parent_name", width: 22 },
        { header: "Phone", key: "parent_phone", width: 16 },
      ]);
      (r.students || []).forEach((s) =>
        ws.addRow({
          ...s,
          name: `${s.first_name || ""} ${s.last_name || ""}`.trim(),
        }),
      );
    });
  } catch (e) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

// Students Report — PDF
router.get("/students/export.pdf", async (req, res) => {
  try {
    const r = await svc.getStudentReport(req.schoolId, buildFilters(req));
    streamPdf(res, `student-report-${Date.now()}.pdf`, (doc) => {
      pdfHeader(doc, {
        title: "Student Report",
        subtitle: `Total: ${r.summary?.total || 0} • Male: ${r.summary?.male || 0} • Female: ${r.summary?.female || 0} • Active: ${r.summary?.active || 0}`,
        school: "School",
      });
      pdfTable(
        doc,
        [
          { header: "Adm", key: "admission_number", width: 60 },
          { header: "Name", key: "name", width: 170 },
          { header: "Gender", key: "gender", width: 50 },
          { header: "Class", key: "grade_name", width: 80 },
          { header: "Stream", key: "stream_name", width: 80 },
          { header: "Status", key: "status", width: 70 },
        ],
        (r.students || []).map((s) => ({
          ...s,
          name: `${s.first_name || ""} ${s.last_name || ""}`.trim(),
        })),
      );
    });
  } catch (e) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

module.exports = router;
