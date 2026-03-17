import client from "./client";
import type { Notification } from "../types";

// let cache: Notification[] | null = null;
// let cacheTime = 0;
// const CACHE_TTL = 10000; // 10 seconds

export const getNotifications = async (): Promise<Notification[]> => {
  const res = await client.get("/notifications");
  return res.data;
};

export const markAllRead = async (): Promise<void> => {
  await client.patch("/notifications/read-all");
};

export const markOneRead = async (id: string): Promise<void> => {
  await client.patch(`/notifications/${id}/read`);
};