import { Router, Response } from "express";
import multer from "multer";
import pool from "../db";
import cloudinary from "../lib/cloudinary";
import { authenticate, AuthRequest } from "../middleware/auth";

const router  = Router();
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ["image/jpeg","image/png","image/gif","image/webp","video/mp4","video/quicktime","video/webm"];
    cb(null, allowed.includes(file.mimetype));
  },
});

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

// Helper: extract @mentions from content
function extractMentions(content: string): string[] {
  const matches = content.match(/@([a-zA-Z0-9_]{3,20})/g) || [];
  return [...new Set(matches.map(m => m.slice(1)))];
}

// Helper: shape a post row
function shapePost(r: any): any {
  return {
    id: r.id,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    mediaUrl: r.media_url,
    mediaType: r.media_type,
    repostOfId: r.repost_of_id,
    repostOf: r.repost_of_content !== undefined ? {
      id: r.repost_of_id,
      content: r.repost_of_content,
      mediaUrl: r.repost_of_media_url,
      mediaType: r.repost_of_media_type,
      createdAt: r.repost_of_created_at,
      author: r.repost_of_author_id ? {
        id: r.repost_of_author_id,
        username: r.repost_of_author_username,
        displayName: r.repost_of_author_display,
        avatarUrl: r.repost_of_author_avatar,
      } : null,
    } : undefined,
    likedByMe: r.liked_by_me,
    repostedByMe: r.reposted_by_me,
    bookmarkedByMe: r.bookmarked_by_me,
    myReaction: r.my_reaction || null,
    author: { id: r.user_id, username: r.username, displayName: r.display_name, avatarUrl: r.avatar_url },
    _count: {
      comments: parseInt(r.comment_count),
      likes: parseInt(r.like_count),
      reposts: parseInt(r.repost_count ?? "0"),
      reactions: parseInt(r.reaction_count ?? "0"),
    },
    reactions: r.reaction_summary ? r.reaction_summary : [],
  };
}

const POST_QUERY = (whereClause: string, extra = "") => `
  SELECT p.id, p.content, p.created_at, p.updated_at, p.media_url, p.media_type, p.repost_of_id,
    u.id as user_id, u.username, u.display_name, u.avatar_url,
    COUNT(DISTINCT c.id) as comment_count,
    COUNT(DISTINCT l.id) as like_count,
    COUNT(DISTINCT rp.id) as repost_count,
    COUNT(DISTINCT rx.id) as reaction_count,
    BOOL_OR(l.user_id = $1) as liked_by_me,
    BOOL_OR(rp.user_id = $1) as reposted_by_me,
    BOOL_OR(bk.user_id = $1) as bookmarked_by_me,
    MAX(CASE WHEN rx2.user_id = $1 THEN rx2.emoji ELSE NULL END) as my_reaction,
    -- repost parent
    orig.content as repost_of_content,
    orig.media_url as repost_of_media_url,
    orig.media_type as repost_of_media_type,
    orig.created_at as repost_of_created_at,
    ou.id as repost_of_author_id,
    ou.username as repost_of_author_username,
    ou.display_name as repost_of_author_display,
    ou.avatar_url as repost_of_author_avatar,
    (
      SELECT json_agg(t) FROM (
        SELECT emoji, COUNT(*) as count
        FROM reactions WHERE post_id = p.id
        GROUP BY emoji ORDER BY count DESC
      ) t
    ) as reaction_summary
  FROM posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN comments c ON c.post_id = p.id
  LEFT JOIN likes l ON l.post_id = p.id
  LEFT JOIN reposts rp ON rp.post_id = p.id
  LEFT JOIN bookmarks bk ON bk.post_id = p.id AND bk.user_id = $1
  LEFT JOIN reactions rx ON rx.post_id = p.id
  LEFT JOIN reactions rx2 ON rx2.post_id = p.id AND rx2.user_id = $1
  LEFT JOIN posts orig ON orig.id = p.repost_of_id
  LEFT JOIN users ou ON ou.id = orig.user_id
  ${whereClause}
  GROUP BY p.id, u.id, orig.id, orig.content, orig.media_url, orig.media_type, orig.created_at,
           ou.id, ou.username, ou.display_name, ou.avatar_url
  ${extra}
`;

