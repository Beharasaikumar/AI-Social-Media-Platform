
import client from "./client";

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

export const getConversations = async (): Promise<DMConversation[]> => {
  const res = await client.get("/dm/conversations");
  return res.data;
};

export const startConversation = async (
  username: string
): Promise<{ id: string; other: { id: string; username: string; displayName: string } }> => {
  const res = await client.post("/dm/conversations", { username });
  return res.data;
};

export const getMessages = async (conversationId: string): Promise<DMMessage[]> => {
  const res = await client.get(`/dm/conversations/${conversationId}/messages`);
  return res.data;
};

export const sendMessage = async (
  conversationId: string,
  content: string
): Promise<DMMessage> => {
  const res = await client.post(`/dm/conversations/${conversationId}/messages`, { content });
  return res.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const res = await client.get("/dm/unread-count");
  return res.data.count;
};