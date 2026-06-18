const router = require('express').Router();
const { getAllProblems, getProblem, createProblem, updateProblem, deleteProblem } = require('../controllers/problemController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', getAllProblems);
router.get('/:id', getProblem);
router.post('/', protect, adminOnly, createProblem);
router.put('/:id', protect, adminOnly, updateProblem);
router.delete('/:id', protect, adminOnly, deleteProblem);

module.exports = router;
