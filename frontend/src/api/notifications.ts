import client from "./client";
import type { Notification } from "../types";

let cache: Notification[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 10000; // 10 seconds

export const getNotifications = async (): Promise<Notification[]> => {
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return cache;
  }
  const res = await client.get("/notifications");
  cache = res.data;
  cacheTime = Date.now();
  return res.data;
};

export const markAllRead = async (): Promise<void> => {
  await client.patch("/notifications/read-all");
  if (cache) {
    cache = cache.map(n => ({ ...n, read: true }));
  }
};

export const markOneRead = async (id: string): Promise<void> => {
  await client.patch(`/notifications/${id}/read`);
  if (cache) {
    cache = cache.map(n => n.id === id ? { ...n, read: true } : n);
  }
};