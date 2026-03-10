const express = require('express');
const auth = require('../middleware/auth');
const { updateReadingGoal } = require('../controllers/userController');

const router = express.Router();

router.use(auth);
router.put('/reading-goal', updateReadingGoal);

module.exports = router;
