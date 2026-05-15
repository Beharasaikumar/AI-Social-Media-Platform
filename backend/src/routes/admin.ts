import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import pool from "../db";
import cloudinary from "../lib/cloudinary";
import multer from "multer";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const ADMIN_EMAIL = "admin@gmail.com";

function isAdmin(email: string): boolean {
  return email === ADMIN_EMAIL;
}

// ── Placements ────────────────────────────────────────────────────────────

router.get("/placements", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM placements ORDER BY created_at DESC",
      []
    );
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.post("/placements", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await pool.query("SELECT email FROM users WHERE id = $1", [req.userId]);
  if (!isAdmin(user.rows[0]?.email)) return res.status(403).json({ message: "Unauthorized" });

  const { type, company, title, description, salary, deadline, link } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO placements (type, company, title, description, salary, deadline, link, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [type, company, title, description, salary, deadline || null, link || null, req.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.patch("/placements/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await pool.query("SELECT email FROM users WHERE id = $1", [req.userId]);
  if (!isAdmin(user.rows[0]?.email)) return res.status(403).json({ message: "Unauthorized" });

  const { type, company, title, description, salary, deadline, link } = req.body;
  try {
    const result = await pool.query(
      `UPDATE placements SET type = $1, company = $2, title = $3, description = $4, salary = $5, deadline = $6, link = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [type, company, title, description, salary, deadline || null, link || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.delete("/placements/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await pool.query("SELECT email FROM users WHERE id = $1", [req.userId]);
  if (!isAdmin(user.rows[0]?.email)) return res.status(403).json({ message: "Unauthorized" });

  try {
    await pool.query("DELETE FROM placements WHERE id = $1", [req.params.id]);
    res.json({ deleted: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Announcements ─────────────────────────────────────────────────────────

router.get("/announcements", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.display_name FROM announcements a
       LEFT JOIN users u ON u.id = a.posted_by
       ORDER BY a.created_at DESC`,
      []
    );
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.post("/announcements", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await pool.query("SELECT email FROM users WHERE id = $1", [req.userId]);
  if (!isAdmin(user.rows[0]?.email)) return res.status(403).json({ message: "Unauthorized" });

  const { title, content } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO announcements (title, content, posted_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, content, req.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.delete("/announcements/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await pool.query("SELECT email FROM users WHERE id = $1", [req.userId]);
  if (!isAdmin(user.rows[0]?.email)) return res.status(403).json({ message: "Unauthorized" });

  try {
    await pool.query("DELETE FROM announcements WHERE id = $1", [req.params.id]);
    res.json({ deleted: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Materials ─────────────────────────────────────────────────────────────

router.get("/materials", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT m.*, u.display_name FROM materials m
       LEFT JOIN users u ON u.id = m.uploaded_by
       ORDER BY m.created_at DESC`,
      []
    );
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.post("/materials", authenticate, upload.single("file"), async (req: AuthRequest, res: Response) => {
  const user = await pool.query("SELECT email FROM users WHERE id = $1", [req.userId]);
  if (!isAdmin(user.rows[0]?.email)) return res.status(403).json({ message: "Unauthorized" });

  if (!req.file) return res.status(400).json({ message: "File required" });

  const { title, description } = req.body;
  const fileType = req.file.mimetype.includes("pdf") ? "pdf" : "docx";

  try {
    const uploaded = await new Promise<{ url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "raw", folder: "campusconnect/materials" },
        (err, result) => {
          if (err || !result) return reject(err);
          resolve({ url: result.secure_url });
        }
      );
      stream.end(req.file!.buffer);
    });

    const result = await pool.query(
      `INSERT INTO materials (title, description, file_url, file_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description || null, uploaded.url, fileType, req.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.delete("/materials/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await pool.query("SELECT email FROM users WHERE id = $1", [req.userId]);
  if (!isAdmin(user.rows[0]?.email)) return res.status(403).json({ message: "Unauthorized" });

  try {
    await pool.query("DELETE FROM materials WHERE id = $1", [req.params.id]);
    res.json({ deleted: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;