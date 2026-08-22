const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../utils/prisma');
const { broadcastQueueUpdate } = require('../sockets');
const { sendSmsIfEnabled } = require('../utils/sms');

/** Public lookup of a queue by its short join code — no auth needed. */
async function getQueueByJoinCode(req, res) {
  const queue = await prisma.queue.findUnique({
    where: { joinCode: req.params.joinCode },
    include: { business: { select: { name: true } } },
  });
  if (!queue) return res.status(404).json({ error: 'Queue not found' });

  const entries = await prisma.queueEntry.findMany({
    where: { queueId: queue.id, status: { in: ['WAITING', 'SERVING'] } },
    orderBy: { position: 'asc' },
    select: { id: true, status: true, position: true }, // no customer PII exposed publicly
  });

  return res.json({
    queue: {
      id: queue.id,
      name: queue.name,
      description: queue.description,
      status: queue.status,
      avgServiceTimeMins: queue.avgServiceTimeMins,
      chatEnabled: queue.chatEnabled,
      businessName: queue.business.name,
    },
    waitingCount: entries.filter((e) => e.status === 'WAITING').length,
  });
}

const joinSchema = z.object({
  customerName: z.string().min(1).max(80),
  phone: z.string().max(20).optional(),
});

/** Customer joins the queue anonymously. Returns a sessionToken the client
 *  stores (e.g. localStorage) to check their own position later. */
async function joinQueue(req, res) {
  const parsed = joinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { io } = req.app.locals;
  const queue = await prisma.queue.findUnique({ where: { joinCode: req.params.joinCode } });
  if (!queue) return res.status(404).json({ error: 'Queue not found' });
  if (queue.status !== 'OPEN') {
    return res.status(400).json({ error: 'This queue is not currently accepting new customers' });
  }

  const lastEntry = await prisma.queueEntry.findFirst({
    where: { queueId: queue.id },
    orderBy: { position: 'desc' },
  });
  const nextPosition = (lastEntry?.position ?? 0) + 1;
  const sessionToken = uuidv4();

  const entry = await prisma.queueEntry.create({
    data: {
      queueId: queue.id,
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      position: nextPosition,
      sessionToken,
    },
  });

  const entries = await prisma.queueEntry.findMany({
    where: { queueId: queue.id, status: { in: ['WAITING', 'SERVING'] } },
    orderBy: { position: 'asc' },
  });
  broadcastQueueUpdate(io, queue.id, entries);

  const waitingAhead = entries.filter((e) => e.status === 'WAITING' && e.position < entry.position).length;

  return res.status(201).json({
    sessionToken,
    entryId: entry.id,
    position: entry.position,
    estimatedWaitMins: waitingAhead * queue.avgServiceTimeMins,
  });
}

/** Customer polls/reconnects to check their own live status. */
async function getMyStatus(req, res) {
  const entry = await prisma.queueEntry.findUnique({
    where: { sessionToken: req.params.sessionToken },
    include: { queue: true },
  });
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  const waitingAhead = await prisma.queueEntry.count({
    where: {
      queueId: entry.queueId,
      status: 'WAITING',
      position: { lt: entry.position },
    },
  });

  return res.json({
    status: entry.status,
    position: entry.position,
    peopleAhead: entry.status === 'WAITING' ? waitingAhead : 0,
    estimatedWaitMins: entry.status === 'WAITING' ? waitingAhead * entry.queue.avgServiceTimeMins : 0,
  });
}

/** Customer voluntarily leaves the queue. */
async function leaveQueue(req, res) {
  const { io } = req.app.locals;
  const entry = await prisma.queueEntry.findUnique({ where: { sessionToken: req.params.sessionToken } });
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  await prisma.queueEntry.update({ where: { id: entry.id }, data: { status: 'LEFT' } });

  const entries = await prisma.queueEntry.findMany({
    where: { queueId: entry.queueId, status: { in: ['WAITING', 'SERVING'] } },
    orderBy: { position: 'asc' },
  });
  broadcastQueueUpdate(io, entry.queueId, entries);
  return res.json({ ok: true });
}

/** Recent community-board messages for a queue (public read, socket for live send). */
async function getChatHistory(req, res) {
  const queue = await prisma.queue.findUnique({ where: { joinCode: req.params.joinCode } });
  if (!queue) return res.status(404).json({ error: 'Queue not found' });

  const messages = await prisma.chatMessage.findMany({
    where: { queueId: queue.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return res.json({ messages: messages.reverse(), chatEnabled: queue.chatEnabled });
}

// Called internally (e.g. from a scheduled job or callNext) when a customer
// is about to be served — kept here so SMS opt-in logic lives in one place.
async function notifyCustomerTheyreNext(entryId) {
  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: { queue: { include: { business: true } } },
  });
  if (!entry?.phone) return;

  await sendSmsIfEnabled({
    business: entry.queue.business,
    to: entry.phone,
    message: `Foleni: You're next in line at ${entry.queue.name}. Please head over now.`,
  });
}

module.exports = {
  getQueueByJoinCode,
  joinQueue,
  getMyStatus,
  leaveQueue,
  getChatHistory,
  notifyCustomerTheyreNext,
};
