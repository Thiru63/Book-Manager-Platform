'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export type BookStatus = 'want_to_read' | 'reading' | 'completed';

export interface Book {
    _id: string;
    userId: string;
    title: string;
    author: string;
    tags: string[];
    status: BookStatus;
    coverUrl: string;
    pageCount: number;
    currentPage: number;
    description: string;
    notes: string;
    rating: number;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface BookFilters {
    status?: BookStatus;
    tag?: string;
    search?: string;
    page?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

interface UseBooksReturn {
    books: Book[];
    loading: boolean;
    error: string | null;
    pagination: Pagination;
    allTags: string[];
    filters: BookFilters;
    setFilters: (filters: BookFilters) => void;
    fetchBooks: (filters?: BookFilters) => Promise<void>;
    createBook: (data: Partial<Book>) => Promise<Book | null>;
    updateBook: (id: string, data: Partial<Book>) => Promise<Book | null>;
    deleteBook: (id: string) => Promise<boolean>;
    updateBookStatus: (id: string, status: BookStatus) => Promise<Book | null>;
    updateBookProgress: (id: string, currentPage: number) => Promise<Book | null>;
}

export function useBooks(): UseBooksReturn {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [allTags, setAllTags] = useState<string[]>([]);
    const [filters, setFilters] = useState<BookFilters>({});

    const fetchBooks = useCallback(async (overrideFilters?: BookFilters) => {
        try {
            setLoading(true);
            setError(null);

            const activeFilters = overrideFilters || filters;
            const params = new URLSearchParams();

            if (activeFilters.status) params.set('status', activeFilters.status);
            if (activeFilters.tag) params.set('tag', activeFilters.tag);
            if (activeFilters.search) params.set('search', activeFilters.search);
            if (activeFilters.page) params.set('page', activeFilters.page.toString());
            if (activeFilters.sort) params.set('sort', activeFilters.sort);
            if (activeFilters.order) params.set('order', activeFilters.order);

            const res = await apiFetch(`/api/books?${params.toString()}`);

            if (!res.ok) throw new Error('Failed to fetch books');

            const data = await res.json();
            setBooks(data.books);
            setPagination(data.pagination);
            setAllTags(data.allTags);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    const createBook = async (data: Partial<Book>): Promise<Book | null> => {
        try {
            const res = await apiFetch('/api/books', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create book');
            }
            const { book } = await res.json();
            setBooks((prev) => [book, ...prev]);
            return book;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return null;
        }
    };

    const updateBook = async (id: string, data: Partial<Book>): Promise<Book | null> => {
        try {
            const res = await apiFetch(`/api/books/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update book');
            }
            const { book } = await res.json();
            setBooks((prev) => prev.map((b) => (b._id === id ? book : b)));
            return book;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return null;
        }
    };

    const deleteBook = async (id: string): Promise<boolean> => {
        const previousBooks = books;
        setBooks((prev) => prev.filter((b) => b._id !== id));
        try {
            const res = await apiFetch(`/api/books/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                setBooks(previousBooks);
                throw new Error('Failed to delete book');
            }
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return false;
        }
    };

    const updateBookStatus = async (id: string, status: BookStatus): Promise<Book | null> => {
        const previousBooks = books;
        setBooks((prev) => prev.map((b) => (b._id === id ? { ...b, status } : b)));
        try {
            const res = await apiFetch(`/api/books/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                setBooks(previousBooks);
                throw new Error('Failed to update status');
            }
            const { book } = await res.json();
            setBooks((prev) => prev.map((b) => (b._id === id ? book : b)));
            return book;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return null;
        }
    };

    const updateBookProgress = async (id: string, currentPage: number): Promise<Book | null> => {
        const previousBooks = books;
        setBooks((prev) => prev.map((b) => (b._id === id ? { ...b, currentPage } : b)));
        try {
            const res = await apiFetch(`/api/books/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ currentPage }),
            });
            if (!res.ok) {
                setBooks(previousBooks);
                throw new Error('Failed to update progress');
            }
            const { book } = await res.json();
            setBooks((prev) => prev.map((b) => (b._id === id ? book : b)));
            return book;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return null;
        }
    };

    return {
        books, loading, error, pagination, allTags, filters, setFilters,
        fetchBooks, createBook, updateBook, deleteBook, updateBookStatus, updateBookProgress,
    };
}
