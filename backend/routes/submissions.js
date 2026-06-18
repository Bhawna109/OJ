const router = require('express').Router();
const { createSubmission, getUserSubmissions, getSubmission } = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createSubmission);
router.get('/', protect, getUserSubmissions);
router.get('/:id', protect, getSubmission);

module.exports = router;
