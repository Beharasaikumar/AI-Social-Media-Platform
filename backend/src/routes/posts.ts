import { Router, Response } from "express";
import multer from "multer";
import pool from "../db";
import cloudinary from "../lib/cloudinary";
import { authenticate, AuthRequest } from "../middleware/auth";

const router  = Router();
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_, file, cb) => {
    const allowed = ["image/jpeg","image/png","image/gif","image/webp","video/mp4","video/quicktime","video/webm"];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Upload helper
async function uploadToCloudinary(buffer: Buffer, mimetype: string): Promise<{ url: string; type: string }> {
  const isVideo    = mimetype.startsWith("video/");
  const resourceType: "image" | "video" = isVideo ? "video" : "image";
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: "campusconnect" },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve({ url: result.secure_url, type: isVideo ? "video" : "image" });
      }
    );
    stream.end(buffer);
  });
}

// GET all posts
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.content, p.created_at, p.media_url, p.media_type,
        u.id as user_id, u.username, u.display_name, u.avatar_url,
        COUNT(DISTINCT c.id) as comment_count,
        COUNT(DISTINCT l.id) as like_count,
        BOOL_OR(l.user_id = $1) as liked_by_me
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN comments c ON c.post_id = p.id
       LEFT JOIN likes l ON l.post_id = p.id
       GROUP BY p.id, u.id
       ORDER BY p.created_at DESC
       LIMIT 50`,
      [req.userId]
    );
    res.json(result.rows.map(r => ({
      id: r.id, content: r.content, createdAt: r.created_at,
      mediaUrl: r.media_url, mediaType: r.media_type,
      likedByMe: r.liked_by_me,
      author: { id: r.user_id, username: r.username, displayName: r.display_name, avatarUrl: r.avatar_url },
      _count: { comments: parseInt(r.comment_count), likes: parseInt(r.like_count) },
    })));
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST create with optional media
router.post("/", authenticate, upload.single("media"), async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content?.trim() && !req.file) {
    return res.status(400).json({ message: "Post needs content or media" });
  }
  try {
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      mediaUrl  = uploaded.url;
      mediaType = uploaded.type;
    }
    const result = await pool.query(
      `INSERT INTO posts (user_id, content, media_url, media_type)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, created_at, media_url, media_type`,
      [req.userId, content?.trim() || "", mediaUrl, mediaType]
    );
    const u = await pool.query(
      "SELECT id, username, display_name, avatar_url FROM users WHERE id = $1",
      [req.userId]
    );
    const p = result.rows[0];
    const usr = u.rows[0];
    res.status(201).json({
      id: p.id, content: p.content, createdAt: p.created_at,
      mediaUrl: p.media_url, mediaType: p.media_type,
      likedByMe: false,
      author: { id: usr.id, username: usr.username, displayName: usr.display_name, avatarUrl: usr.avatar_url },
      _count: { comments: 0, likes: 0 },
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.post("/:id/like", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await pool.query(
      "SELECT id FROM likes WHERE post_id=$1 AND user_id=$2",
      [req.params.id, req.userId]
    );
    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM likes WHERE post_id=$1 AND user_id=$2", [req.params.id, req.userId]);
      return res.json({ liked: false });
    }
    await pool.query("INSERT INTO likes (post_id, user_id) VALUES ($1,$2)", [req.params.id, req.userId]);
    const post = await pool.query("SELECT user_id FROM posts WHERE id=$1", [req.params.id]);
    if (post.rows[0]?.user_id !== req.userId) {
      await pool.query(
        "INSERT INTO notifications (user_id,actor_id,type,post_id) VALUES ($1,$2,'LIKE',$3)",
        [post.rows[0].user_id, req.userId, req.params.id]
      );
    }
    res.json({ liked: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.get("/:id/comments", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.content, c.created_at,
        u.id as user_id, u.username, u.display_name
       FROM comments c JOIN users u ON u.id=c.user_id
       WHERE c.post_id=$1 ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows.map(r => ({
      id: r.id, content: r.content, createdAt: r.created_at, postId: req.params.id,
      author: { id: r.user_id, username: r.username, displayName: r.display_name },
    })));
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.post("/:id/comments", authenticate, async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: "Content required" });
  try {
    const result = await pool.query(
      "INSERT INTO comments (post_id,user_id,content) VALUES ($1,$2,$3) RETURNING id,content,created_at",
      [req.params.id, req.userId, content.trim()]
    );
    const post = await pool.query("SELECT user_id FROM posts WHERE id=$1", [req.params.id]);
    if (post.rows[0]?.user_id !== req.userId) {
      await pool.query(
        "INSERT INTO notifications (user_id,actor_id,type,post_id) VALUES ($1,$2,'COMMENT',$3)",
        [post.rows[0].user_id, req.userId, req.params.id]
      );
    }
    const u = await pool.query("SELECT id,username,display_name FROM users WHERE id=$1", [req.userId]);
    res.status(201).json({
      id: result.rows[0].id, content: result.rows[0].content,
      createdAt: result.rows[0].created_at, postId: req.params.id,
      author: { id: u.rows[0].id, username: u.rows[0].username, displayName: u.rows[0].display_name },
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.content, p.created_at, p.media_url, p.media_type,
        u.id as user_id, u.username, u.display_name, u.avatar_url,
        COUNT(DISTINCT c.id) as comment_count,
        COUNT(DISTINCT l.id) as like_count,
        BOOL_OR(l.user_id = $1) as liked_by_me
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN comments c ON c.post_id = p.id
       LEFT JOIN likes l ON l.post_id = p.id
       WHERE p.id = $2
       GROUP BY p.id, u.id`,
      [req.userId, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Post not found" });
    const r = result.rows[0];
    res.json({
      id: r.id, content: r.content, createdAt: r.created_at,
      mediaUrl: r.media_url, mediaType: r.media_type,
      likedByMe: r.liked_by_me,
      author: { id: r.user_id, username: r.username, displayName: r.display_name, avatarUrl: r.avatar_url },
      _count: { comments: parseInt(r.comment_count), likes: parseInt(r.like_count) },
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;