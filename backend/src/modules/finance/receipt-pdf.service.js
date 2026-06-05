// Branded payment-receipt PDF (A4) using pdfkit.
const PDFDocument = require("pdfkit");
const { queryOne, query } = require("../../config/database");

const KES = (n) =>
  `KES ${Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function numberToWords(n) {
  // Compact English number-to-words for KES amounts. Handles up to billions.
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const hundreds = (num) => {
    let s = "";
    if (num >= 100) { s += a[Math.floor(num / 100)] + " Hundred "; num %= 100; }
    if (num >= 20) { s += b[Math.floor(num / 10)] + " "; num %= 10; }
    if (num > 0) s += a[num] + " ";
    return s.trim();
  };
  if (!n) return "Zero";
  const whole = Math.floor(Math.abs(n));
  const cents = Math.round((Math.abs(n) - whole) * 100);
  const parts = [];
  const units = ["", "Thousand", "Million", "Billion"];
  let i = 0;
  let v = whole;
  const groups = [];
  while (v > 0) { groups.push(v % 1000); v = Math.floor(v / 1000); }
  for (let g = groups.length - 1; g >= 0; g--) {
    if (groups[g]) parts.push(hundreds(groups[g]) + (units[g] ? " " + units[g] : ""));
  }
  let words = (parts.join(" ") || "Zero") + " Shillings";
  if (cents) words += ` and ${hundreds(cents)} Cents`;
  return words + " Only";
}

async function loadContext(schoolId, paymentId) {
  const school = await queryOne("SELECT * FROM schools WHERE id=?", [schoolId]);
  const settings = await queryOne(
    "SELECT * FROM school_settings WHERE school_id=?", [schoolId],
  ).catch(() => null);

  const payment = await queryOne(
    `SELECT p.*, s.full_name AS student_name, s.admission_number,
            s.current_grade_id, s.current_stream_id,
            g.name AS grade_name, st.name AS stream_name,
            u.first_name AS rec_first, u.last_name AS rec_last
       FROM payments p
       LEFT JOIN students s ON s.id=p.student_id
       LEFT JOIN grades g ON g.id=s.current_grade_id
       LEFT JOIN streams st ON st.id=s.current_stream_id
       LEFT JOIN profiles u ON u.id=p.recorded_by
      WHERE p.id=? AND p.school_id=?`,
    [paymentId, schoolId],
  );
  if (!payment) throw new Error("Payment not found");

  const allocs = await query(
    `SELECT pa.amount, COALESCE(fs.name, ft.name, 'Fee') AS fee_name,
            t.name AS term_name
       FROM payment_allocations pa
       JOIN student_fees sf ON sf.id=pa.student_fee_id
       LEFT JOIN fee_structures fs ON fs.id=sf.fee_structure_id
       LEFT JOIN fee_templates ft  ON ft.id=sf.fee_template_id
       LEFT JOIN terms t ON t.id=sf.term_id
      WHERE pa.payment_id=?
      ORDER BY pa.allocation_order ASC`,
    [paymentId],
  );

  // Running balance after this payment
  let balance = null;
  if (payment.student_id) {
    const bal = await queryOne(
      `SELECT
         COALESCE(SUM(amount_due),0) - COALESCE(SUM(amount_paid),0) AS bal
       FROM student_fees
       WHERE school_id=? AND student_id=? AND status NOT IN ('cancelled','waived')`,
      [schoolId, payment.student_id],
    );
    balance = bal?.bal != null ? Number(bal.bal) : null;
  }

  return { school: { ...school, settings: settings || {} }, payment, allocs, balance };
}

exports.streamReceipt = async ({ res, schoolId, paymentId }) => {
  const { school, payment, allocs, balance } = await loadContext(schoolId, paymentId);
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(res);

  const PRIMARY = "#0f766e"; // teal-700
  const MUTED = "#6b7280";
  const BORDER = "#e5e7eb";

  // --- Header banner ---
  doc.rect(0, 0, doc.page.width, 110).fill(PRIMARY);
  doc.fillColor("white").fontSize(20).font("Helvetica-Bold")
    .text(school.name || "School", 40, 30, { width: doc.page.width - 80 });
  doc.fontSize(9).font("Helvetica")
    .text(school.settings?.address || school.address || "", 40, 56, { width: doc.page.width - 80 })
    .text([school.phone, school.email].filter(Boolean).join("  •  "), 40, 70);
  doc.fontSize(26).font("Helvetica-Bold").fillColor("white")
    .text("RECEIPT", 40, 30, { align: "right", width: doc.page.width - 80 });
  doc.fontSize(9).font("Helvetica")
    .text(`No. ${payment.receipt_number || payment.reference_number || payment.id.slice(0,8).toUpperCase()}`,
      40, 62, { align: "right", width: doc.page.width - 80 })
    .text(`Date: ${new Date(payment.received_at || payment.created_at).toLocaleString("en-GB")}`,
      40, 76, { align: "right", width: doc.page.width - 80 });

  doc.fillColor("black").y = 130;

  // --- Payer / Student block ---
  const y0 = doc.y;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(MUTED).text("RECEIVED FROM", 40, y0);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("black")
    .text(payment.student_name || "Unallocated payment", 40, y0 + 14);
  doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(
    [
      payment.admission_number && `Adm: ${payment.admission_number}`,
      payment.grade_name && `Class: ${payment.grade_name}${payment.stream_name ? ` · ${payment.stream_name}` : ""}`,
      payment.payer_phone && `Phone: ${payment.payer_phone}`,
    ].filter(Boolean).join("   ·   "),
    40, y0 + 32,
  );

  // Right side: method
  doc.font("Helvetica-Bold").fontSize(10).fillColor(MUTED)
    .text("PAYMENT METHOD", 40, y0, { align: "right", width: doc.page.width - 80 });
  doc.font("Helvetica-Bold").fontSize(13).fillColor("black")
    .text(String(payment.payment_method || "—").toUpperCase(), 40, y0 + 14,
      { align: "right", width: doc.page.width - 80 });
  if (payment.reference_number) {
    doc.font("Helvetica").fontSize(10).fillColor(MUTED)
      .text(`Ref: ${payment.reference_number}`, 40, y0 + 32,
        { align: "right", width: doc.page.width - 80 });
  }

  doc.y = y0 + 60;

  // --- Allocations table ---
  const tableTop = doc.y + 10;
  const col = { desc: 50, term: 320, amt: 470 };
  doc.rect(40, tableTop, doc.page.width - 80, 22).fill("#f3f4f6");
  doc.fillColor("black").font("Helvetica-Bold").fontSize(10)
    .text("Description", col.desc, tableTop + 6)
    .text("Term", col.term, tableTop + 6)
    .text("Amount", col.amt, tableTop + 6, { width: 90, align: "right" });

  let rowY = tableTop + 26;
  doc.font("Helvetica").fontSize(10).fillColor("black");
  const rows = allocs.length ? allocs : [{ fee_name: payment.notes || "Payment", term_name: "—", amount: payment.amount }];
  for (const a of rows) {
    doc.text(a.fee_name, col.desc, rowY, { width: 260 });
    doc.text(a.term_name || "—", col.term, rowY);
    doc.text(KES(a.amount), col.amt, rowY, { width: 90, align: "right" });
    rowY += 20;
    doc.strokeColor(BORDER).lineWidth(0.5)
      .moveTo(40, rowY - 4).lineTo(doc.page.width - 40, rowY - 4).stroke();
  }

  // --- Totals block ---
  rowY += 10;
  doc.font("Helvetica-Bold").fontSize(12).fillColor("black")
    .text("TOTAL PAID", col.term, rowY)
    .text(KES(payment.amount), col.amt, rowY, { width: 90, align: "right" });
  rowY += 22;
  doc.font("Helvetica").fontSize(9).fillColor(MUTED)
    .text(`Amount in words: ${numberToWords(Number(payment.amount))}`, 50, rowY,
      { width: doc.page.width - 100 });
  rowY += 30;

  if (balance != null) {
    doc.font("Helvetica-Bold").fontSize(11).fillColor(balance > 0 ? "#b45309" : "#15803d")
      .text(
        balance > 0
          ? `Outstanding balance after this payment: ${KES(balance)}`
          : `Account fully settled. Balance: ${KES(0)}`,
        50, rowY,
      );
    rowY += 24;
  }

  // --- Signatures ---
  const sigY = Math.max(rowY + 30, doc.page.height - 140);
  doc.strokeColor(BORDER).lineWidth(0.5)
    .moveTo(60, sigY).lineTo(240, sigY).stroke()
    .moveTo(doc.page.width - 240, sigY).lineTo(doc.page.width - 60, sigY).stroke();
  doc.font("Helvetica").fontSize(9).fillColor(MUTED)
    .text(`Received by: ${(payment.rec_first || "") + " " + (payment.rec_last || "")}`.trim() || "Cashier",
      60, sigY + 5)
    .text("Payer signature", doc.page.width - 240, sigY + 5,
      { width: 180, align: "center" });

  // --- Footer ---
  doc.fontSize(8).fillColor(MUTED)
    .text("This is a system-generated receipt. Keep it safe for your records.",
      40, doc.page.height - 60, { align: "center", width: doc.page.width - 80 })
    .text(school.settings?.motto || "", 40, doc.page.height - 48,
      { align: "center", width: doc.page.width - 80 });

  doc.end();
};
