# 📚 BookShelf — Your Personal Reading Companion

A full-stack book management platform with AI-powered reading assistant, built with **Next.js 16**, **Express.js 5**, and **MongoDB**.

![Tech Stack](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![Express](https://img.shields.io/badge/Express-5-green?logo=express) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)

---

## ✨ Features

### 📖 Book Management
- **Full CRUD** — Add, edit, update, and delete books
- **Book Search** — Search via Open Library API (free, no key) with Google Books fallback
- **Auto-Fill** — Select a search result to auto-populate title, author, cover, tags, and page count
- **Reading Status** — Track books as "Want to Read", "Reading", or "Completed"
- **Progress Tracking** — Update current page with progress bar visualization
- **Tags & Categories** — Organize books with customizable tags
- **Star Ratings** — Rate books from 1–5 stars
- **Cover Images** — Display book covers from Open Library

### 📊 Dashboard & Insights
- **Reading Statistics** — Total books, status breakdown, completion rate
- **Reading Goals** — Set and track annual reading goals
- **Tag Cloud** — Visualize popular tags and genres
- **Top Authors** — See most-read authors
- **Monthly Completions** — Chart of books completed over time (Recharts)
- **Achievement Celebrations** — Confetti animation when completing a book 🎉

### 🤖 AI Reading Assistant
- **Powered by Google Gemini / Groq (Llama 3.3 70B)** — Multi-provider AI with automatic fallback
- **Personalized Recommendations** — AI uses your book collection as context
- **Conversation Persistence** — All chats stored in MongoDB, accessible anytime
- **Conversation Sidebar** — Browse, load, and delete past conversations
- **Quick Prompts** — Pre-built prompts for common requests
- **Backend-Handled** — No client-side API keys, secure server-side AI calls

### 🔐 Authentication & Security
- **JWT Authentication** — Access + Refresh token rotation
- **HTTP-Only Cookies** — Secure token storage (no localStorage exposure)
- **Cross-Domain Support** — SameSite=None cookies for Vercel ↔ Render deployment
- **Password Hashing** — bcryptjs with salt rounds
- **Input Sanitization** — NoSQL injection prevention
- **Rate Limiting** — Brute-force protection on auth endpoints
- **Helmet.js** — Secure HTTP headers
- **Zod Validation** — Server-side schema validation on all inputs

### 🎨 UI/UX
- **Dark/Light Mode** — Toggle with system preference detection
- **Responsive Design** — Mobile-first, works on all screen sizes
- **Glassmorphism & Gradients** — Modern, premium visual design
- **Micro-Animations** — Smooth transitions and hover effects
- **Keyboard Shortcuts** — Quick navigation
- **Loading Skeletons** — Elegant loading states

---

## 🏗️ Architecture

```
book-manager/
├── backend/                    # Express.js 5 REST API
│   ├── config/
│   │   └── db.js              # MongoDB Atlas connection
│   ├── controllers/
│   │   ├── authController.js  # Signup, Login, Logout, Refresh, GetMe
│   │   ├── bookController.js  # CRUD, Search, Stats, Filters
│   │   ├── aiController.js    # AI chat (Gemini/Groq), conversation mgmt
│   │   └── userController.js  # Reading goal updates
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   ├── models/
│   │   ├── User.js            # User schema (name, email, passwordHash, readingGoal)
│   │   ├── Book.js            # Book schema (title, author, tags, status, progress)
│   │   ├── Conversation.js    # AI conversation schema (messages history)
│   │   └── RefreshToken.js    # Token rotation storage
│   ├── routes/
│   │   ├── auth.js            # /api/auth/*
│   │   ├── books.js           # /api/books/*
│   │   ├── ai.js              # /api/ai/*
│   │   └── user.js            # /api/user/*
│   ├── utils/
│   │   ├── jwt.js             # Token generation & verification
│   │   ├── validations.js     # Zod schemas for all inputs
│   │   └── sanitize.js        # NoSQL injection prevention
│   ├── server.js              # Express app entry point
│   └── .env.example           # Environment template
│
├── frontend/                   # Next.js 16 (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/        # Login & Signup pages
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx           # Dashboard with stats
│   │   │   │   ├── books/page.tsx     # Book list with filters
│   │   │   │   ├── insights/page.tsx  # Analytics & charts
│   │   │   │   ├── ai-assistant/page.tsx  # AI chat interface
│   │   │   │   └── layout.tsx         # Dashboard layout with sidebar
│   │   │   ├── layout.tsx     # Root layout (fonts, providers)
│   │   │   └── page.tsx       # Landing page
│   │   ├── components/
│   │   │   ├── BookCard.tsx   # Book card with edit/delete icons
│   │   │   ├── BookModal.tsx  # Add/Edit book modal with search
│   │   │   ├── Sidebar.tsx    # Navigation sidebar
│   │   │   ├── ThemeProvider.tsx  # Dark/Light mode context
│   │   │   └── LoadingSkeleton.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.tsx    # Auth context & state management
│   │   │   ├── useBooks.ts    # Book CRUD operations hook
│   │   │   ├── useDebounce.ts # Input debouncing
│   │   │   └── useKeyboardShortcuts.ts
│   │   └── lib/
│   │       ├── api.ts         # Fetch wrapper with auth refresh
│   │       ├── validations.ts # Client-side Zod schemas
│   │       └── quotes.ts      # Motivational book quotes
│   └── .env.example           # Environment template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB Atlas** account (free tier works)
- **AI API Key** (one of):
  - [Groq](https://console.groq.com/keys) — Free, works worldwide (recommended)
  - [Google Gemini](https://aistudio.google.com/apikey) — Free tier (region-dependent)

### 1. Clone the Repository

```bash
git clone https://github.com/Thiru63/Book-Manager-Platform.git
cd Book-Manager-Platform
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/book_manager
JWT_ACCESS_SECRET=your-secure-access-secret
JWT_REFRESH_SECRET=your-secure-refresh-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
GEMINI_API_KEY=your-gemini-key       # Optional
GROQ_API_KEY=your-groq-key           # Recommended
```

Start the backend:

```bash
npm run dev     # Development (with hot reload)
npm start       # Production
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

### 4. Open the App

Visit **https://book-manager-platform.vercel.app/** — create an account and start managing your books!

Backend Url [https://book-manager-platform.onrender.com](https://book-manager-platform.onrender.com)

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login (sets cookies) |
| POST | `/api/auth/logout` | Logout (clears cookies) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Books

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books` | List books (with filters, pagination, sorting) |
| POST | `/api/books` | Create a book |
| GET | `/api/books/:id` | Get single book |
| PUT | `/api/books/:id` | Partial update (only sent fields modified) |
| DELETE | `/api/books/:id` | Delete a book |
| GET | `/api/books/stats` | Reading statistics |
| GET | `/api/books/search?q=` | Search Open Library / Google Books |

### AI Assistant

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/conversations` | List all conversations |
| POST | `/api/ai/conversations` | Create new conversation |
| GET | `/api/ai/conversations/:id` | Get conversation with messages |
| POST | `/api/ai/conversations/:id/messages` | Send message & get AI response |
| DELETE | `/api/ai/conversations/:id` | Delete conversation |

### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/user/reading-goal` | Update reading goal |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

---

## 🌐 Deployment

### Backend → Render

1. Create a **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo, set root directory to `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all environment variables (set `NODE_ENV=production`)
6. Set `CLIENT_URL` to your Vercel URL

### Frontend → Vercel

1. Import project on [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
4. Deploy

> ⚠️ **Important**: Set `NODE_ENV=production` on Render for cross-domain cookies to work (SameSite=None, Secure=true).

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16 (App Router) | React framework with SSR |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Charts** | Recharts | Data visualization |
| **Backend** | Express.js 5 | REST API server |
| **Database** | MongoDB Atlas + Mongoose 9 | Document database + ODM |
| **Auth** | JWT + HTTP-Only Cookies | Secure stateless auth |
| **Validation** | Zod 4 | Schema validation |
| **AI** | Google Gemini / Groq | AI reading assistant |
| **Book Data** | Open Library API | Free book search & covers |
| **Security** | Helmet, CORS, bcryptjs | Security hardening |
| **Deployment** | Vercel + Render | Serverless + cloud hosting |

---

## 📄 License

This project is licensed under the ISC License.

---

Built with ❤️ by Thirumalai E
