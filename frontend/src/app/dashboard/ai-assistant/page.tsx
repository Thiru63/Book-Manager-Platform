'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';

declare global {
    interface Window {
        puter?: {
            ai: {
                chat: (
                    message: string | Array<{ role: string; content: string }>,
                    options?: { model?: string; stream?: boolean }
                ) => Promise<string | AsyncIterable<{ text?: string }>>;
            };
        };
    }
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AIAssistantPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [booksContext, setBooksContext] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch user books for context
    const fetchBooksContext = useCallback(async () => {
        try {
            const res = await apiFetch('/api/books?limit=50');
            if (res.ok) {
                const data = await res.json();
                const booksList = data.books.map((b: { title: string; author: string; status: string; tags: string[]; rating: number }) =>
                    `"${b.title}" by ${b.author} (Status: ${b.status}, Tags: ${b.tags.join(', ')}, Rating: ${b.rating}/5)`
                ).join('\n');
                setBooksContext(booksList);
            }
        } catch {
            console.error('Failed to fetch books context');
        }
    }, []);

    useEffect(() => {
        fetchBooksContext();
    }, [fetchBooksContext]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            if (!window.puter?.ai) {
                // Wait a bit for puter to load
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }

            if (window.puter?.ai) {
                const systemPrompt = `You are BookShelf AI, a friendly and knowledgeable reading companion. The user's name is ${user?.name || 'Reader'}.

Here are the user's books in their collection:
${booksContext || 'No books added yet.'}

Based on their reading history and preferences, help them with:
1. Book recommendations based on their reading patterns
2. Reading reflections and discussion questions
3. Author information and book connections
4. Reading goal advice
5. Tag/genre suggestions

Be warm, enthusiastic about books, and provide thoughtful, personalized responses. Use emojis sparingly but effectively. Keep responses concise but insightful.`;

                const chatMessages = [
                    { role: 'system', content: systemPrompt },
                    ...messages.map((m) => ({ role: m.role, content: m.content })),
                    { role: 'user', content: userMessage.content },
                ];

                const response = await window.puter.ai.chat(chatMessages, {
                    model: 'gpt-4o-mini',
                    stream: false,
                });

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: typeof response === 'string' ? response : 'I received your message but had trouble formatting my response. Could you try again?',
                    timestamp: new Date(),
                };

                setMessages((prev) => [...prev, assistantMessage]);
            } else {
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: '⚠️ AI features require Puter.js to be loaded. Please make sure you have an internet connection and try refreshing the page. Puter.js provides free access to AI models.',
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error('AI chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '😅 Something went wrong while processing your request. Please try again in a moment.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const quickPrompts = [
        '📚 Recommend books based on my collection',
        '🎯 How am I doing on my reading goals?',
        '🔍 What genres should I explore next?',
        '✍️ Give me discussion questions for my last completed book',
        '📊 Analyze my reading patterns',
        '🌟 What are the best-rated books I should try?',
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            {/* Header */}
            <div className="flex-shrink-0 mb-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">🤖 AI Reading Assistant</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Your personal AI-powered reading companion</p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl mb-6 shadow-lg shadow-violet-500/20 animate-float">
                                🤖
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Hi, {user?.name?.split(' ')[0]}! 👋</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
                                I&apos;m your AI reading companion. Ask me for book recommendations, reading insights, or discussion questions!
                            </p>

                            {/* Quick Prompts */}
                            <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {quickPrompts.map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => { setInput(prompt.replace(/^[^\s]+ /, '')); }}
                                        className="text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/10 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-200 hover:shadow-md"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-md'
                                        : 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 rounded-bl-md'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))
                    )}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-700/50 px-4 py-3 rounded-2xl rounded-bl-md">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Ask me anything about books..."
                            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                            disabled={loading}
                            aria-label="Chat message input"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 disabled:opacity-50 transition-all duration-200 text-sm"
                            aria-label="Send message"
                        >
                            Send
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                        Powered by Puter.js AI • Your reading data is used to personalize responses
                    </p>
                </div>
            </div>
        </div>
    );
}
