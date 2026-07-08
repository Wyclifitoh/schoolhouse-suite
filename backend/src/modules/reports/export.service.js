// Shared export helpers for PDF (pdfkit) and Excel (exceljs).
// All exports stream binary directly to res.

const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const BRAND = "#1e40af";

function pdfHeader(doc, { title, subtitle, school }) {
  doc.fillColor(BRAND).fontSize(20).font("Helvetica-Bold").text(school || "School Report", { align: "left" });
  doc.fillColor("#111827").fontSize(14).text(title);
  if (subtitle) doc.fillColor("#6b7280").fontSize(10).font("Helvetica").text(subtitle);
  doc.moveDown(0.5);
  doc.strokeColor(BRAND).lineWidth(1.5).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown(0.5);
}

function pdfFooter(doc) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.height - 30;
    doc.fillColor("#9ca3af").fontSize(8).font("Helvetica")
       .text(`Generated ${new Date().toLocaleString()}  •  Page ${i + 1} of ${range.count}`,
             40, bottom, { width: doc.page.width - 80, align: "center" });
  }
}

// Draw a simple table — cols: [{ header, key, width }]
function pdfTable(doc, cols, rows, opts = {}) {
  const startX = 40;
  let y = doc.y + 4;
  const rowH = opts.rowHeight || 18;
  // header
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff");
  doc.rect(startX, y, cols.reduce((s, c) => s + c.width, 0), rowH).fill(BRAND);
  let x = startX;
  cols.forEach((c) => {
    doc.fillColor("#ffffff").text(c.header, x + 4, y + 5, { width: c.width - 8, ellipsis: true });
    x += c.width;
  });
  y += rowH;
  doc.font("Helvetica").fontSize(9).fillColor("#111827");
  rows.forEach((row, idx) => {
    if (y > doc.page.height - 50) {
      doc.addPage();
      y = 60;
    }
    if (idx % 2 === 0) {
      doc.rect(startX, y, cols.reduce((s, c) => s + c.width, 0), rowH).fill("#f3f4f6").fillColor("#111827");
    }
    let cx = startX;
    cols.forEach((c) => {
      const val = row[c.key];
      doc.fillColor("#111827").text(val == null ? "" : String(val), cx + 4, y + 5, {
        width: c.width - 8,
        ellipsis: true,
      });
      cx += c.width;
    });
    y += rowH;
  });
  doc.y = y + 6;
}

function streamPdf(res, fileName, build) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  doc.pipe(res);
  build(doc);
  pdfFooter(doc);
  doc.end();
}

async function streamXlsx(res, fileName, build) {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  const wb = new ExcelJS.Workbook();
  wb.creator = "School ERP";
  await build(wb);
  await wb.xlsx.write(res);
  res.end();
}

function applyHeaderStyle(ws, cols) {
  ws.columns = cols;
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };
  headerRow.height = 22;
}

module.exports = {
  pdfHeader,
  pdfTable,
  pdfFooter,
  streamPdf,
  streamXlsx,
  applyHeaderStyle,
};
