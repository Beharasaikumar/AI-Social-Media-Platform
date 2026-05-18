# CampusConnect 🎓

A full-stack, AI-powered social media and collaboration platform designed exclusively for college communities. CampusConnect provides a premium, responsive environment where students can share thoughts, collaborate, message each other, review placements, download materials, and utilize modern LLMs via Groq to rewrite posts and summarize searches.

---

## ✨ System Features

### 👤 Core & Authentication
- **Secure Password Hashing**: Registration and login using `bcryptjs` for secure password storage.
- **JWT Session Management**: Stateful-looking but stateless JWT-based token generation, stored securely, and attached to all private HTTP requests via Axios interceptors.
- **Two-Factor OTP Security**: Dynamic, timed OTP verification via `otp_verifications` for new registration signups and password changes.
- **Detailed Profiles**: Public readonly profiles showing individual stats (followers, following, post counts), and dynamic bios.
- **Edit Profiles**: Update display names, bios, and customize profile initials in real-time.

### 📝 Interactions & Social Feed
- **Interactive Compose Area**: Dynamic rich-text editor with instant preview capability.
- **Media Uploads (Cloudinary)**: Multi-media handling supporting image and video uploads directly linked to posts using Cloudinary CDN.
- **Likes System**: Real-time post interaction with instant like status changes and automatic count increments.
- **Threaded Comments**: Interactive nested comment feeds for deep community discussions.
- **Social Bookmarks**: Save posts instantly to read later via the "Saved Posts" dashboard page.
- **Follower Network**: Reciprocal social graphing (follow/unfollow actions) with real-time stats updating on profiles.

### 💬 Direct Messaging (DMs)
- **Direct Messaging Engine**: Safe conversation initiation between any two campus peers.
- **Inbox view**: Lists all conversations sorted dynamically by the latest message sent.
- **Unread Badging**: Real-time DM indicator bubbles displaying accurate unread counts, running on a robust polling routine.
- **Secure Authorization**: Multi-party conversation checking ensuring only authorized users can read messages.

### 🛡️ Admin Dashboard (Role-Based Access Control)
- **Unified Placement Portal**: Admin-curated jobs, internships, and recruitment announcements complete with titles, company names, descriptions, salary ranges, deadlines, and application links.
- **Announcements Feed**: Pin site-wide, non-deletable notifications detailing important campus news.
- **Notes & Study Materials Hub**: Centralized repository supporting PDF/DOCX lecture upload, handled safely via raw buffer Cloudinary streams.
- **Admin Control Centre**: Custom routing restricted solely to `isAdmin = true` accounts, featuring form creation for placements, announcements, and materials.

### 🤖 Core AI Integrations
- **Groq Tone Rewriter**: Rewrite posts in 6 high-fidelity conversational tones powered by `llama-3.1-8b-instant`:
  - 😊 **Casual**: Conversational and friendly.
  - 👔 **Formal**: Professional, LinkedIn-ready.
  - 🔥 **Hype**: High-energy and exciting.
  - 😏 **Witty**: Clever and humor-infused.
  - 💙 **Empathetic**: Emotionally warm and understanding.
  - ⚡ **Concise**: Clear, punchy, and short.
- **AI Search Summary**: When search results are retrieved on the Explore page, the system uses Groq LLM to instantly generate a summarized card explaining the core consensus and topic sentiments.

---

## 🛠 Tech Stack

### Frontend Architecture
| Technology | Core Purpose |
| :--- | :--- |
| **React 18 + Vite** | Fast development server and static build packaging. |
| **TypeScript** | Strict typings for components, contexts, and API responses. |
| **Tailwind CSS** | Atomic utility class styling for core widgets. |
| **Vanilla CSS Tokens** | Custom dark/light mode system using standardized variables. |
| **React Router DOM** | Declarative page navigation and role-guarded routing. |
| **Axios** | Client-side fetcher with request interceptors for token injection. |
| **Lucide React** | High-quality responsive vector icon system. |

