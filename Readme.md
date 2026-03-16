# CampusConnect 🎓

A full-stack AI-powered social media platform built for college communities. Students can share thoughts, post photos/videos, interact with peers, and get AI assistance for writing — all in a modern, premium interface.

---

## ✨ Features

- **User Authentication** — Register, login, JWT-based sessions with secure password hashing
- **Posts** — Share text thoughts, photos, and videos with your campus
- **AI Tone Helper** — Rewrite posts in 6 tones (Casual, Formal, Hype, Witty, Empathetic, Concise) powered by Groq
- **AI Search Summary** — Intelligent summaries of search results using Groq LLM
- **Comments** — Threaded comments on every post
- **Likes** — Like/unlike posts with real-time count updates
- **Notifications** — Real-time notifications for likes, comments, and follows — click to navigate directly to the post or profile
- **Explore Page** — Search posts and people with keyword highlighting, real trending topics, and AI summaries
- **User Profiles** — Public readonly profiles with follow/unfollow, post history, and stats
- **Follow System** — Follow other users, get follower/following counts
- **Media Uploads** — Photo and video uploads via Cloudinary CDN
- **Edit Profile** — Update display name and bio
- **Post Detail Page** — Full post view with all comments

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| TypeScript | Type safety |
| Tailwind CSS | Utility styling |
| shadcn/ui | UI component library |
| React Router DOM | Client-side routing |
| Axios | HTTP client |
| Lucide React | Icons |
| Plus Jakarta Sans | Typography |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| TypeScript | Type safety |
| PostgreSQL | Primary database |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Multer | File upload handling |
| Cloudinary SDK | Media storage and CDN |
| Groq SDK | LLM API (llama-3.1-8b-instant) |
| nodemon + ts-node | Development server |

### External Services
| Service | Purpose |
|---|---|
| Groq API | AI tone rewriting + search summaries |
| Cloudinary | Photo and video storage |
| PostgreSQL (local) | Database via pgAdmin |

---

## 📁 Project Structure

```
project/
├── frontend/                     # React + Vite app
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts         # Axios instance with JWT interceptor
│   │   │   ├── posts.ts          # Posts API calls
│   │   │   └── notifications.ts  # Notifications API calls
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx   # Navigation sidebar with notification badge
│   │   │   │   └── MainLayout.tsx
│   │   │   └── AiToneHelper.tsx  # AI tone rewrite popup
│   │   ├── hooks/
│   │   │   └── useAuth.ts        # Auth state management
│   │   ├── lib/
│   │   │   └── utils.ts          # Helpers (formatDate, getInitials, cn)
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx     # Register + Login
│   │   │   ├── FeedPage.tsx      # Home feed with compose box
│   │   │   ├── ExplorePage.tsx   # Search, trending, people
│   │   │   ├── NotificationsPage.tsx
│   │   │   ├── ProfilePage.tsx   # Own profile with edit
│   │   │   ├── UserProfilePage.tsx # Public readonly profile
│   │   │   └── PostPage.tsx      # Single post detail
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript interfaces
│   │   ├── App.tsx               # Router and auth gate
│   │   └── index.css             # Global styles + design tokens
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/                      # Node + Express API
    ├── src/
    │   ├── db/
    │   │   └── index.ts          # PostgreSQL pool
    │   ├── lib/
    │   │   └── cloudinary.ts     # Cloudinary config
    │   ├── middleware/
    │   │   └── auth.ts           # JWT authentication middleware
    │   ├── routes/
    │   │   ├── auth.ts           # Register, login, profile, follow
    │   │   ├── posts.ts          # CRUD, likes, comments, media upload
    │   │   ├── notifications.ts  # Get, mark read
    │   │   └── ai.ts             # Groq tone rewrite + search summary
    │   └── index.ts              # Express server entry point
    ├── .env                      # Environment variables
    ├── tsconfig.json
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed:
- **Node.js** v18+
- **pgAdmin** + PostgreSQL running locally
- **VS Code** (recommended)

### 1. Clone or navigate to the project

```bash
cd Desktop
# frontend/ and backend/ folders should be side by side
```

### 2. Set up the database

Open **pgAdmin**, connect to your local PostgreSQL server, and run this SQL in the Query Tool:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Configure backend environment

Create `backend/.env`:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/campusconnect
JWT_SECRET=your_super_secret_key_here
GROQ_API_KEY=your_groq_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 4. Start the backend

```bash
cd backend
npm install
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3000
✅ Connected to PostgreSQL
```

### 5. Start the frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Open your browser at **http://localhost:5173**

---

## 🔑 Getting API Keys

### Groq API (Free)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / log in
3. Navigate to **API Keys** → Create new key
4. Copy and paste into `backend/.env` as `GROQ_API_KEY`

### Cloudinary (Free tier)
1. Go to [cloudinary.com](https://cloudinary.com) and sign up
2. From your dashboard, find:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. Paste all three into `backend/.env`

---

## 🗺 API Reference

### Auth Routes — `/api/auth`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/register` | Create new account | No |
| POST | `/login` | Sign in | No |
| GET | `/me` | Get current user | ✅ |
| PATCH | `/profile` | Update display name / bio | ✅ |
| GET | `/user/:username` | Get public profile | ✅ |
| GET | `/user/:username/posts` | Get user's posts | ✅ |
| POST | `/user/:username/follow` | Follow / unfollow | ✅ |

