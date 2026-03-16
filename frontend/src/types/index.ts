export interface User {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  _count?: { posts: number; followers: number; following: number; };
}

export interface Post {
  id: string;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  author: User;
  createdAt: string;
  _count?: { comments: number; likes: number; };
  likedByMe?: boolean;
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
  type: "LIKE" | "COMMENT" | "FOLLOW";
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