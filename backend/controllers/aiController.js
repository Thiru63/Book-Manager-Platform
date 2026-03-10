const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Book = require('../models/Book');

// ─── Helper: Build system prompt with user's book context ──────────────────

const buildSystemPrompt = (userName, booksContext) => {
    return `You are BookShelf AI, a friendly, warm, and knowledgeable reading companion.
The user's name is ${userName}.

Here are the books in their collection:
${booksContext || 'No books added yet.'}

Based on their reading history and preferences, help them with:
1. 📚 Book recommendations based on their reading patterns and favorite genres
2. 💭 Reading reflections and discussion questions for books they've read
3. ✍️ Author information, connections between books, and genre exploration
4. 🎯 Reading goal advice and motivation
5. 🏷️ Tag and genre suggestions for organizing their library

Guidelines:
- Be warm, enthusiastic about books, and provide thoughtful, personalized responses
- Use emojis sparingly but effectively to make responses engaging
- Keep responses concise but insightful (2-4 paragraphs max)
- When recommending books, explain WHY based on their reading history
- If they ask about a book in their collection, reference its details`;
};

// ─── Helper: Call AI API (supports Gemini and Groq) ────────────────────────

const callAI = async (messages, systemPrompt) => {
    // Try providers in order of preference
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;


    if (geminiKey) {
        try {
            return await callGemini(messages, systemPrompt, geminiKey);
        } catch (err) {
            console.warn('Gemini failed, trying fallback:', err.message);
            if (!groqKey) throw err; // No fallback available
        }
    }

    if (groqKey) {
        return await callGroq(messages, systemPrompt, groqKey);
    }

    throw new Error(
        'No AI API key configured. Add GEMINI_API_KEY or GROQ_API_KEY to your .env file.\n' +
        '• Gemini (Google): https://aistudio.google.com/apikey\n' +
        '• Groq (free, works worldwide): https://console.groq.com/keys'
    );
};

// ─── Gemini Provider ──────────────────────────────────────────────────────

const callGemini = async (messages, systemPrompt, apiKey) => {
    const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { temperature: 0.8, topP: 0.95, maxOutputTokens: 1024 },
            }),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`Gemini: ${msg}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned empty response');
    return text;
};

// ─── Groq Provider (OpenAI-compatible API, free tier) ─────────────────────

const callGroq = async (messages, systemPrompt, apiKey) => {
    const groqMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: 0.8,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`Groq: ${msg}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Groq returned empty response');
    return text;
};

// ─── Helper: Get user's books as context string ────────────────────────────

const getUserBooksContext = async (userId) => {
    const books = await Book.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean();

    if (books.length === 0) return '';

    return books
        .map(
            (b) =>
                `"${b.title}" by ${b.author} (Status: ${b.status}, Tags: ${(b.tags || []).join(', ')}, Rating: ${b.rating || 'unrated'}/5)`
        )
        .join('\n');
};

// ─── Controllers ──────────────────────────────────────────────────────────

// GET /api/ai/conversations - List all conversations for user
const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({ userId: req.user.userId })
            .select('title updatedAt messages')
            .sort({ updatedAt: -1 })
            .lean();

        const result = conversations.map((c) => ({
            _id: c._id,
            title: c.title,
            updatedAt: c.updatedAt,
            messageCount: c.messages.length,
            lastMessage: c.messages.length > 0
                ? c.messages[c.messages.length - 1].content.substring(0, 100)
                : '',
        }));

        res.json({ conversations: result });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/ai/conversations - Create a new conversation
const createConversation = async (req, res) => {
    try {
        const conversation = await Conversation.create({
            userId: req.user.userId,
            title: 'New Conversation',
            messages: [],
        });

        res.status(201).json({ conversation });
    } catch (error) {
        console.error('Create conversation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/ai/conversations/:id - Get a conversation with all messages
const getConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            userId: req.user.userId,
        }).lean();

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        res.json({ conversation });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/ai/conversations/:id/messages - Send message & get AI response
const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const conversation = await Conversation.findOne({
            _id: req.params.id,
            userId: req.user.userId,
        });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Add user message
        conversation.messages.push({
            role: 'user',
            content: message.trim(),
        });

        // Auto-title from first user message
        if (conversation.messages.filter((m) => m.role === 'user').length === 1) {
            conversation.title = message.trim().substring(0, 80) + (message.length > 80 ? '...' : '');
        }

        // Get user's books for context
        const booksContext = await getUserBooksContext(req.user.userId);

        // Get user's actual name
        const User = require('../models/User');
        const user = await User.findById(req.user.userId).select('name').lean();
        const displayName = user?.name || req.user.email?.split('@')[0] || 'Reader';

        const systemPrompt = buildSystemPrompt(displayName, booksContext);

        // Call AI with conversation history (last 20 messages for context window)
        const recentMessages = conversation.messages.slice(-20);

        try {
            const aiResponse = await callAI(recentMessages, systemPrompt);

            // Add assistant response
            conversation.messages.push({
                role: 'assistant',
                content: aiResponse,
            });

            await conversation.save();

            res.json({
                userMessage: conversation.messages[conversation.messages.length - 2],
                assistantMessage: conversation.messages[conversation.messages.length - 1],
                conversationTitle: conversation.title,
            });
        } catch (aiError) {
            // Save user message even if AI fails
            await conversation.save();

            console.error('AI processing error:', aiError.message);
            res.status(503).json({
                error: aiError.message,
                userMessage: conversation.messages[conversation.messages.length - 1],
            });
        }
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /api/ai/conversations/:id - Delete a conversation
const deleteConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId,
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getConversations, createConversation, getConversation, sendMessage, deleteConversation };
