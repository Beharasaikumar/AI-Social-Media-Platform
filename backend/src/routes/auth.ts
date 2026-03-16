import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const { username, displayName, password } = req.body;
  if (!username || !displayName || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const exists = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "Username already taken" });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, display_name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, display_name, bio, avatar_url, created_at`,
      [username, displayName, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ message: "Invalid username or password" });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url, u.created_at,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT f1.id) as follower_count,
        COUNT(DISTINCT f2.id) as following_count
       FROM users u
       LEFT JOIN posts p ON p.user_id = u.id
       LEFT JOIN follows f1 ON f1.following_id = u.id
       LEFT JOIN follows f2 ON f2.follower_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.userId]
    );
    const u = result.rows[0];
    res.json({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      bio: u.bio,
      avatarUrl: u.avatar_url,
      createdAt: u.created_at,
      _count: {
        posts: parseInt(u.post_count),
        followers: parseInt(u.follower_count),
        following: parseInt(u.following_count),
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/profile", authenticate, async (req: AuthRequest, res: Response) => {
  const { displayName, bio } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET display_name = $1, bio = $2 WHERE id = $3
       RETURNING id, username, display_name, bio, avatar_url, created_at`,
      [displayName, bio, req.userId]
    );
    const u = result.rows[0];
    res.json({
      id: u.id, username: u.username, displayName: u.display_name,
      bio: u.bio, avatarUrl: u.avatar_url, createdAt: u.created_at,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get any user's public profile
router.get("/user/:username", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url, u.created_at,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT f1.id) as follower_count,
        COUNT(DISTINCT f2.id) as following_count,
        BOOL_OR(f3.follower_id = $2) as is_following
       FROM users u
       LEFT JOIN posts p ON p.user_id = u.id
       LEFT JOIN follows f1 ON f1.following_id = u.id
       LEFT JOIN follows f2 ON f2.follower_id = u.id
       LEFT JOIN follows f3 ON f3.follower_id = $2 AND f3.following_id = u.id
       WHERE u.username = $1
       GROUP BY u.id`,
      [req.params.username, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });
    const u = result.rows[0];
    res.json({
      id: u.id, username: u.username, displayName: u.display_name,
      bio: u.bio, avatarUrl: u.avatar_url, createdAt: u.created_at,
      isFollowing: u.is_following,
      _count: {
        posts: parseInt(u.post_count),
        followers: parseInt(u.follower_count),
        following: parseInt(u.following_count),
      },
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// Follow / Unfollow
router.post("/user/:username/follow", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const target = await pool.query("SELECT id FROM users WHERE username = $1", [req.params.username]);
    if (target.rows.length === 0) return res.status(404).json({ message: "User not found" });
    const targetId = target.rows[0].id;
    if (targetId === req.userId) return res.status(400).json({ message: "Cannot follow yourself" });

    const existing = await pool.query(
      "SELECT id FROM follows WHERE follower_id=$1 AND following_id=$2",
      [req.userId, targetId]
    );
    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM follows WHERE follower_id=$1 AND following_id=$2", [req.userId, targetId]);
      return res.json({ following: false });
    }
    await pool.query("INSERT INTO follows (follower_id, following_id) VALUES ($1,$2)", [req.userId, targetId]);
    await pool.query(
      "INSERT INTO notifications (user_id, actor_id, type) VALUES ($1,$2,'FOLLOW')",
      [targetId, req.userId]
    );
    res.json({ following: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

router.get("/user/:username/posts", authenticate, async (req: AuthRequest, res: Response) => {
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
       WHERE u.username = $2
       GROUP BY p.id, u.id
       ORDER BY p.created_at DESC`,
      [req.userId, req.params.username]
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

export default router;