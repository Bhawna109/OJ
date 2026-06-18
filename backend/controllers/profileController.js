const User = require('../models/User');

const getProfile = async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
};

const updateProfile = async (req, res) => {
    if (req.user._id.toString() !== req.params.id)
        return res.status(403).json({ error: 'Not authorized to update this profile' });

    const { firstName, lastName, phone } = req.body;
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { firstName, lastName, phone },
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
};

const deleteProfile = async (req, res) => {
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin')
        return res.status(403).json({ error: 'Not authorized to delete this profile' });

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Account deleted successfully' });
};

module.exports = { getProfile, updateProfile, deleteProfile };
