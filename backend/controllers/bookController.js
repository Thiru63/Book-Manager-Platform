const mongoose = require('mongoose');
const Book = require('../models/Book');
const { createBookSchema, updateBookSchema, bookFilterSchema } = require('../utils/validations');
const { sanitizeInput } = require('../utils/sanitize');

// GET /api/books - Get all books with filtering, pagination, sorting
const getBooks = async (req, res) => {
    try {
        const filterResult = bookFilterSchema.safeParse({
            status: req.query.status || undefined,
            tag: req.query.tag || undefined,
            search: req.query.search || undefined,
            page: req.query.page || 1,
            limit: req.query.limit || 20,
            sort: req.query.sort || 'createdAt',
            order: req.query.order || 'desc',
        });

        if (!filterResult.success) {
            return res.status(422).json({
                error: 'Invalid filter parameters',
                details: filterResult.error.flatten().fieldErrors,
            });
        }

        const { status, tag, search, page, limit, sort, order } = filterResult.data;
        const userId = new mongoose.Types.ObjectId(req.user.userId);

        // Build query
        const query = { userId };
        if (status) query.status = status;
        if (tag) query.tags = { $in: [tag] };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
            ];
        }

        const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

        const [books, total, allTags] = await Promise.all([
            Book.find(query).sort(sortObj).skip((page - 1) * limit).limit(limit).lean(),
            Book.countDocuments(query),
            Book.distinct('tags', { userId }),
        ]);

        res.json({
            books,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            allTags,
        });
    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/books - Create a new book
