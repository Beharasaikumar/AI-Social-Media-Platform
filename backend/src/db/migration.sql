-- ═══════════════════════════════════════════════════════════════════════════
-- CampusConnect — Unified Schema
-- Run once against a fresh database (or use IF NOT EXISTS / IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(50) UNIQUE NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE,          -- nullable until verified
  bio           TEXT,
  avatar_url    TEXT,
  password_hash TEXT        NOT NULL,
  is_verified   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- OTP verifications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_verifications (
  id         UUID       PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp        VARCHAR(4) NOT NULL,
  purpose    VARCHAR(10) NOT NULL CHECK (purpose IN ('register', 'login', 'forgot')),
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN    NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_user    ON otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Password reset tokens
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_user  ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);

-- ─────────────────────────────────────────────────────────────────────────────
-- Posts
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- Comments
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID        REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Likes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID        REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Follows
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id  UUID        REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID        REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  actor_id   UUID        REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(20) NOT NULL,
  post_id    UUID        REFERENCES posts(id) ON DELETE CASCADE,
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Direct messages
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_pair CHECK (user1_id < user2_id),
  UNIQUE (user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT        NOT NULL CHECK (char_length(content) > 0),
  read            BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_user1    ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conv_user2    ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_msg_conv      ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_msg_conv_time ON messages(conversation_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Reactions, reposts, bookmarks, mentions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reactions (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji      VARCHAR(10) NOT NULL DEFAULT '❤️',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS reposts (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS mentions (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reactions_post  ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_post    ON reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user  ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_user   ON mentions(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Admin — Placements, Announcements, Materials
-- ─────────────────────────────────────────────────────────────────────────────
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

CREATE TABLE IF NOT EXISTS announcements (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      VARCHAR(255) NOT NULL,
  content    TEXT        NOT NULL,
  posted_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  file_url    TEXT        NOT NULL,
  file_type   VARCHAR(10) NOT NULL,
  uploaded_by UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);