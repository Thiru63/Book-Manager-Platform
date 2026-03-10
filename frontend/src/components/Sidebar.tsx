'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/ThemeProvider';
import { getDailyQuote } from '@/lib/quotes';
import { useState } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);
    const quote = getDailyQuote();

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/dashboard/books', label: 'My Books', icon: '📚' },
        { href: '/dashboard/insights', label: 'Insights', icon: '📈' },
        { href: '/dashboard/ai-assistant', label: 'AI Assistant', icon: '🤖' },
    ];

    return (
        <>
            {/* Mobile overlay */}
            <div className={`fixed inset-0 bg-black/50 z-40 lg:hidden ${collapsed ? 'hidden' : ''}`} onClick={() => setCollapsed(true)} />

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 transition-transform duration-300 ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/25">
                        B
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">BookShelf</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Your Reading Companion</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                        ? 'bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-700 dark:text-violet-300 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {item.icon}
                                </span>
                                {!collapsed && <span>{item.label}</span>}
                                {isActive && !collapsed && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Quote of the day */}
                {!collapsed && (
                    <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-100 dark:border-violet-800/30">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">📖 Quote of the Day</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
                        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 font-medium">— {quote.author}</p>
                    </div>
                )}

                {/* Bottom section */}
                <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4 space-y-3">
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200"
                        aria-label="Toggle theme"
                    >
                        <span className="text-xl">{theme === 'dark' ? '☀️' : '🌙'}</span>
                        {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>

                    {/* Collapse toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 hidden lg:flex"
                        aria-label="Toggle sidebar"
                    >
                        <span className="text-xl">{collapsed ? '→' : '←'}</span>
                        {!collapsed && <span>Collapse</span>}
                    </button>

                    {/* User info & logout */}
                    {user && (
                        <div className="flex items-center gap-3 px-4 py-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            {!collapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                                    <button
                                        onClick={logout}
                                        className="text-xs text-red-500 hover:text-red-600 transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile toggle button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="fixed bottom-4 right-4 z-50 lg:hidden w-12 h-12 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30 flex items-center justify-center"
                aria-label="Toggle menu"
            >
                <span className="text-xl">{collapsed ? '☰' : '✕'}</span>
            </button>
        </>
    );
}
