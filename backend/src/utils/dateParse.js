/**
 * Robustly parse a Date of Birth (or any date) value coming from a CSV / Excel
 * export. Returns an ISO `YYYY-MM-DD` string or `null` when the value cannot
 * be interpreted (never silently defaults to 1899-11-30).
 */
function parseExcelDate(value) {
  if (value === null || value === undefined || value === "") return null;

  // Numeric Excel serial (days since 1899-12-30 epoch).
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value <= 0 || value > 600000) return null;
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }

  const s = String(value).trim();
  if (!s) return null;

  // Numeric serial supplied as text.
  if (/^\d+(\.\d+)?$/.test(s)) {
    return parseExcelDate(Number(s));
  }

  // ISO YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const y = +iso[1], m = +iso[2], d = +iso[3];
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return `${y.toString().padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // DD/MM/YYYY or MM/DD/YYYY (and `-` / `.` separators).
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let a = +m[1], b = +m[2], y = +m[3];
    if (y < 100) y += y < 50 ? 2000 : 1900;
    // Heuristic: assume DD/MM/YYYY (Kenya / EU default). Fall back to MM/DD.
    let day = a, month = b;
    if (a > 12 && b <= 12) { day = a; month = b; }
    else if (b > 12 && a <= 12) { day = b; month = a; }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${y.toString().padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Last resort — let Date parse it.
  const d = new Date(s);
  if (!Number.isNaN(d.getTime()) && d.getFullYear() > 1900) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

module.exports = { parseExcelDate };