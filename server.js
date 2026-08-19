require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const createApp = require('./app');
const { initSockets } = require('./sockets');

const PORT = process.env.PORT || 4000;

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*' },
});
initSockets(io);

// Make io reachable from route controllers via req.app.locals.io
app.locals.io = io;

server.listen(PORT, () => {
  console.log(`Foleni backend listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});
