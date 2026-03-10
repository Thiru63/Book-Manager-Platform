import { z } from 'zod';

// Client-side only validation schemas (matching backend Zod schemas)

export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email').trim().toLowerCase(),
    password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
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

export type BookStatus = 'want_to_read' | 'reading' | 'completed';
