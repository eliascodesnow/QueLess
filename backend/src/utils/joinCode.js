// Generates short, human-typeable codes like "BLU-274" for the public join link,
// as an alternative to scanning the QR code.
const ADJECTIVES = ['RED', 'BLU', 'GRN', 'GLD', 'SKY', 'TEA', 'AMB', 'JAD'];

function generateJoinCode() {
  const prefix = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const digits = Math.floor(100 + Math.random() * 900); // 3-digit
  return `${prefix}-${digits}`;
}

module.exports = { generateJoinCode };
