import client from "./client";

export interface Placement {
  id: string;
  type: "job" | "internship" | "recruitment";
  company: string;
  title: string;
  description?: string;
  salary?: string;
  deadline?: string;
  link?: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  posted_by: string;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: "pdf" | "docx";
  uploaded_by: string;
  created_at: string;
}

export const getPlacements = async (): Promise<Placement[]> => {
  const res = await client.get("/admin/placements");
  return res.data;
};

export const createPlacement = async (data: Omit<Placement, "id" | "created_at" | "updated_at">): Promise<Placement> => {
  const res = await client.post("/admin/placements", data);
  return res.data;
};

export const updatePlacement = async (id: string, data: Partial<Placement>): Promise<Placement> => {
  const res = await client.patch(`/admin/placements/${id}`, data);
  return res.data;
};

export const deletePlacement = async (id: string): Promise<void> => {
  await client.delete(`/admin/placements/${id}`);
};

export const getAnnouncements = async (): Promise<Announcement[]> => {
  const res = await client.get("/admin/announcements");
  return res.data;
};

export const createAnnouncement = async (title: string, content: string): Promise<Announcement> => {
  const res = await client.post("/admin/announcements", { title, content });
  return res.data;
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await client.delete(`/admin/announcements/${id}`);
};

export const getMaterials = async (): Promise<Material[]> => {
  const res = await client.get("/admin/materials");
  return res.data;
};

export const uploadMaterial = async (title: string, description: string, file: File): Promise<Material> => {
  const form = new FormData();
  form.append("title", title);
  form.append("description", description);
  form.append("file", file);
  const res = await client.post("/admin/materials", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteMaterial = async (id: string): Promise<void> => {
  await client.delete(`/admin/materials/${id}`);
};