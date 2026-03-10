'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';

interface Message {
    _id?: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface ConversationSummary {
    _id: string;
    title: string;
    updatedAt: string;
    messageCount: number;
    lastMessage: string;
}

export default function AIAssistantPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch all conversations
    const fetchConversations = useCallback(async () => {
        try {
            const res = await apiFetch('/api/ai/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations);
            }
        } catch {
            console.error('Failed to fetch conversations');
        } finally {
            setLoadingConversations(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load a conversation
    const loadConversation = async (id: string) => {
        setActiveConversationId(id);
        try {
            const res = await apiFetch(`/api/ai/conversations/${id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages((data.conversation.messages || []).filter(Boolean));
            }
        } catch {
            console.error('Failed to load conversation');
        }
    };

    // Create new conversation
    const createNewConversation = async () => {
        try {
            const res = await apiFetch('/api/ai/conversations', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setActiveConversationId(data.conversation._id);
                setMessages([]);
                await fetchConversations();
            }
        } catch {
            console.error('Failed to create conversation');
        }
    };

    // Delete conversation
    const deleteConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this conversation?')) return;

        try {
            const res = await apiFetch(`/api/ai/conversations/${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (activeConversationId === id) {
                    setActiveConversationId(null);
                    setMessages([]);
                }
                await fetchConversations();
            }
        } catch {
            console.error('Failed to delete conversation');
        }
    };

    // Send message
    const sendMessage = async (messageText?: string) => {
        const text = (messageText || input).trim();
        if (!text || loading) return;

        // If no active conversation, create one first
        let conversationId = activeConversationId;
        if (!conversationId) {
            try {
                const res = await apiFetch('/api/ai/conversations', { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    conversationId = data.conversation._id;
                    setActiveConversationId(conversationId);
                }
            } catch {
                return;
            }
        }

        // Optimistically add user message
        const userMessage: Message = {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await apiFetch(`/api/ai/conversations/${conversationId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ message: text }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => [
                    ...prev.slice(0, -1), // Remove optimistic user message
                    data.userMessage,
                    data.assistantMessage,
                ].filter(Boolean));
                // Update conversation list
                await fetchConversations();
            } else {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                const errorMessage: Message = {
                    role: 'assistant',
                    content: `⚠️ ${errorData.error || 'Something went wrong. Please try again.'}`,
                    timestamp: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('AI chat error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: '😅 Something went wrong while processing your request. Please try again in a moment.',
                timestamp: new Date().toISOString(),
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
        '✍️ Give me discussion questions for my last book',
        '📊 Analyze my reading patterns',
        '🌟 What are the best-rated books I should try?',
    ];

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-4">
            {/* Conversation Sidebar */}
            <div
                className={`${sidebarOpen ? 'w-72' : 'w-0'} flex-shrink-0 transition-all duration-300 overflow-hidden`}
            >
                <div className="h-full w-72 bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                        <button
                            onClick={createNewConversation}
                            className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">+</span> New Chat
                        </button>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loadingConversations ? (
                            <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-2xl mb-2">💬</p>
                                <p className="text-xs text-gray-400">No conversations yet</p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv._id}
                                    onClick={() => loadConversation(conv._id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter') loadConversation(conv._id); }}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all group cursor-pointer ${activeConversationId === conv._id
                                        ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate text-[13px]">{conv.title}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{formatTime(conv.updatedAt)} • {conv.messageCount} msgs</p>
                                        </div>
                                        <button
                                            onClick={(e) => deleteConversation(conv._id, e)}
                                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
                                            title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                                                <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5Z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">🤖 AI Reading Assistant</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Powered by Google Gemini</p>
                    </div>
                </div>

                {/* Chat Container */}
                <div className="flex-1 bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col overflow-hidden">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl mb-6 shadow-lg shadow-violet-500/20 animate-float">
                                    🤖
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Hi{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
                                    I&apos;m your AI reading companion. Ask me for book recommendations, reading insights, or discussion questions!
                                </p>

                                {/* Quick Prompts */}
                                <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {quickPrompts.map((prompt) => (
                                        <button
                                            key={prompt}
                                            onClick={() => sendMessage(prompt)}
                                            className="text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/10 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-200 hover:shadow-md"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.filter(Boolean).map((msg, i) => (
                                <div
                                    key={msg._id || `msg-${i}`}
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
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder="Ask me anything about books..."
                                className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                                disabled={loading}
                                aria-label="Chat message input"
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || loading}
                                className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 disabled:opacity-50 transition-all duration-200 text-sm"
                                aria-label="Send message"
                            >
                                Send
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 text-center">
                            Powered by Google Gemini AI • Conversations are saved automatically
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