### Backend Architecture
| Technology | Core Purpose |
| :--- | :--- |
| **Node.js + Express** | High-performance asynchronous REST API server. |
| **TypeScript** | Structured static types for controllers, routers, and DB query models. |
| **PostgreSQL** | Primary relational database hosting user data, posts, DMs, and admin items. |
| **Multer** | In-memory buffer processor for uploading files. |
| **Cloudinary SDK** | Automated media pipeline for high-fidelity hosting and optimization. |
| **Groq SDK** | Fast integration with Llama 3 models. |

---

## 📁 Repository Structure

```text
CampusConnect/
├── frontend/                         # Client React App
│   ├── src/
│   │   ├── api/
│   │   │   ├── admin.ts              # Placements, announcements, materials API
│   │   │   ├── client.ts             # Axios configuration with JWT headers
│   │   │   ├── dm.ts                 # DM queries and unread counts
│   │   │   ├── notifications.ts      # Mark read / get notifications
│   │   │   └── posts.ts              # Fetching, liking, commenting
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx    # Overall page wrapper
│   │   │   │   └── Sidebar.tsx       # Sidebar navigation and notifications
│   │   │   └── AiToneHelper.tsx      # Groq Tone Rewriter UI popup
│   │   ├── hooks/
│   │   │   ├── useAuth.ts            # AuthContext hooks
│   │   │   └── useDarkMode.ts        # DarkMode toggle persistent hook
│   │   ├── pages/
│   │   │   ├── AdminDashboard.tsx    # Management portal for Admins
│   │   │   ├── ExplorePage.tsx       # Post/user search and trending topics
│   │   │   ├── DMPage.tsx            # Chat UI & conversation list
│   │   │   ├── FeedPage.tsx          # Standard scroll timeline
│   │   │   ├── LoginPage.tsx         # Combined Sign in, Register, and OTP verification
│   │   │   ├── NotificationsPage.tsx # List of notifications
│   │   │   └── ProfilePage.tsx       # Profile viewing and editing page
│   │   ├── types/
│   │   │   └── index.ts              # Domain interfaces (Post, User, Comment, DM)
│   │   ├── App.tsx                   # Central router & context gatekeeper
│   │   └── index.css                 # Custom premium CSS variable theme
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/                          # REST API Server
    ├── src/
    │   ├── db/
    │   │   ├── index.ts              # Postgres pool connection
    │   │   └── migration.sql         # Source schema migrations
    │   ├── lib/
    │   │   └── cloudinary.ts         # Cloudinary configuration
    │   ├── middleware/
    │   │   └── auth.ts               # JWT decoder & token parser
    │   ├── routes/
    │   │   ├── admin.ts              # Placements, announcements, materials logic
    │   │   ├── ai.ts                 # Groq tone rewrite & search summary routes
    │   │   ├── auth.ts               # Login, register, follow/unfollow, profiles
    │   │   ├── dm.ts                 # Direct messages & conversations
    │   │   ├── notifications.ts      # Fetching & marking unread notifications
    │   │   └── posts.ts              # Posts, comments, likes, and Cloudinary uploads
    │   └── index.ts                  # Server entrypoint file
    ├── .env                          # Local Environment configuration
    ├── tsconfig.json
    └── package.json
```

---

## 💾 Database Schema

CampusConnect uses PostgreSQL with UUID keys for robust, secure, and relational storage. To set up your local database, run the following SQL schema inside your **pgAdmin** Query Tool or local command-line interface:

