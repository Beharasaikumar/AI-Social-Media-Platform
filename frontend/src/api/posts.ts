import client from "./client";
import type { Post, Comment } from "../types";

export const getPosts = async (): Promise<Post[]> => {
  const res = await client.get("/posts");
  return res.data;
};

export const createPost = async (content: string, mediaFile?: File): Promise<Post> => {
  const form = new FormData();
  form.append("content", content);
  if (mediaFile) form.append("media", mediaFile);
  const res = await client.post("/posts", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const likePost = async (postId: string): Promise<{ liked: boolean }> => {
  const res = await client.post(`/posts/${postId}/like`);
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