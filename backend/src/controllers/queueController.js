const { z } = require('zod');
const QRCode = require('qrcode');
const prisma = require('../utils/prisma');
const { generateJoinCode } = require('../utils/joinCode');
const { broadcastQueueUpdate } = require('../sockets');

const createQueueSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(300).optional(),
  avgServiceTimeMins: z.number().int().min(1).max(240).optional(),
  chatEnabled: z.boolean().optional(),
});

async function withUniqueJoinCode() {
  // Extremely low collision odds, but loop just in case.
  for (let i = 0; i < 5; i++) {
    const code = generateJoinCode();
    const exists = await prisma.queue.findUnique({ where: { joinCode: code } });
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique join code, try again');
}

async function createQueue(req, res) {
  const parsed = createQueueSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const joinCode = await withUniqueJoinCode();
  const queue = await prisma.queue.create({
    data: {
      businessId: req.business.id,
      name: parsed.data.name,
      description: parsed.data.description,
      avgServiceTimeMins: parsed.data.avgServiceTimeMins ?? 10,
      chatEnabled: parsed.data.chatEnabled ?? true,
      joinCode,
    },
  });

  const joinUrl = `${process.env.CLIENT_URL}/join/${queue.joinCode}`;
  const qrDataUrl = await QRCode.toDataURL(joinUrl);

  return res.status(201).json({ queue, joinUrl, qrDataUrl });
}

async function listMyQueues(req, res) {
  const queues = await prisma.queue.findMany({
    where: { businessId: req.business.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { entries: { where: { status: 'WAITING' } } } } },
  });
  return res.json({ queues });
}

async function getQueueDetail(req, res) {
  const queue = await prisma.queue.findFirst({
    where: { id: req.params.id, businessId: req.business.id },
    include: {
      entries: {
        where: { status: { in: ['WAITING', 'SERVING'] } },
        orderBy: { position: 'asc' },
      },
    },
  });
  if (!queue) return res.status(404).json({ error: 'Queue not found' });

  const joinUrl = `${process.env.CLIENT_URL}/join/${queue.joinCode}`;
  return res.json({ queue, joinUrl });
}

async function updateQueueStatus(req, res) {
  const schema = z.object({ status: z.enum(['OPEN', 'PAUSED', 'CLOSED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid status' });

  const queue = await prisma.queue.findFirst({
    where: { id: req.params.id, businessId: req.business.id },
  });
  if (!queue) return res.status(404).json({ error: 'Queue not found' });

  const updated = await prisma.queue.update({
    where: { id: queue.id },
    data: { status: parsed.data.status },
  });
  return res.json({ queue: updated });
}

/** Advances the queue: marks the current SERVING entry (if any) as SERVED,
 *  then promotes the next WAITING entry to SERVING. Broadcasts the new state. */
async function callNext(req, res) {
  const { io } = req.app.locals;
  const queue = await prisma.queue.findFirst({
    where: { id: req.params.id, businessId: req.business.id },
  });
  if (!queue) return res.status(404).json({ error: 'Queue not found' });

  await prisma.$transaction(async (tx) => {
    const currentlyServing = await tx.queueEntry.findFirst({
      where: { queueId: queue.id, status: 'SERVING' },
    });
    if (currentlyServing) {
      await tx.queueEntry.update({
        where: { id: currentlyServing.id },
        data: { status: 'SERVED', servedAt: new Date() },
      });
    }

    const next = await tx.queueEntry.findFirst({
      where: { queueId: queue.id, status: 'WAITING' },
      orderBy: { position: 'asc' },
    });
    if (next) {
      await tx.queueEntry.update({
        where: { id: next.id },
        data: { status: 'SERVING', calledAt: new Date() },
      });
    }
  });

  const entries = await prisma.queueEntry.findMany({
    where: { queueId: queue.id, status: { in: ['WAITING', 'SERVING'] } },
    orderBy: { position: 'asc' },
  });
  broadcastQueueUpdate(io, queue.id, entries);
  return res.json({ entries });
}

async function markEntryStatus(req, res) {
  const schema = z.object({ status: z.enum(['SERVED', 'NO_SHOW', 'LEFT']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid status' });

  const { io } = req.app.locals;
  const entry = await prisma.queueEntry.findFirst({
    where: { id: req.params.entryId, queue: { businessId: req.business.id } },
    include: { queue: true },
  });
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  await prisma.queueEntry.update({
    where: { id: entry.id },
    data: { status: parsed.data.status, servedAt: parsed.data.status === 'SERVED' ? new Date() : undefined },
  });

  const entries = await prisma.queueEntry.findMany({
    where: { queueId: entry.queueId, status: { in: ['WAITING', 'SERVING'] } },
    orderBy: { position: 'asc' },
  });
  broadcastQueueUpdate(io, entry.queueId, entries);
  return res.json({ entries });
}

module.exports = {
  createQueue,
  listMyQueues,
  getQueueDetail,
  updateQueueStatus,
  callNext,
  markEntryStatus,
};
