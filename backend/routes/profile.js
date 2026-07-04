const router = require('express').Router();
const { getProfile, updateProfile, deleteProfile, getAllUsers } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', protect, adminOnly, getAllUsers);
router.get('/:id', protect, getProfile);
router.put('/:id', protect, updateProfile);
router.delete('/:id', protect, deleteProfile);

module.exports = router;
