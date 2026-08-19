const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  createQueue,
  listMyQueues,
  getQueueDetail,
  updateQueueStatus,
  callNext,
  markEntryStatus,
} = require('../controllers/queueController');

const router = express.Router();

router.use(requireAuth); // every route below requires a logged-in business

router.post('/', createQueue);
router.get('/', listMyQueues);
router.get('/:id', getQueueDetail);
router.patch('/:id/status', updateQueueStatus);
router.post('/:id/call-next', callNext);
router.patch('/:id/entries/:entryId', markEntryStatus);

module.exports = router;
