const { PrismaClient } = require('@prisma/client');

// Reuse a single PrismaClient instance across the app (avoids exhausting
// DB connections in dev with hot-reload, and is the recommended pattern).
const prisma = new PrismaClient();

module.exports = prisma;
