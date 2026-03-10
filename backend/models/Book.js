const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        author: {
            type: String,
            required: [true, 'Author is required'],
            trim: true,
            maxlength: [100, 'Author cannot exceed 100 characters'],
        },
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        status: {
            type: String,
            enum: ['want_to_read', 'reading', 'completed'],
            default: 'want_to_read',
        },
        coverUrl: {
            type: String,
            default: '',
        },
        pageCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        currentPage: {
            type: Number,
            default: 0,
            min: 0,
        },
        description: {
            type: String,
            default: '',
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        notes: {
            type: String,
            default: '',
            maxlength: [5000, 'Notes cannot exceed 5000 characters'],
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        startedAt: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for optimised filtering
bookSchema.index({ userId: 1, status: 1 });
bookSchema.index({ userId: 1, tags: 1 });
bookSchema.index({ userId: 1, createdAt: -1 });

bookSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model('Book', bookSchema);
