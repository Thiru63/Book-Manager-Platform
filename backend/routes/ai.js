const express = require('express');
const auth = require('../middleware/auth');
const {
    getConversations,
    createConversation,
    getConversation,
    sendMessage,
    deleteConversation,
} = require('../controllers/aiController');

const router = express.Router();

// All routes require authentication
router.use(auth);

router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversation);
router.post('/conversations/:id/messages', sendMessage);
router.delete('/conversations/:id', deleteConversation);

module.exports = router;
