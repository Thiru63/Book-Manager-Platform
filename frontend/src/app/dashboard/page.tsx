'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useCallback } from 'react';
import { StatsSkeleton, ChartSkeleton } from '@/components/LoadingSkeleton';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

interface Stats {
    totalBooks: number;
    completedCount: number;
    readingCount: number;
    wantToReadCount: number;
    completionRate: number;
    avgRating: number;
    readingVelocity: number;
    momentum: { label: string; emoji: string; score: number };
    topAuthor: { name: string; count: number } | null;
    topTag: { name: string; count: number } | null;
}

interface ChartData {
    statusDistribution: { name: string; value: number; color: string }[];
    monthlyCompletions: { month: string; count: number }[];
    topTags: { name: string; count: number }[];
    topAuthors: { name: string; count: number }[];
}

interface RecentBook {
    _id: string;
    title: string;
    author: string;
    status: string;
    coverUrl: string;
    updatedAt: string;
}

export default function DashboardPage() {
    const { user, updateReadingGoal } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [charts, setCharts] = useState<ChartData | null>(null);
    const [recentBooks, setRecentBooks] = useState<RecentBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingGoal, setEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState('');

    const fetchStats = useCallback(async () => {
        try {
            const res = await apiFetch('/api/books/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setCharts(data.charts);
                setRecentBooks(data.recentBooks);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleGoalSave = async () => {
        const goal = parseInt(goalInput);
        if (goal && goal >= 1 && goal <= 365) {
            await updateReadingGoal(goal);
            setEditingGoal(false);
        }
    };

    const statusLabels: Record<string, string> = {
        want_to_read: '📋 Want to Read',
        reading: '📖 Reading',
        completed: '✅ Completed',
    };


    const goalProgress = user && stats ? Math.min((stats.completedCount / user.readingGoal) * 100, 100) : 0;

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome back, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Here&apos;s your reading overview
                    </p>
                </div>
                <Link
                    href="/dashboard/books"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 text-sm"
                >
                    <span>📚</span> Browse Books
                </Link>
            </div>

            {loading ? (
                <>
                    <StatsSkeleton />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartSkeleton />
                        <ChartSkeleton />
                    </div>
                </>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Books</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 group-hover:scale-105 transition-transform">{stats?.totalBooks || 0}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">in your collection</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Currently Reading</p>
                            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1 group-hover:scale-105 transition-transform">{stats?.readingCount || 0}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">books in progress</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Completed</p>
                            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 group-hover:scale-105 transition-transform">{stats?.completedCount || 0}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stats?.completionRate || 0}% completion rate</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Momentum</p>
                            <p className="text-3xl font-bold mt-1 group-hover:scale-105 transition-transform">
                                {stats?.momentum?.emoji || '🌧️'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stats?.momentum?.label || 'Start reading!'}</p>
                        </div>
                    </div>

                    {/* Reading Goal & What to Read Next */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Reading Goal */}
                        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-gray-900 dark:text-white">🎯 Reading Goal</h2>
                                <button
                                    onClick={() => { setEditingGoal(!editingGoal); setGoalInput(user?.readingGoal?.toString() || '12'); }}
                                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                                >
                                    {editingGoal ? 'Cancel' : 'Edit'}
                                </button>
                            </div>

                            {editingGoal ? (
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="number"
                                        value={goalInput}
                                        onChange={(e) => setGoalInput(e.target.value)}
                                        className="w-20 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm"
                                        min="1"
                                        max="365"
                                    />
                                    <span className="text-sm text-gray-500">books this year</span>
                                    <button
                                        onClick={handleGoalSave}
                                        className="px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {stats?.completedCount || 0} of {user?.readingGoal || 12} books completed
                                </p>
                            )}

                            <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${goalProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">{Math.round(goalProgress)}% of yearly goal</p>
                        </div>

                        {/* What to Read Next */}
                        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">🔮 What to Read Next</h2>
                            {stats && stats.wantToReadCount > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        You have <span className="font-bold text-violet-600 dark:text-violet-400">{stats.wantToReadCount} books</span> waiting on your shelf.
                                    </p>
                                    {stats.readingVelocity > 0 && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            At your current pace of <span className="font-bold">{stats.readingVelocity} books/month</span>, you could finish them all in{' '}
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                {Math.ceil(stats.wantToReadCount / stats.readingVelocity)} months
                                            </span>.
                                        </p>
                                    )}
                                    <Link
                                        href="/dashboard/books?status=want_to_read"
                                        className="inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline"
                                    >
                                        Browse your to-read list →
                                    </Link>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-4xl mb-2">📚</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Your shelf is waiting for its first story.</p>
                                    <Link href="/dashboard/books" className="inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline mt-2">
                                        Add your first book →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Status Distribution */}
                        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">📊 Status Distribution</h2>
                            {charts && charts.statusDistribution.some(s => s.value > 0) ? (
                                <div className="space-y-3">
                                    {charts.statusDistribution.map((item) => {
                                        const total = charts.statusDistribution.reduce((s, i) => s + i.value, 0);
                                        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                        return (
                                            <div key={item.name}>
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{item.value} ({pct}%)</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000"
                                                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-8">No books yet. Start adding!</p>
                            )}
                        </div>

                        {/* Top Tags */}
                        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">🏷️ Top Tags</h2>
                            {charts && charts.topTags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {charts.topTags.map((tag, i) => (
                                        <Link
                                            key={tag.name}
                                            href={`/dashboard/books?tag=${encodeURIComponent(tag.name)}`}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md ${i === 0
                                                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                                                : i === 1
                                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                                                }`}
                                        >
                                            {tag.name}
                                            <span className="text-xs opacity-75">({tag.count})</span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-8">Add tags to your books to see them here.</p>
                            )}
                        </div>
                    </div>

                    {/* Author Universe & Quick Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Author Universe */}
                        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">✍️ Author Universe</h2>
                            {charts && charts.topAuthors.length > 0 ? (
                                <div className="space-y-2">
                                    {charts.topAuthors.slice(0, 5).map((author, i) => (
                                        <div key={author.name} className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${i === 0 ? 'bg-gradient-to-br from-violet-500 to-indigo-600' :
                                                i === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                                                    'bg-gradient-to-br from-gray-400 to-gray-500'
                                                }`}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{author.name}</p>
                                                <p className="text-xs text-gray-500">{author.count} {author.count === 1 ? 'book' : 'books'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-8">Your author universe will grow as you add books.</p>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">⚡ Quick Stats</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Average Rating</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-yellow-400">★</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{stats?.avgRating || '—'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Reading Velocity</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{stats?.readingVelocity || 0} books/month</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Favourite Author</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{stats?.topAuthor?.name || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Top Tag</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{stats?.topTag?.name || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{stats?.completionRate || 0}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Books */}
                    <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-900 dark:text-white">📕 Recent Activity</h2>
                            <Link href="/dashboard/books" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">
                                View all →
                            </Link>
                        </div>

                        {recentBooks.length > 0 ? (
                            <div className="space-y-3">
                                {recentBooks.map((book) => (
                                    <div key={book._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        {book.coverUrl ? (
                                            <img src={book.coverUrl} alt="" className="w-10 h-14 rounded-lg object-cover shadow-sm flex-shrink-0" />
                                        ) : (
                                            <div className="w-10 h-14 rounded-lg bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">📚</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{book.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{book.author}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                                            {statusLabels[book.status] || book.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-4xl mb-2">📚</p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Your shelf is waiting for its first story.</p>
                                <Link href="/dashboard/books" className="inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline mt-2">
                                    Add your first book →
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
