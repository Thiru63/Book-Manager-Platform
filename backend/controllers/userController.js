const User = require('../models/User');
const { updateReadingGoalSchema } = require('../utils/validations');

// PUT /api/user/reading-goal
const updateReadingGoal = async (req, res) => {
    try {
        const result = updateReadingGoalSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(422).json({
                error: 'Validation failed',
                details: result.error.flatten().fieldErrors,
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { readingGoal: result.data.readingGoal },
            { new: true }
        ).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: { id: user._id, name: user.name, email: user.email, readingGoal: user.readingGoal },
        });
    } catch (error) {
        console.error('Update reading goal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { updateReadingGoal };
