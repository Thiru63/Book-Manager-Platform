'use client';

import { useState, useEffect, useCallback } from 'react';
import { StatsSkeleton, ChartSkeleton } from '@/components/LoadingSkeleton';
import { apiFetch } from '@/lib/api';

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

export default function InsightsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [charts, setCharts] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await apiFetch('/api/books/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setCharts(data.charts);
            }
        } catch (err) {
            console.error('Failed to fetch insights:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Reading Insights</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Discover patterns in your reading</p>
                </div>
                <StatsSkeleton />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartSkeleton />
                    <ChartSkeleton />
                </div>
            </div>
        );
    }

    const genreDiversity = charts?.topTags ? Math.min(charts.topTags.length * 10, 100) : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">📈 Reading Insights</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Deep dive into your reading habits</p>
            </div>

            {/* Momentum Card */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-violet-500/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold opacity-90">Reading Momentum</h2>
                        <p className="text-5xl font-bold mt-2">{stats?.momentum?.emoji || '🌧️'} {stats?.momentum?.label}</p>
                        <p className="text-sm opacity-80 mt-2">
                            {stats?.momentum?.score === 3
                                ? "You're on fire! Keep up the amazing reading pace."
                                : stats?.momentum?.score === 2
                                    ? "Good progress! A little more reading will boost your momentum."
                                    : "Time to pick up a book! Your next great adventure awaits."}
                        </p>
                    </div>
                    <div className="text-7xl opacity-30">{stats?.momentum?.emoji || '📚'}</div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
                {[
                    { label: 'Total Books', value: stats?.totalBooks || 0, icon: '📚', color: 'violet' },
                    { label: 'Completed', value: stats?.completedCount || 0, icon: '✅', color: 'emerald' },
                    { label: 'Avg Rating', value: `${stats?.avgRating || '—'} ★`, icon: '⭐', color: 'amber' },
                    { label: 'Books/Month', value: stats?.readingVelocity || 0, icon: '🚀', color: 'blue' },
                    { label: 'Completion %', value: `${stats?.completionRate || 0}%`, icon: '📊', color: 'indigo' },
                ].map((metric) => (
                    <div key={metric.label} className="bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all group">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{metric.icon}</span>
                            <span className="text-xs text-gray-500 font-medium">{metric.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform">{metric.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Completions */}
                <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">📅 Monthly Completions</h2>
                    {charts?.monthlyCompletions && charts.monthlyCompletions.length > 0 ? (
                        <div className="space-y-3">
                            {charts.monthlyCompletions.map((item) => {
                                const maxCount = Math.max(...charts.monthlyCompletions.map((m) => m.count));
                                const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                                return (
                                    <div key={item.month} className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right flex-shrink-0">{item.month}</span>
                                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg flex items-center justify-end pr-2 transition-all duration-1000"
                                                style={{ width: `${Math.max(pct, 8)}%` }}
                                            >
                                                <span className="text-[10px] text-white font-bold">{item.count}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-4xl mb-2">📈</p>
                            <p className="text-sm text-gray-500">Complete some books to see your monthly trends!</p>
                        </div>
                    )}
                </div>

                {/* Genre Diversity */}
                <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">🌈 Genre Diversity Score</h2>
                    <div className="flex items-center justify-center py-6">
                        <div className="relative w-36 h-36">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10" className="stroke-gray-200 dark:stroke-gray-700" />
                                <circle
                                    cx="50" cy="50" r="40" fill="none" strokeWidth="10"
                                    strokeDasharray={`${genreDiversity * 2.51} 251`}
                                    strokeLinecap="round"
                                    className="stroke-violet-500 transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">{genreDiversity}%</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        {genreDiversity >= 70
                            ? '🌟 Excellent diversity! You explore many genres.'
                            : genreDiversity >= 40
                                ? '📖 Good variety! Try exploring more genres.'
                                : '🔍 Consider branching out into new genres!'}
                    </p>
                </div>
            </div>

            {/* Tag Cloud & Author Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tag Cloud */}
                <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">🏷️ Tag Cloud</h2>
                    {charts?.topTags && charts.topTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 justify-center">
                            {charts.topTags.map((tag, i) => {
                                const maxCount = Math.max(...charts.topTags.map((t) => t.count));
                                const scale = 0.75 + (tag.count / maxCount) * 0.75;
                                const colors = [
                                    'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
                                    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                                    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
                                    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
                                    'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
                                ];
                                return (
                                    <span
                                        key={tag.name}
                                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-medium transition-transform hover:scale-110 cursor-default ${colors[i % colors.length]}`}
                                        style={{ fontSize: `${scale}rem` }}
                                    >
                                        {tag.name}
                                        <span className="text-xs opacity-60">({tag.count})</span>
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-8">Add tags to see your tag cloud!</p>
                    )}
                </div>

                {/* Author Insights */}
                <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">✍️ Author Insights</h2>
                    {charts?.topAuthors && charts.topAuthors.length > 0 ? (
                        <div className="space-y-3">
                            {charts.topAuthors.slice(0, 7).map((author, i) => {
                                const maxCount = Math.max(...charts.topAuthors.map((a) => a.count));
                                const pct = (author.count / maxCount) * 100;
                                return (
                                    <div key={author.name} className="flex items-center gap-3 group">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}>
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{author.name}</p>
                                                <p className="text-xs text-gray-500 flex-shrink-0">{author.count} {author.count === 1 ? 'book' : 'books'}</p>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {stats?.topAuthor && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    You&apos;ve read <span className="font-bold text-violet-600 dark:text-violet-400">{stats.topAuthor.count} books</span> by{' '}
                                    <span className="font-bold">{stats.topAuthor.name}</span> — your most-read author! 🎉
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-8">Add books to discover your reading patterns.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
