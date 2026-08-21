// server-side socket helpers for Foleni
// This exports initSockets(io) used by server.js

function initSockets(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Example: client may join a room for a queue by joinCode or queueId
    socket.on('joinRoom', (room) => {
      if (!room) return;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('leaveRoom', (room) => {
      if (!room) return;
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    // Proxy basic chat/notification events — adapt to your controllers
    socket.on('queue:message', ({ queueId, message }) => {
      if (queueId) {
        // Broadcast to the queue room (except the sender)
        socket.to(queueId).emit('queue:message', { from: socket.id, message });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', socket.id, 'reason:', reason);
    });
  });
}

module.exports = { initSockets };