```sql
-- Enable UUID generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(50) UNIQUE NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE,
  bio           TEXT,
  avatar_url    TEXT,
  cover_url     TEXT,
  password_hash TEXT        NOT NULL,
  is_verified   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OTP verification logs
CREATE TABLE IF NOT EXISTS otp_verifications (
  id         UUID       PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp        VARCHAR(4) NOT NULL,
  purpose    VARCHAR(10) NOT NULL CHECK (purpose IN ('register', 'login', 'forgot')),
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN    NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_user ON otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);

-- Password reset logs
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT,
  media_url    TEXT,
  media_type   VARCHAR(10),
  repost_of_id UUID        REFERENCES posts(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID        REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID        REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id  UUID        REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID        REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  actor_id   UUID        REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(20) NOT NULL,
  post_id    UUID        REFERENCES posts(id) ON DELETE CASCADE,
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations (Direct Messaging)
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_pair CHECK (user1_id < user2_id),
  UNIQUE (user1_id, user2_id)
);

-- Messages (Direct Messaging)
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT        NOT NULL CHECK (char_length(content) > 0),
  read            BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conv_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_msg_conv_time ON messages(conversation_id, created_at);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);

-- Placements (Admin Feature)
CREATE TABLE IF NOT EXISTS placements (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        VARCHAR(20) NOT NULL CHECK (type IN ('job', 'internship', 'recruitment')),
  company     VARCHAR(255) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  salary      VARCHAR(100),
  deadline    TIMESTAMPTZ,
  link        TEXT,
  created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Announcements (Admin Feature)
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      VARCHAR(255) NOT NULL,
  content    TEXT        NOT NULL,
  posted_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Materials (Admin Feature)
CREATE TABLE IF NOT EXISTS materials (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  file_url    TEXT        NOT NULL,
  file_type   VARCHAR(10) NOT NULL,
  uploaded_by UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: Version 18.0.0 or higher.
- **PostgreSQL**: Local running server.

### 2. Configure Environment Variables
Create a new file named `.env` inside the `backend/` folder and populate it with the appropriate values:

```env
PORT=3000
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/campusconnect
JWT_SECRET=your_high_entropy_secret_signature
GROQ_API_KEY=gsk_your_free_groq_api_token
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

