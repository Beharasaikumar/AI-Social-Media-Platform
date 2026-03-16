import { Router, Response } from "express";
import pool from "../db";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT n.id, n.type, n.read, n.created_at, n.post_id,
        u.id as actor_id, u.username, u.display_name
       FROM notifications n
       JOIN users u ON u.id = n.actor_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 30`,
      [req.userId]
    );
    res.json(result.rows.map((r) => ({
      id: r.id, type: r.type, read: r.read, createdAt: r.created_at,
      postId: r.post_id,
      actor: { id: r.actor_id, username: r.username, displayName: r.display_name },
    })));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/read-all", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query("UPDATE notifications SET read = TRUE WHERE user_id = $1", [req.userId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id/read", authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    await pool.query(
      "UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;