### Posts Routes — `/api/posts`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | Get all posts (feed) | ✅ |
| POST | `/` | Create post (with optional media) | ✅ |
| GET | `/:id` | Get single post | ✅ |
| POST | `/:id/like` | Like / unlike post | ✅ |
| GET | `/:id/comments` | Get post comments | ✅ |
| POST | `/:id/comments` | Add a comment | ✅ |

### Notifications Routes — `/api/notifications`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | Get all notifications | ✅ |
| PATCH | `/read-all` | Mark all as read | ✅ |
| PATCH | `/:id/read` | Mark one as read | ✅ |

### AI Routes — `/api/ai`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/rewrite-tone` | Rewrite text in a given tone | ✅ |
| POST | `/search-summary` | Summarise search results | ✅ |

---

## 🤖 AI Features

### Tone Rewriter
When composing a post, click the **✨ AI Tone** button to open the tone helper. Choose from:

| Tone | Description |
|---|---|
| 😊 Casual | Friendly and conversational |
| 👔 Formal | Professional, LinkedIn-style |
| 🔥 Hype | Excited and energetic |
| 😏 Witty | Clever with a touch of humour |
| 💙 Empathetic | Warm and emotionally aware |
| ⚡ Concise | Short and punchy |

You can also add a **custom instruction** (e.g. "add a question at the end") before regenerating.

### Search Summary
When searching on the Explore page, an AI summary card automatically appears summarising what people are saying about the topic — powered by `llama-3.1-8b-instant` via Groq.

---

## 🎨 Design System

The app uses a custom design system defined in `src/index.css`:

```css
--brand-500: #6366f1    /* Primary indigo */
--brand-600: #4f46e5    /* Darker indigo */
--pink-500:  #ec4899    /* Accent pink */
--surface:   #ffffff    /* Card background */
--surface-2: #f8f9ff    /* Page background */
--border:    #e8eaf6    /* Default border */
--text-primary:   #0f1117
--text-secondary: #4b5563
--text-muted:     #9ca3af
```

Font: **Plus Jakarta Sans** (400, 500, 600, 700)

---

## 📱 Pages Overview

| Route | Page | Description |
|---|---|---|
| `/` | Feed | Home timeline with compose box |
| `/explore` | Explore | Search, trending topics, people |
| `/notifications` | Notifications | Likes, comments, follows |
| `/profile` | My Profile | Own profile with edit |
| `/user/:username` | User Profile | Public profile + follow button |
| `/post/:id` | Post Detail | Full post with all comments |

---

## 🐛 Common Issues

**Database connection fails**
- Make sure PostgreSQL is running in pgAdmin
- Check your password in `DATABASE_URL` inside `.env`

**Groq API errors**
- Verify your `GROQ_API_KEY` is correct
- Make sure model is set to `llama-3.1-8b-instant`

**Cloudinary uploads fail**
- Double-check all 3 Cloudinary values in `.env`
- Ensure your Cloudinary account is active

**Frontend can't reach backend**
- Confirm backend is running on port `3000`
- Check `src/api/client.ts` baseURL is `http://localhost:3000/api`

---

## 👨‍💻 Development Scripts

### Backend
```bash
npm run dev      # Start with hot reload (nodemon)
npm run build    # Compile TypeScript
npm start        # Run compiled JS
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
```

---

## 🔮 Future Enhancements

- [ ] Pinecone vector search for semantic post discovery
- [ ] Real-time notifications via WebSockets
- [ ] Direct messaging between users
- [ ] Post bookmarks / saved posts
- [ ] Hashtag pages
- [ ] Profile picture upload
- [ ] Post deletion and editing
- [ ] Dark mode toggle
- [ ] Mobile responsive design

---

## 📄 License

This project was built as a college demo project. Free to use and modify for educational purposes.

---

<div align="center">
  <strong>Built with ❤️ for the campus community</strong><br/>
  <sub>CampusConnect — Where campus conversations happen</sub>
</div>