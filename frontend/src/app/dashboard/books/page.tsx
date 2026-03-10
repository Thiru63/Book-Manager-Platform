'use client';

import { useBooks, Book, BookStatus } from '@/hooks/useBooks';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDebounce } from '@/hooks/useDebounce';
import BookCard from '@/components/BookCard';
import BookModal from '@/components/BookModal';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function BooksPage() {
    const {
        books,
        loading,
        allTags,
        pagination,
        filters,
        setFilters,
        fetchBooks,
        createBook,
        updateBook,
        deleteBook,
        updateBookStatus,
        updateBookProgress,
    } = useBooks();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 400);

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Read filters from URL on mount
    useEffect(() => {
        const urlStatus = searchParams.get('status') as BookStatus | null;
        const urlTag = searchParams.get('tag');
        const urlSearch = searchParams.get('search');

        const newFilters: Record<string, string | undefined> = {};
        if (urlStatus) newFilters.status = urlStatus;
        if (urlTag) newFilters.tag = urlTag;
        if (urlSearch) {
            newFilters.search = urlSearch;
            setSearchInput(urlSearch);
        }

        if (Object.keys(newFilters).length > 0) {
            setFilters(newFilters as typeof filters);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync filters to URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.tag) params.set('tag', filters.tag);
        if (filters.search) params.set('search', filters.search);

        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(newUrl ?? '/dashboard/books', { scroll: false });
    }, [filters, pathname, router]);

    // Update search filter when debounced value changes
    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            setFilters({ ...filters, search: debouncedSearch || undefined });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    // Keyboard shortcuts
    useKeyboardShortcuts([
        {
            key: 'n',
            action: () => { setEditingBook(null); setModalOpen(true); },
            description: 'Add new book',
        },
    ]);

    const handleEdit = (book: Book) => {
        setEditingBook(book);
        setModalOpen(true);
    };

    const handleModalSubmit = async (data: Partial<Book>) => {
        if (editingBook) {
            return await updateBook(editingBook._id, data);
        }
        return await createBook(data);
    };

    const handleStatusFilter = (status: BookStatus | undefined) => {
        setFilters({ ...filters, status, page: 1 });
    };

    const handleTagFilter = (tag: string | undefined) => {
        setFilters({ ...filters, tag, page: 1 });
    };

    const statusCounts = useMemo(() => {
        // We'll show approximate counts from the current data
        return {
            all: pagination.total,
            want_to_read: books.filter((b) => b.status === 'want_to_read').length,
            reading: books.filter((b) => b.status === 'reading').length,
            completed: books.filter((b) => b.status === 'completed').length,
        };
    }, [books, pagination.total]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">My Books</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {pagination.total} {pagination.total === 1 ? 'book' : 'books'} in your collection
                    </p>
                </div>
                <button
                    onClick={() => { setEditingBook(null); setModalOpen(true); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 text-sm"
                    id="add-book-button"
                >
                    <span className="text-lg">+</span> Add Book
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono">N</kbd>
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 space-y-4">
                {/* Search */}
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by title or author..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                        aria-label="Search books"
                    />
                    {searchInput && (
                        <button
                            onClick={() => { setSearchInput(''); setFilters({ ...filters, search: undefined }); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {[
                        { value: undefined, label: 'All', icon: '📚', count: statusCounts.all },
                        { value: 'want_to_read' as const, label: 'Want to Read', icon: '📋', count: statusCounts.want_to_read },
                        { value: 'reading' as const, label: 'Reading', icon: '📖', count: statusCounts.reading },
                        { value: 'completed' as const, label: 'Completed', icon: '✅', count: statusCounts.completed },
                    ].map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => handleStatusFilter(tab.value)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${filters.status === tab.value
                                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/30'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tag Filter */}
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium py-1">Tags:</span>
                        {filters.tag && (
                            <button
                                onClick={() => handleTagFilter(undefined)}
                                className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                            >
                                Clear ✕
                            </button>
                        )}
                        {allTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => handleTagFilter(tag === filters.tag ? undefined : tag)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${filters.tag === tag
                                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 ring-1 ring-violet-300 dark:ring-violet-700'
                                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Book List */}
            {loading ? (
                <LoadingSkeleton count={4} />
            ) : books.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4 animate-float">📚</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {filters.status || filters.tag || filters.search
                            ? 'No books match your filters'
                            : 'Your shelf is waiting for its first story.'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        {filters.status || filters.tag || filters.search
                            ? 'Try adjusting your search or filters to find what you\'re looking for.'
                            : 'Start building your personal library. Search Google Books to auto-fill details!'}
                    </p>
                    {!(filters.status || filters.tag || filters.search) && (
                        <button
                            onClick={() => { setEditingBook(null); setModalOpen(true); }}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all"
                        >
                            + Add Your First Book
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                    {books.map((book) => (
                        <BookCard
                            key={book._id}
                            book={book}
                            onStatusChange={updateBookStatus}
                            onEdit={handleEdit}
                            onDelete={deleteBook}
                            onProgressUpdate={updateBookProgress}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                        disabled={(filters.page || 1) <= 1}
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← Previous
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400 px-4">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                        disabled={(filters.page || 1) >= pagination.totalPages}
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Book Modal */}
            <BookModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditingBook(null); }}
                onSubmit={handleModalSubmit}
                book={editingBook}
                mode={editingBook ? 'edit' : 'create'}
            />
        </div>
    );
}
