const crypto = require("crypto");

/**
 * Generate a human-friendly temporary password.
 * Pattern: <Word><####> — easy to read aloud / SMS.
 */
const generateTempPassword = () => {
  const words = [
    "Chuo",
    "Skol",
    "Akili",
    "Wema",
    "Safi",
    "Zima",
    "Daima",
    "Bora",
    "Imara",
    "Tunza",
    "Nuru",
    "Jenga",
  ];
  const word = words[crypto.randomInt(0, words.length)];
  const digits = String(crypto.randomInt(1000, 9999));
  const sym = "!@#$%".charAt(crypto.randomInt(0, 5));
  return `${word}${digits}${sym}`;
};

module.exports = { generateTempPassword };