const createBook = async (req, res) => {
    try {
        const sanitized = sanitizeInput(req.body);
        const result = createBookSchema.safeParse(sanitized);

        if (!result.success) {
            return res.status(422).json({
                error: 'Validation failed',
                details: result.error.flatten().fieldErrors,
            });
        }

        const bookData = {
            ...result.data,
            userId: new mongoose.Types.ObjectId(req.user.userId),
            startedAt: result.data.status === 'reading' ? new Date() : null,
            completedAt: result.data.status === 'completed' ? new Date() : null,
        };

        const book = await Book.create(bookData);
        res.status(201).json({ book });
    } catch (error) {
        console.error('Create book error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/books/:id - Get single book
const getBook = async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json({ book });
    } catch (error) {
        console.error('Get book error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /api/books/:id - Update book (partial update — only modifies sent fields)
const updateBook = async (req, res) => {
    try {
        const sanitized = sanitizeInput(req.body);

        // Only validate fields that were actually sent in the request
        // This prevents Zod defaults from overwriting existing data
        const fieldsToValidate = {};
        const allowedFields = ['title', 'author', 'tags', 'status', 'coverUrl', 'pageCount', 'currentPage', 'description', 'notes', 'rating'];
        for (const key of allowedFields) {
            if (key in sanitized) {
                fieldsToValidate[key] = sanitized[key];
            }
        }

        const result = updateBookSchema.safeParse(fieldsToValidate);

        if (!result.success) {
            return res.status(422).json({
                error: 'Validation failed',
                details: result.error.flatten().fieldErrors,
            });
        }

        const currentBook = await Book.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!currentBook) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Only include validated fields that were actually in the request
        const updateData = {};
        for (const key of Object.keys(result.data)) {
            if (key in sanitized) {
                updateData[key] = result.data[key];
            }
        }

        // Handle status transitions
        if (updateData.status && updateData.status !== currentBook.status) {
            if (updateData.status === 'reading' && !currentBook.startedAt) {
                updateData.startedAt = new Date();
            }
            if (updateData.status === 'completed') {
                updateData.completedAt = new Date();
                if (!currentBook.startedAt) {
                    updateData.startedAt = new Date();
                }
            }
        }

        const book = await Book.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.json({ book });
    } catch (error) {
        console.error('Update book error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /api/books/:id - Delete book
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Delete book error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/books/stats - Get reading statistics
const getStats = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.userId);

        const [statusCounts, tagCounts, authorCounts, monthlyCounts, recentBooks, allBooks] = await Promise.all([
            Book.aggregate([{ $match: { userId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
            Book.aggregate([
                { $match: { userId } }, { $unwind: '$tags' },
                { $group: { _id: '$tags', count: { $sum: 1 } } },
                { $sort: { count: -1 } }, { $limit: 15 },
            ]),
            Book.aggregate([
                { $match: { userId } },
                { $group: { _id: '$author', count: { $sum: 1 } } },
                { $sort: { count: -1 } }, { $limit: 10 },
            ]),
            Book.aggregate([
                {
                    $match: {
                        userId,
                        status: 'completed',
                        completedAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
                    },
                },
                {
                    $group: {
                        _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
            Book.find({ userId }).sort({ updatedAt: -1 }).limit(5).lean(),
            Book.find({ userId }).lean(),
        ]);

        const totalBooks = allBooks.length;
        const statusMap = {};
        statusCounts.forEach((s) => { statusMap[s._id] = s.count; });

        const completedCount = statusMap['completed'] || 0;
        const readingCount = statusMap['reading'] || 0;
        const wantToReadCount = statusMap['want_to_read'] || 0;
        const completionRate = totalBooks > 0 ? Math.round((completedCount / totalBooks) * 100) : 0;

        const topAuthor = authorCounts.length > 0 ? authorCounts[0] : null;
        const topTag = tagCounts.length > 0 ? tagCounts[0] : null;

        const ratedBooks = allBooks.filter((b) => b.rating > 0);
        const avgRating = ratedBooks.length > 0
            ? Math.round((ratedBooks.reduce((sum, b) => sum + b.rating, 0) / ratedBooks.length) * 10) / 10
            : 0;

        // Reading momentum
        const last30DaysCompleted = allBooks.filter(
            (b) => b.status === 'completed' && b.completedAt && new Date(b.completedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length;

        let momentum;
        if (last30DaysCompleted >= 3 || readingCount >= 2) {
            momentum = { label: 'Strong', emoji: '🔥', score: 3 };
        } else if (last30DaysCompleted >= 1 || readingCount >= 1) {
            momentum = { label: 'Moderate', emoji: '🌱', score: 2 };
        } else {
            momentum = { label: 'Needs Push', emoji: '🌧️', score: 1 };
        }

        // Reading velocity (books/month over last 6 months)
        const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        const recentlyCompleted = allBooks.filter(
            (b) => b.status === 'completed' && b.completedAt && new Date(b.completedAt) > sixMonthsAgo
        ).length;
        const readingVelocity = Math.round((recentlyCompleted / 6) * 10) / 10;

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = monthlyCounts.map((m) => ({
            month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
            count: m.count,
        }));

        res.json({
            stats: {
                totalBooks, completedCount, readingCount, wantToReadCount,
                completionRate, avgRating, readingVelocity, momentum,
                topAuthor: topAuthor ? { name: topAuthor._id, count: topAuthor.count } : null,
                topTag: topTag ? { name: topTag._id, count: topTag.count } : null,
            },
            charts: {
                statusDistribution: [
                    { name: 'Want to Read', value: wantToReadCount, color: '#6366f1' },
                    { name: 'Reading', value: readingCount, color: '#f59e0b' },
                    { name: 'Completed', value: completedCount, color: '#10b981' },
                ],
                monthlyCompletions: monthlyData,
                topTags: tagCounts.map((t) => ({ name: t._id, count: t.count })),
                topAuthors: authorCounts.map((a) => ({ name: a._id, count: a.count })),
            },
            recentBooks,
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/books/search - Search books using Open Library API (free, no key needed)
const searchBooks = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Try Open Library first (free, no API key, no quota limits)
        try {
            const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=key,title,author_name,first_publish_year,number_of_pages_median,subject,cover_i,isbn`;
            const olResponse = await fetch(olUrl);
            const olData = await olResponse.json();

            if (olData.docs && olData.docs.length > 0) {
                const books = olData.docs.map((doc) => ({
                    googleId: doc.key || '',
                    title: doc.title || 'Unknown Title',
                    author: (doc.author_name || []).join(', ') || 'Unknown Author',
                    description: '',
                    pageCount: doc.number_of_pages_median || 0,
                    categories: (doc.subject || []).slice(0, 5),
                    coverUrl: doc.cover_i
                        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
                        : '',
                    publishedDate: doc.first_publish_year ? `${doc.first_publish_year}` : '',
                }));

                return res.json({ books });
            }
        } catch (olError) {
            console.error('Open Library search failed, trying Google Books:', olError.message);
        }

        // Fallback to Google Books API
        try {
            const gUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`;
            const gResponse = await fetch(gUrl);
            const gData = await gResponse.json();

            if (gData.items) {
                const books = gData.items.map((item) => {
                    const info = item.volumeInfo || {};
                    return {
                        googleId: item.id,
                        title: info.title || 'Unknown Title',
                        author: (info.authors || []).join(', ') || 'Unknown Author',
                        description: info.description || '',
                        pageCount: info.pageCount || 0,
                        categories: info.categories || [],
                        coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') || '',
                        publishedDate: info.publishedDate || '',
                    };
                });

                return res.json({ books });
            }
        } catch (gError) {
            console.error('Google Books fallback also failed:', gError.message);
        }

        // Both APIs failed
        res.json({ books: [] });
    } catch (error) {
        console.error('Book search error:', error);
        res.status(500).json({ error: 'Failed to search books' });
    }
};

module.exports = { getBooks, createBook, getBook, updateBook, deleteBook, getStats, searchBooks };