*Note: You can generate your free Groq API key at [console.groq.com](https://console.groq.com) and Cloudinary credentials at [cloudinary.com](https://cloudinary.com).*

### 3. Server Installation & Execution
```bash
cd backend
npm install
npm run dev
```
Wait for confirmation in the terminal:
```text
🚀 Server running on http://localhost:3000
✅ Connected to PostgreSQL
```

### 4. Client Installation & Execution
Open a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at **[http://localhost:5173](http://localhost:5173)** to access the platform.

---

## 🗺 API Endpoint Directory

### 🔐 Authentication & Social graph — `/api/auth`
| Method | Endpoint | Purpose | Access Control |
| :--- | :--- | :--- | :--- |
| **POST** | `/register` | Sign up a new user account (fires verification OTP) | Public |
| **POST** | `/login` | Authenticate username/password and return JWT | Public |
| **GET** | `/me` | Retrieve the active user credentials and role | Authenticated |
| **PATCH** | `/profile` | Modify active user profile display name or bio | Authenticated |
| **GET** | `/user/:username` | Retrieve a user profile card and follower stats | Authenticated |
| **GET** | `/user/:username/posts` | Retrieve all posts authored by a user | Authenticated |
| **POST** | `/user/:username/follow`| Follow/unfollow toggle action | Authenticated |

### 📝 Posts Feed & Interactions — `/api/posts`
| Method | Endpoint | Purpose | Access Control |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Fetch standard timeline feed with full paging | Authenticated |
| **POST** | `/` | Post text content alongside optional Cloudinary attachments | Authenticated |
| **GET** | `/:id` | Retrieve full post information with nested comments | Authenticated |
| **POST** | `/:id/like` | Like/unlike toggle action | Authenticated |
| **GET** | `/:id/comments` | Retrieve comments array | Authenticated |
| **POST** | `/:id/comments` | Post a comment | Authenticated |

### 💬 Direct Messaging (DMs) — `/api/dm`
| Method | Endpoint | Purpose | Access Control |
| :--- | :--- | :--- | :--- |
| **GET** | `/conversations` | Retrieve all active peer conversations | Authenticated |
| **POST** | `/conversations` | Open a conversation channel with a user | Authenticated |
| **GET** | `/conversations/:id/messages` | Retrieve message logs for a DM | Authenticated |
| **POST** | `/conversations/:id/messages`| Send a message inside a conversation | Authenticated |
| **GET** | `/unread-count` | Retrieve global unread DM count for badging | Authenticated |

### 🔔 Live Notifications — `/api/notifications`
| Method | Endpoint | Purpose | Access Control |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Fetch all user-related notifications | Authenticated |
| **PATCH** | `/read-all` | Mark all notifications as read | Authenticated |
| **PATCH** | `/:id/read` | Mark one specific notification as read | Authenticated |

### 🤖 AI Utilities — `/api/ai`
| Method | Endpoint | Purpose | Access Control |
| :--- | :--- | :--- | :--- |
| **POST** | `/rewrite-tone` | Rephrase text in a specific tone using Groq | Authenticated |
| **POST** | `/search-summary` | Summarize explore search query consensus | Authenticated |

### 🛡️ Administration Operations — `/api/admin`
| Method | Endpoint | Purpose | Access Control |
| :--- | :--- | :--- | :--- |
| **GET** | `/placements` | List all placement opportunities | Authenticated |
| **POST** | `/placements` | Add a placement opportunity | **Admin Role Only** |
| **PATCH** | `/placements/:id`| Modify a placement details | **Admin Role Only** |
| **DELETE**| `/placements/:id`| Remove a placement opportunity | **Admin Role Only** |
| **GET** | `/announcements` | Fetch all campus announcements | Authenticated |
| **POST** | `/announcements` | Publish a campus announcement | **Admin Role Only** |
| **DELETE**| `/announcements/:id`| Delete an announcement | **Admin Role Only** |
| **GET** | `/materials` | Fetch study documents and notes | Authenticated |
| **POST** | `/materials` | Upload PDF/DOCX (Cloudinary stream) | **Admin Role Only** |
| **DELETE**| `/materials/:id` | Remove uploaded material | **Admin Role Only** |

---

## 🎨 Design System & CSS Variables

CampusConnect utilizes a custom-tailored dark/light mode system configured via HSL standard mappings in `frontend/src/index.css`. This ensures smooth animations and transition timing functions for a premium aesthetic:

```css
:root {
  --brand-500: #6366f1;       /* Indigo core */
  --brand-600: #4f46e5;       /* Hover indigo */
  --pink-500:  #ec4899;       /* Pink secondary */
  --surface:   #ffffff;       /* Cards light mode */
  --surface-2: #f8f9ff;       /* Scaffold light mode */
  --border:    #e8eaf6;       /* Standard light outline */
  --text-primary:   #0f1117;  /* High-contrast text */
  --text-secondary: #4b5563;  /* Low-contrast text */
  --text-muted:     #9ca3af;  /* Icon/placeholders */
  --sidebar-w: 240px;         /* Uniform layout metrics */
}

.dark {
  --surface:   #0d0e1b;       /* Dark base deep blue */
  --surface-2: #05060f;       /* Dark background */
  --border:    #1b1c30;       /* Fine border color */
  --text-primary:   #f3f4f6;  /* High-contrast light text */
  --text-secondary: #9ca3af;  /* Muted light text */
  --text-muted:     #4b5563;  /* Extreme muted details */
}
```

---

## 👨‍💻 Key Development Operations

### Backend Build Commands
```bash
npm run dev      # Launches typescript compiler on hot reload (nodemon)
npm run build    # Produces optimized production-ready Javascript in dist/
npm start        # Launches production compiled file
```

### Frontend Build Commands
```bash
npm run dev      # Launches Vite hot module replacement dev-server (http://localhost:5173)
npm run build    # Creates optimized single page bundle under dist/
npm run preview  # Serve the static production build files locally
```

---

## 🔮 Done & Future Roadmap

- [x] **Direct messaging system**: Clean, secure text chat with global unread status.
- [x] **Post bookmarks**: Keep references to post collections.
- [x] **Double-theme system**: Dark/Light mode selector state.
- [x] **Role-Based Access Control**: Safe admin-guarded uploads, materials, and placement tools.
- [x] **Universal Sidebar Alignment**: Clean UI rendering regardless of user role.
- [ ] **Real-time Engine**: Implement low-latency WebSockets (Socket.io) instead of message polling.
- [ ] **Vector Database Semantic Search**: Add vector database search capabilities to find related posts.