/**
 * Real-time layer.
 *
 * Rooms:
 *   - `queue:<queueId>`  — everyone viewing that queue (business dashboard +
 *                          every customer's live-position page) joins this
 *                          room. Any change to the queue broadcasts here.
 *
 * Events emitted TO clients:
 *   - "queue:update"   { queueId, entries }   — full current state of the queue
 *   - "chat:message"   { queueId, message }   — new community-board message
 *
 * Events received FROM clients:
 *   - "queue:join"      { queueId }  — subscribe to a queue's updates
 *   - "chat:send"       { queueId, displayName, message }
 */
function initSockets(io) {
  io.on('connection', (socket) => {
    socket.on('queue:join', ({ queueId }) => {
      if (!queueId) return;
      socket.join(`queue:${queueId}`);
    });

    socket.on('queue:leave', ({ queueId }) => {
      if (!queueId) return;
      socket.leave(`queue:${queueId}`);
    });

    socket.on('chat:send', async ({ queueId, displayName, message }, callback) => {
      try {
        if (!queueId || !message?.trim()) return;
        const prisma = require('../utils/prisma');

        const queue = await prisma.queue.findUnique({ where: { id: queueId } });
        if (!queue || !queue.chatEnabled) return;

        const saved = await prisma.chatMessage.create({
          data: {
            queueId,
            displayName: (displayName || 'Anonymous').slice(0, 40),
            message: message.trim().slice(0, 300),
          },
        });

        io.to(`queue:${queueId}`).emit('chat:message', { queueId, message: saved });
        if (callback) callback({ ok: true });
      } catch (err) {
        console.error('[socket chat:send] error:', err.message);
        if (callback) callback({ ok: false, error: 'Failed to send message' });
      }
    });
  });
}

/** Call this from route handlers whenever a queue's entries change. */
function broadcastQueueUpdate(io, queueId, entries) {
  io.to(`queue:${queueId}`).emit('queue:update', { queueId, entries });
}

module.exports = { initSockets, broadcastQueueUpdate };
