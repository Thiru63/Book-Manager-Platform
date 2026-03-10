const { z } = require('zod');

// ─── Auth Schemas ──────────────────────────────────────────────────────────

const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50).trim(),
    email: z.string().email('Please enter a valid email').trim().toLowerCase(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100)
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
});

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email').trim().toLowerCase(),
    password: z.string().min(1, 'Password is required'),
});

// ─── Book Schemas ──────────────────────────────────────────────────────────

const bookStatusEnum = z.enum(['want_to_read', 'reading', 'completed']);

const createBookSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200).trim(),
    author: z.string().min(1, 'Author is required').max(100).trim(),
    tags: z.array(z.string().trim().max(100)).max(10).default([]),
    status: bookStatusEnum.default('want_to_read'),
    coverUrl: z.string().url().or(z.literal('')).default(''),
    pageCount: z.number().int().min(0).default(0),
    currentPage: z.number().int().min(0).default(0),
    description: z.string().max(2000).default(''),
    notes: z.string().max(5000).default(''),
    rating: z.number().min(0).max(5).default(0),
});

const updateBookSchema = createBookSchema.partial();

const updateReadingGoalSchema = z.object({
    readingGoal: z.number().int().min(1).max(365),
});

const bookFilterSchema = z.object({
    status: bookStatusEnum.optional(),
    tag: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    sort: z.enum(['createdAt', 'title', 'author', 'rating', 'updatedAt']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
});

module.exports = {
    signupSchema,
    loginSchema,
    createBookSchema,
    updateBookSchema,
    updateReadingGoalSchema,
    bookFilterSchema,
    bookStatusEnum,
};
