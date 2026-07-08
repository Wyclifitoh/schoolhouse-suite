/**
 * One-off CLI to create a CHUO platform admin.
 * Usage: node backend/scripts/create-platform-admin.js you@chuo.co.ke "Your Name" "Strong#Pass1"
 */
require("dotenv").config();
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { query, queryOne } = require("../src/config/database");

(async () => {
  const [, , email, name, password] = process.argv;
  if (!email || !name || !password) {
    console.error("Usage: node create-platform-admin.js <email> <fullName> <password>");
    process.exit(1);
  }
  const existing = await queryOne("SELECT id FROM platform_users WHERE email = ?", [email]);
  if (existing) { console.error("That email already exists."); process.exit(1); }
  const hash = await bcrypt.hash(password, 12);
  await query(
    "INSERT INTO platform_users (id, email, password_hash, full_name, role, is_active) VALUES (?,?,?,?,?,1)",
    [uuidv4(), email, hash, name, "platform_admin"],
  );
  console.log("Platform admin created:", email);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });