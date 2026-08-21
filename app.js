const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./authRoutes');
const queueRoutes = require('./queueRoutes');
const publicRoutes = require('./publicRoutes');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
  app.use(express.json());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Basic abuse protection on the public join endpoint (anonymous, no auth).
  const joinLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });
  app.use('/api/public/queues/:joinCode/join', joinLimiter);

  app.get('/health', (req, res) => res.json({ ok: true, service: 'foleni-backend' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/queues', queueRoutes);
  app.use('/api/public', publicRoutes);

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = createApp;
