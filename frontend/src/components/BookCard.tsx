'use client';

import { Book } from '@/hooks/useBooks';
import { BookStatus } from '@/lib/validations';
import { useState } from 'react';

interface BookCardProps {
    book: Book;
    onStatusChange: (id: string, status: BookStatus) => Promise<Book | null>;
    onEdit: (book: Book) => void;
    onDelete: (id: string) => Promise<boolean>;
    onProgressUpdate: (id: string, currentPage: number) => Promise<Book | null>;
}

export default function BookCard({ book, onStatusChange, onEdit, onDelete, onProgressUpdate }: BookCardProps) {
    const [showProgress, setShowProgress] = useState(false);
    const [progressInput, setProgressInput] = useState(book.currentPage.toString());
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const statusColors = {
        want_to_read: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
        reading: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
        completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
    };

    const statusLabels = {
        want_to_read: '📋 Want to Read',
        reading: '📖 Reading',
        completed: '✅ Completed',
    };

    const statusOptions: BookStatus[] = ['want_to_read', 'reading', 'completed'];

    const handleStatusChange = async (newStatus: BookStatus) => {
        if (newStatus === 'completed' && book.status !== 'completed') {
            setShowConfetti(true);
            try {
                const confetti = (await import('canvas-confetti')).default;
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b'],
                });
            } catch {
                // Confetti not available
            }
            setTimeout(() => setShowConfetti(false), 3000);
        }
        await onStatusChange(book._id, newStatus);
    };

    const handleProgressSave = async () => {
        const page = parseInt(progressInput);
        if (!isNaN(page) && page >= 0) {
            await onProgressUpdate(book._id, page);
            setShowProgress(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 3000);
            return;
        }
        setIsDeleting(true);
        await onDelete(book._id);
        setIsDeleting(false);
        setConfirmDelete(false);
    };

    const progress = book.pageCount > 0 ? Math.min((book.currentPage / book.pageCount) * 100, 100) : 0;

    return (
        <div
            className={`group relative bg-white dark:bg-gray-800/60 rounded-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 hover:border-violet-300/50 dark:hover:border-violet-600/50 shadow-sm hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 hover:-translate-y-1 ${isDeleting ? 'opacity-50 scale-95' : ''
                } ${showConfetti ? 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
        >
            <div className="flex">
                {/* Book Cover */}
                <div className="relative w-24 sm:w-28 flex-shrink-0">
                    {book.coverUrl ? (
                        <img
                            src={book.coverUrl}
                            alt={`Cover of ${book.title}`}
                            className="w-full h-full object-cover min-h-[160px]"
                        />
                    ) : (
                        <div className="w-full h-full min-h-[160px] bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                            <span className="text-3xl">📚</span>
                        </div>
                    )}

                    {/* Rating overlay */}
                    {book.rating > 0 && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-0.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                            <span className="text-yellow-400 text-xs">★</span>
                            <span className="text-white text-xs font-medium">{book.rating}</span>
                        </div>
                    )}
                </div>

                {/* Book Details */}
                <div className="flex-1 p-4 flex flex-col min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-tight truncate">
                                {book.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">by {book.author}</p>
                        </div>

                        {/* Direct Action Icons — Edit & Delete */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                                onClick={() => onEdit(book)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                                aria-label="Edit book"
                                title="Edit"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                                </svg>
                            </button>
                            <button
                                onClick={handleDelete}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${confirmDelete
                                    ? 'text-white bg-red-500 hover:bg-red-600 scale-110'
                                    : 'text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    }`}
                                aria-label={confirmDelete ? 'Confirm delete' : 'Delete book'}
                                title={confirmDelete ? 'Click again to confirm' : 'Delete'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.177-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Tags */}
                    {book.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {book.tags.slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                                >
                                    {tag}
                                </span>
                            ))}
                            {book.tags.length > 3 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                                    +{book.tags.length - 3}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Progress bar for reading books */}
                    {book.status === 'reading' && book.pageCount > 0 && (
                        <div className="mt-auto pt-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <span>Page {book.currentPage} of {book.pageCount}</span>
                                <button
                                    onClick={() => setShowProgress(!showProgress)}
                                    className="text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors"
                                >
                                    {Math.round(progress)}% • Update
                                </button>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Status badge + inline status switchers */}
                    <div className="mt-auto pt-2 flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium ${statusColors[book.status].bg} ${statusColors[book.status].text}`}>
                            {statusLabels[book.status]}
                        </span>

                        {/* Inline status change buttons */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {statusOptions.filter((s) => s !== book.status).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleStatusChange(s)}
                                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title={statusLabels[s]}
                                >
                                    {s === 'want_to_read' ? '📋' : s === 'reading' ? '📖' : '✅'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress update panel */}
            {showProgress && (
                <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-200/50 dark:border-amber-800/30">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={progressInput}
                            onChange={(e) => setProgressInput(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            min="0"
                            max={book.pageCount}
                            placeholder="Current page"
                        />
                        <span className="text-sm text-gray-500">/ {book.pageCount}</span>
                        <button
                            onClick={handleProgressSave}
                            className="px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
