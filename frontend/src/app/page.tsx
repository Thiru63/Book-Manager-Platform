'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { getRandomQuote } from '@/lib/quotes';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setQuote(getRandomQuote());
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/25">
            B
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">BookShelf</span>
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : user ? (
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
            >
              Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">
        <div className="animate-float mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-4xl shadow-2xl shadow-violet-500/30">
            📚
          </div>
        </div>

        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in">
          <span className="text-gray-900 dark:text-white">Your Personal</span>
          <br />
          <span className="gradient-text">Reading Companion</span>
        </h1>

        <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-10 animate-fade-in leading-relaxed" style={{ animationDelay: '0.2s' }}>
          Track your reading journey, discover new books with AI-powered recommendations,
          and unlock insights about your reading habits.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Link
            href={user ? '/dashboard' : '/signup'}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-lg hover:from-violet-700 hover:to-indigo-700 shadow-xl shadow-violet-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1"
          >
            {user ? 'Go to Dashboard' : 'Start Reading Journey'} ✨
          </Link>
          <Link
            href="#features"
            className="px-8 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-300 hover:-translate-y-1"
          >
            Explore Features ↓
          </Link>
        </div>

        {/* Quote */}
        <div className="mt-16 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-gray-600 dark:text-gray-400 italic text-sm leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
            <p className="text-violet-600 dark:text-violet-400 font-medium text-sm mt-2">— {quote.author}</p>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-24 w-full max-w-5xl">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">Everything You Need</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {[
              { icon: '📖', title: 'Track Your Books', desc: 'Organize your library with tags, status tracking, and reading progress.' },
              { icon: '🤖', title: 'AI Recommendations', desc: 'Get personalized book suggestions powered by AI based on your reading habits.' },
              { icon: '📊', title: 'Reading Insights', desc: 'Beautiful charts and stats about your reading habits, pace, and preferences.' },
              { icon: '🔍', title: 'Smart Search', desc: 'Auto-fill book details from Google Books API. Just search and add.' },
              { icon: '🎯', title: 'Reading Goals', desc: 'Set yearly reading goals and track your progress with visual indicators.' },
              { icon: '🌙', title: 'Dark Mode', desc: 'Beautiful dark and light themes that respect your system preferences.' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1 transition-all duration-300 text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-sm text-gray-500 dark:text-gray-400">
        <p>Built with ❤️ using Next.js, MongoDB & AI</p>
      </footer>
    </div>
  );
}
