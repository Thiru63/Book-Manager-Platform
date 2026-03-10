const express = require('express');
const auth = require('../middleware/auth');
const {
    getBooks,
    createBook,
    getBook,
    updateBook,
    deleteBook,
    getStats,
    searchBooks,
} = require('../controllers/bookController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Stats & search must come before /:id to avoid conflicts
router.get('/stats', getStats);
router.get('/search', searchBooks);

router.get('/', getBooks);
router.post('/', createBook);
router.get('/:id', getBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

module.exports = router;
