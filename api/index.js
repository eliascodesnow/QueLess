require('dotenv').config();
const { Server } = require('socket.io');
const createApp = require('../app');
const { initSockets } = require('../socket');

let io;
const app = createApp();

// Initialize Socket.IO for serverless environment
function initializeIO(req) {
  if (!io) {
    const http = require('http');
    const server = http.createServer(app);
    io = new Server(server, {
      cors: { origin: process.env.CLIENT_URL || '*' },
    });
    initSockets(io);
    app.locals.io = io;
  }
  return io;
}

// Vercel serverless handler
module.exports = (req, res) => {
  // Initialize Socket.IO if needed
  initializeIO(req);
  
  // Pass request to Express app
  app(req, res);
};
