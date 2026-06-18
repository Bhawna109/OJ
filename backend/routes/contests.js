const router = require('express').Router();
const { getContests, getContest, createContest, registerContest, unregisterContest } = require('../controllers/contestController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', protect, getContests);
router.get('/:id', protect, getContest);
router.post('/', protect, adminOnly, createContest);
router.post('/:id/register', protect, registerContest);
router.post('/:id/unregister', protect, unregisterContest);

module.exports = router;
