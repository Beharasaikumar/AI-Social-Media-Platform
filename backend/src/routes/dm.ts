import { Router, Response } from "express";
import pool from "../db";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

 async function getOrCreateConversation(userA: string, userB: string) {
  const [lo, hi] = [userA, userB].sort();
  const existing = await pool.query(
    "SELECT id FROM conversations WHERE user1_id=$1 AND user2_id=$2",
    [lo, hi]
  );
  if (existing.rows.length > 0) return existing.rows[0];
  const created = await pool.query(
    "INSERT INTO conversations (user1_id, user2_id) VALUES ($1,$2) RETURNING id",
    [lo, hi]
  );
  return created.rows[0];
}

function shapeConversation(row: any, myId: string) {
  const other = row.user1_id === myId
    ? { id: row.user2_id, username: row.user2_username, displayName: row.user2_display }
    : { id: row.user1_id, username: row.user1_username, displayName: row.user1_display };
  return {
    id:          row.id,
    createdAt:   row.created_at,
    other,
    lastMessage: row.last_content
      ? { content: row.last_content, createdAt: row.last_at, senderId: row.last_sender }
      : null,
    unreadCount: parseInt(row.unread_count ?? "0"),
  };
}

// ── GET /api/dm/conversations — inbox ────────────────────────────────────────
router.get("/conversations", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
         c.id, c.created_at, c.user1_id, c.user2_id,
         u1.username AS user1_username, u1.display_name AS user1_display,
         u2.username AS user2_username, u2.display_name AS user2_display,
         lm.content   AS last_content,
         lm.created_at AS last_at,
         lm.sender_id  AS last_sender,
         (SELECT COUNT(*) FROM messages m2
           WHERE m2.conversation_id = c.id
             AND m2.sender_id != $1
             AND m2.read = FALSE) AS unread_count
       FROM conversations c
       JOIN users u1 ON u1.id = c.user1_id
       JOIN users u2 ON u2.id = c.user2_id
       LEFT JOIN LATERAL (
         SELECT content, created_at, sender_id
         FROM messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC
         LIMIT 1
       ) lm ON TRUE
       WHERE c.user1_id = $1 OR c.user2_id = $1
       ORDER BY COALESCE(lm.created_at, c.created_at) DESC`,
      [req.userId]
    );
    res.json(result.rows.map(r => shapeConversation(r, req.userId!)));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/dm/conversations — start or resume a DM ───────────────────────
// body: { username: string }
router.post("/conversations", authenticate, async (req: AuthRequest, res: Response) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: "username required" });
  try {
    const target = await pool.query(
      "SELECT id, username, display_name FROM users WHERE username=$1",
      [username]
    );
    if (target.rows.length === 0) return res.status(404).json({ message: "User not found" });
    const other = target.rows[0];
    if (other.id === req.userId) return res.status(400).json({ message: "Cannot DM yourself" });

    const conv = await getOrCreateConversation(req.userId!, other.id);
    res.json({
      id: conv.id,
      other: { id: other.id, username: other.username, displayName: other.display_name },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/dm/conversations/:id/messages ───────────────────────────────────
router.get("/conversations/:id/messages", authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const conv = await pool.query(
      "SELECT * FROM conversations WHERE id=$1 AND (user1_id=$2 OR user2_id=$2)",
      [id, req.userId]
    );
    if (conv.rows.length === 0) return res.status(403).json({ message: "Not authorised" });

    // Mark messages from the other person as read
    await pool.query(
      "UPDATE messages SET read=TRUE WHERE conversation_id=$1 AND sender_id!=$2 AND read=FALSE",
      [id, req.userId]
    );

    const msgs = await pool.query(
      `SELECT m.id, m.content, m.read, m.created_at, m.sender_id,
              u.username, u.display_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC
       LIMIT 200`,
      [id]
    );

    res.json(msgs.rows.map(r => ({
      id:        r.id,
      content:   r.content,
      read:      r.read,
      createdAt: r.created_at,
      sender: { id: r.sender_id, username: r.username, displayName: r.display_name },
    })));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/dm/conversations/:id/messages — send a message ────────────────
router.post("/conversations/:id/messages", authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: "Content required" });
  try {
    const conv = await pool.query(
      "SELECT * FROM conversations WHERE id=$1 AND (user1_id=$2 OR user2_id=$2)",
      [id, req.userId]
    );
    if (conv.rows.length === 0) return res.status(403).json({ message: "Not authorised" });

    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, read, created_at`,
      [id, req.userId, content.trim()]
    );

    const u = await pool.query(
      "SELECT id, username, display_name FROM users WHERE id=$1",
      [req.userId]
    );

    const m = result.rows[0];
    const usr = u.rows[0];
    res.status(201).json({
      id:        m.id,
      content:   m.content,
      read:      m.read,
      createdAt: m.created_at,
      sender:    { id: usr.id, username: usr.username, displayName: usr.display_name },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/dm/unread-count — badge count ───────────────────────────────────
router.get("/unread-count", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS total
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE (c.user1_id=$1 OR c.user2_id=$1)
         AND m.sender_id != $1
         AND m.read = FALSE`,
      [req.userId]
    );
    res.json({ count: parseInt(result.rows[0].total) });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;