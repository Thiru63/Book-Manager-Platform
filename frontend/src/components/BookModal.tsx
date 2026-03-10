'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Book, BookStatus } from '@/hooks/useBooks';
import { useDebounce } from '@/hooks/useDebounce';
import { apiFetch } from '@/lib/api';

interface BookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Book>) => Promise<Book | null>;
    book?: Book | null;
    mode: 'create' | 'edit';
}

interface GoogleBook {
    googleId: string;
    title: string;
    author: string;
    description: string;
    pageCount: number;
    categories: string[];
    coverUrl: string;
}

export default function BookModal({ isOpen, onClose, onSubmit, book, mode }: BookModalProps) {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [status, setStatus] = useState<BookStatus>('want_to_read');
    const [coverUrl, setCoverUrl] = useState('');
    const [pageCount, setPageCount] = useState(0);
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [rating, setRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Google Books search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 500);
    const modalRef = useRef<HTMLDivElement>(null);

    // Pre-fill for edit mode
    useEffect(() => {
        if (book && mode === 'edit') {
            setTitle(book.title);
            setAuthor(book.author);
            setTags(book.tags);
            setStatus(book.status);
            setCoverUrl(book.coverUrl);
            setPageCount(book.pageCount);
            setDescription(book.description);
            setNotes(book.notes);
            setRating(book.rating);
        } else {
            resetForm();
        }
    }, [book, mode, isOpen]);

    // Search Google Books
    const searchGoogleBooks = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await apiFetch(`/api/books/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setSearchResults(data.books || []);
            setShowResults(true);
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    useEffect(() => {
        if (debouncedSearch && mode === 'create') {
            searchGoogleBooks(debouncedSearch);
        }
    }, [debouncedSearch, mode, searchGoogleBooks]);

    const selectGoogleBook = (gBook: GoogleBook) => {
        setTitle(gBook.title);
        setAuthor(gBook.author);
        setCoverUrl(gBook.coverUrl);
        setPageCount(gBook.pageCount);
        setDescription(gBook.description);
        setTags(gBook.categories.slice(0, 5));
        setShowResults(false);
        setSearchQuery('');
    };

    const resetForm = () => {
        setTitle('');
        setAuthor('');
        setTags([]);
        setTagInput('');
        setStatus('want_to_read');
        setCoverUrl('');
        setPageCount(0);
        setDescription('');
        setNotes('');
        setRating(0);
        setErrors({});
        setSearchQuery('');
        setSearchResults([]);
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !tags.includes(tag) && tags.length < 10) {
            setTags([...tags, tag]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};
        if (!title.trim()) newErrors.title = 'Title is required';
        if (!author.trim()) newErrors.author = 'Author is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);
        try {
            const result = await onSubmit({
                title: title.trim(),
                author: author.trim(),
                tags,
                status,
                coverUrl,
                pageCount,
                description,
                notes,
                rating,
            });

            if (result) {
                resetForm();
                onClose();
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={modalRef}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {mode === 'create' ? '📖 Add New Book' : '✏️ Edit Book'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Google Books Search (create mode only) */}
                    {mode === 'create' && (
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                🔍 Search Google Books
                            </label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by title or author to auto-fill..."
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                            />
                            {searching && (
                                <div className="absolute right-3 top-[42px] text-violet-500">
                                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {/* Search Results Dropdown */}
                            {showResults && searchResults.length > 0 && (
                                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                                    {searchResults.map((gBook) => (
                                        <button
                                            key={gBook.googleId}
                                            type="button"
                                            onClick={() => selectGoogleBook(gBook)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                                        >
                                            {gBook.coverUrl ? (
                                                <img src={gBook.coverUrl} alt="" className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0" />
                                            ) : (
                                                <div className="w-10 h-14 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs flex-shrink-0">📚</div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{gBook.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{gBook.author}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cover Preview */}
                    {coverUrl && (
                        <div className="flex justify-center">
                            <img src={coverUrl} alt="Book cover" className="h-32 rounded-lg shadow-lg" />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => { setTitle(e.target.value); setErrors({ ...errors, title: '' }); }}
                                className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border ${errors.title ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                                    } text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all`}
                                placeholder="Book title"
                            />
                            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                        </div>

                        {/* Author */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Author *</label>
                            <input
                                type="text"
                                value={author}
                                onChange={(e) => { setAuthor(e.target.value); setErrors({ ...errors, author: '' }); }}
                                className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border ${errors.author ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                                    } text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all`}
                                placeholder="Author name"
                            />
                            {errors.author && <p className="mt-1 text-xs text-red-500">{errors.author}</p>}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reading Status</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'want_to_read' as const, label: 'Want to Read', icon: '📋', color: 'violet' },
                                { value: 'reading' as const, label: 'Reading', icon: '📖', color: 'amber' },
                                { value: 'completed' as const, label: 'Completed', icon: '✅', color: 'emerald' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStatus(opt.value)}
                                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${status === opt.value
                                        ? opt.color === 'violet'
                                            ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
                                            : opt.color === 'amber'
                                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                                                : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <span>{opt.icon}</span>
                                    <span className="hidden sm:inline">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                >
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 ml-1 transition-colors">✕</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                placeholder="Add a tag..."
                                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-sm transition-all"
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="px-4 py-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Page Count */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Page Count</label>
                            <input
                                type="number"
                                value={pageCount || ''}
                                onChange={(e) => setPageCount(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rating</label>
                            <div className="flex gap-1 pt-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(rating === star ? 0 : star)}
                                        className={`text-2xl transition-all duration-200 hover:scale-125 ${star <= rating ? 'text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.4)]' : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm resize-none"
                            placeholder="Brief description of the book..."
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Personal Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm resize-none"
                            placeholder="Your thoughts about the book..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 disabled:opacity-50 transition-all duration-200"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </span>
                            ) : mode === 'create' ? 'Add Book' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
