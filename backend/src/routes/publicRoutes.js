const express = require('express');
const {
  getQueueByJoinCode,
  joinQueue,
  getMyStatus,
  leaveQueue,
  getChatHistory,
} = require('../controllers/publicController');

const router = express.Router();

router.get('/queues/:joinCode', getQueueByJoinCode);
router.post('/queues/:joinCode/join', joinQueue);
router.get('/queues/:joinCode/chat', getChatHistory);
router.get('/entries/:sessionToken', getMyStatus);
router.post('/entries/:sessionToken/leave', leaveQueue);

module.exports = router;
