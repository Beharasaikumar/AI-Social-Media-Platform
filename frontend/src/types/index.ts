// src/types/index.ts

export interface User {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;       // ← new
  createdAt: string;
  isAdmin?: boolean;
  _count?: {
    posts: number;
    followers: number;
    following: number;
  };
}

export interface Reaction {
  emoji: string;
  count: number;
}

export interface Post {
  id: string;
  content: string | null;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  author: User;
  createdAt: string;
  updatedAt?: string;
  repostOfId?: string;
  repostOf?: Post;
  _count?: { comments: number; likes: number; reposts: number; reactions: number };
  likedByMe?: boolean;
  repostedByMe?: boolean;
  bookmarkedByMe?: boolean;
  myReaction?: string | null;
  reactions?: Reaction[];
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  postId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: "LIKE" | "COMMENT" | "FOLLOW" | "MENTION";
  read: boolean;
  createdAt: string;
  postId?: string;
  actor: User;
  post?: Post;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DMConversation {
  id: string;
  createdAt: string;
  other: { id: string; username: string; displayName: string };
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
}

export interface DMMessage {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: { id: string; username: string; displayName: string };
}