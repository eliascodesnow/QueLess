const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../utils/prisma');

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(business) {
  return jwt.sign(
    { sub: business.id, email: business.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.business.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const business = await prisma.business.create({
    data: { name, email, passwordHash, phone },
  });

  const token = signToken(business);
  return res.status(201).json({
    token,
    business: { id: business.id, name: business.name, email: business.email },
  });
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  const { email, password } = parsed.data;

  const business = await prisma.business.findUnique({ where: { email } });
  if (!business) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, business.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(business);
  return res.json({
    token,
    business: { id: business.id, name: business.name, email: business.email },
  });
}

async function me(req, res) {
  const business = await prisma.business.findUnique({
    where: { id: req.business.id },
    select: { id: true, name: true, email: true, phone: true, smsEnabled: true, createdAt: true },
  });
  return res.json({ business });
}

module.exports = { register, login, me };