// GET all posts
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      POST_QUERY("", "ORDER BY p.created_at DESC LIMIT 100"),
      [req.userId]
    );
    res.json(result.rows.map(shapePost));
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET bookmarks feed
router.get("/bookmarks", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      POST_QUERY(
        "JOIN bookmarks bk2 ON bk2.post_id = p.id AND bk2.user_id = $1",
        "ORDER BY p.created_at DESC"
      ),
      [req.userId]
    );
    res.json(result.rows.map(shapePost));
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST create with optional media + mention extraction
router.post("/", authenticate, upload.single("media"), async (req: AuthRequest, res: Response) => {
  const { content, repostOfId } = req.body;
  if (!content?.trim() && !req.file && !repostOfId) {
    return res.status(400).json({ message: "Post needs content, media, or a repost" });
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
      `INSERT INTO posts (user_id, content, media_url, media_type, repost_of_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, content, created_at, updated_at, media_url, media_type, repost_of_id`,
      [req.userId, content?.trim() || null, mediaUrl, mediaType, repostOfId || null]
    );
    const p = result.rows[0];

    // Handle mentions
    if (content) {
      const usernames = extractMentions(content);
      for (const uname of usernames) {
        const u = await pool.query("SELECT id FROM users WHERE username=$1", [uname]);
        if (u.rows.length > 0 && u.rows[0].id !== req.userId) {
          await pool.query(
            "INSERT INTO mentions (post_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
            [p.id, u.rows[0].id]
          );
          await pool.query(
            "INSERT INTO notifications (user_id,actor_id,type,post_id) VALUES ($1,$2,'MENTION',$3)",
            [u.rows[0].id, req.userId, p.id]
          );
        }
      }
    }

    // Fetch shaped post
    const full = await pool.query(POST_QUERY("WHERE p.id = $2", ""), [req.userId, p.id]);
    res.status(201).json(shapePost(full.rows[0]));
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// PATCH edit post
router.patch("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: "Content required" });
  try {
    const check = await pool.query("SELECT user_id FROM posts WHERE id=$1", [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ message: "Post not found" });
    if (check.rows[0].user_id !== req.userId) return res.status(403).json({ message: "Not your post" });

    await pool.query(
      "UPDATE posts SET content=$1, updated_at=NOW() WHERE id=$2",
      [content.trim(), req.params.id]
    );
    const full = await pool.query(POST_QUERY("WHERE p.id = $2", ""), [req.userId, req.params.id]);
    res.json(shapePost(full.rows[0]));
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// DELETE post
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const check = await pool.query("SELECT user_id FROM posts WHERE id=$1", [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ message: "Post not found" });
    if (check.rows[0].user_id !== req.userId) return res.status(403).json({ message: "Not your post" });
    await pool.query("DELETE FROM posts WHERE id=$1", [req.params.id]);
    res.json({ deleted: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST like (toggle)
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

// POST react (emoji reaction, replaces previous)
router.post("/:id/react", authenticate, async (req: AuthRequest, res: Response) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ message: "emoji required" });
  try {
    const existing = await pool.query(
      "SELECT id, emoji FROM reactions WHERE post_id=$1 AND user_id=$2",
      [req.params.id, req.userId]
    );
    if (existing.rows.length > 0) {
      if (existing.rows[0].emoji === emoji) {
        // Remove if same
        await pool.query("DELETE FROM reactions WHERE post_id=$1 AND user_id=$2", [req.params.id, req.userId]);
        return res.json({ reaction: null });
      }
      await pool.query(
        "UPDATE reactions SET emoji=$1 WHERE post_id=$2 AND user_id=$3",
        [emoji, req.params.id, req.userId]
      );
      return res.json({ reaction: emoji });
    }
    await pool.query(
      "INSERT INTO reactions (post_id, user_id, emoji) VALUES ($1,$2,$3)",
      [req.params.id, req.userId, emoji]
    );
    res.json({ reaction: emoji });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST repost (toggle)
router.post("/:id/repost", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await pool.query(
      "SELECT id FROM reposts WHERE post_id=$1 AND user_id=$2",
      [req.params.id, req.userId]
    );
    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM reposts WHERE post_id=$1 AND user_id=$2", [req.params.id, req.userId]);
      // Also delete the repost entry from posts table
      await pool.query("DELETE FROM posts WHERE repost_of_id=$1 AND user_id=$2", [req.params.id, req.userId]);
      return res.json({ reposted: false });
    }
    await pool.query("INSERT INTO reposts (post_id, user_id) VALUES ($1,$2)", [req.params.id, req.userId]);
    // Create a post entry for the repost
    await pool.query(
      "INSERT INTO posts (user_id, repost_of_id) VALUES ($1,$2)",
      [req.userId, req.params.id]
    );
    res.json({ reposted: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST bookmark (toggle)
router.post("/:id/bookmark", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await pool.query(
      "SELECT id FROM bookmarks WHERE post_id=$1 AND user_id=$2",
      [req.params.id, req.userId]
    );
    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM bookmarks WHERE post_id=$1 AND user_id=$2", [req.params.id, req.userId]);
      return res.json({ bookmarked: false });
    }
    await pool.query("INSERT INTO bookmarks (post_id, user_id) VALUES ($1,$2)", [req.params.id, req.userId]);
    res.json({ bookmarked: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET comments
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

// POST comment
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
    // Handle mentions in comments
    const usernames = extractMentions(content);
    for (const uname of usernames) {
      const u = await pool.query("SELECT id FROM users WHERE username=$1", [uname]);
      if (u.rows.length > 0 && u.rows[0].id !== req.userId) {
        await pool.query(
          "INSERT INTO notifications (user_id,actor_id,type,post_id) VALUES ($1,$2,'MENTION',$3)",
          [u.rows[0].id, req.userId, req.params.id]
        );
      }
    }
    const u = await pool.query("SELECT id,username,display_name FROM users WHERE id=$1", [req.userId]);
    res.status(201).json({
      id: result.rows[0].id, content: result.rows[0].content,
      createdAt: result.rows[0].created_at, postId: req.params.id,
      author: { id: u.rows[0].id, username: u.rows[0].username, displayName: u.rows[0].display_name },
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET single post
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(POST_QUERY("WHERE p.id = $2", ""), [req.userId, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Post not found" });
    res.json(shapePost(result.rows[0]));
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;