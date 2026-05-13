import client from "./client";
import type { Post, Comment } from "../types";

export const getPosts = async (): Promise<Post[]> => {
  const res = await client.get("/posts");
  return res.data;
};

export const getBookmarkedPosts = async (): Promise<Post[]> => {
  const res = await client.get("/posts/bookmarks");
  return res.data;
};

export const createPost = async (content: string, mediaFile?: File, repostOfId?: string): Promise<Post> => {
  const form = new FormData();
  if (content) form.append("content", content);
  if (mediaFile) form.append("media", mediaFile);
  if (repostOfId) form.append("repostOfId", repostOfId);
  const res = await client.post("/posts", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const editPost = async (postId: string, content: string): Promise<Post> => {
  const res = await client.patch(`/posts/${postId}`, { content });
  return res.data;
};

export const deletePost = async (postId: string): Promise<void> => {
  await client.delete(`/posts/${postId}`);
};

export const likePost = async (postId: string): Promise<{ liked: boolean }> => {
  const res = await client.post(`/posts/${postId}/like`);
  return res.data;
};

export const reactToPost = async (postId: string, emoji: string): Promise<{ reaction: string | null }> => {
  const res = await client.post(`/posts/${postId}/react`, { emoji });
  return res.data;
};

export const repostPost = async (postId: string): Promise<{ reposted: boolean }> => {
  const res = await client.post(`/posts/${postId}/repost`);
  return res.data;
};

export const bookmarkPost = async (postId: string): Promise<{ bookmarked: boolean }> => {
  const res = await client.post(`/posts/${postId}/bookmark`);
  return res.data;
};

export const getComments = async (postId: string): Promise<Comment[]> => {
  const res = await client.get(`/posts/${postId}/comments`);
  return res.data;
};

export const createComment = async (postId: string, content: string): Promise<Comment> => {
  const res = await client.post(`/posts/${postId}/comments`, { content });
  return res.data;
};

export const getPostById = async (postId: string): Promise<Post> => {
  const res = await client.get(`/posts/${postId}`);
  return res.data;
};