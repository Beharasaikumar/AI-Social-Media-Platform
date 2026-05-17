// src/routes/auth.ts
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import multer from "multer";
import pool from "../db";
import cloudinary from "../lib/cloudinary";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// ── Multer (memory) for image uploads ────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ── Email transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateOtp(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

async function storeOtp(
  userId: string,
  purpose: "register" | "login" | "forgot"
): Promise<string> {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query(
    "UPDATE otp_verifications SET used=TRUE WHERE user_id=$1 AND purpose=$2 AND used=FALSE",
    [userId, purpose]
  );
  await pool.query(
    "INSERT INTO otp_verifications (user_id, otp, purpose, expires_at) VALUES ($1,$2,$3,$4)",
    [userId, otp, purpose, expiresAt]
  );
  return otp;
}

async function sendOtpEmail(
  to: string,
  displayName: string,
  otp: string,
  purpose: "register" | "login"
): Promise<void> {
  const action = purpose === "register" ? "verify your new account" : "sign in";
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Your CampusConnect OTP: ${otp}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#6366f1;">CampusConnect</h2>
        <p>Hi ${displayName},</p>
        <p>Use the code below to ${action}. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1e293b;
          background:#f1f5f9;border-radius:12px;padding:20px 32px;display:inline-block;margin:16px 0;">
          ${otp}
        </div>
        <p style="color:#64748b;font-size:13px;">If you didn't request this, ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
        <p style="font-size:11px;color:#94a3b8;">CampusConnect · Your college social space</p>
      </div>`,
  });
}

function shapeUser(u: any) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    email: u.email,
    bio: u.bio,
    avatarUrl: u.avatar_url,
    coverUrl: u.cover_url,
    createdAt: u.created_at,
  };
}

function issueToken(userId: string, isAdmin = false): string {
  return jwt.sign({ userId, isAdmin }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

async function upsertAdminUser(): Promise<string> {
  const adminEmail = process.env.ADMIN_EMAIL!;
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);
  const result = await pool.query<{ id: string }>(
    `INSERT INTO users (username, display_name, email, password_hash, is_verified)
     VALUES ('admin','Admin',$1,$2,TRUE)
     ON CONFLICT (email) DO UPDATE SET is_verified=TRUE
     RETURNING id`,
    [adminEmail, hash]
  );
  return result.rows[0].id;
}

// Upload buffer → Cloudinary, returns secure URL
// Using a deterministic public_id means re-uploading overwrites the old image
async function uploadImageToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", folder, public_id: publicId, overwrite: true },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// ── POST /register ────────────────────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  const { username, displayName, email, password } = req.body;
  if (!username || !displayName || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  const emailLower    = email.trim().toLowerCase();
  const usernameLower = username.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower))
    return res.status(400).json({ message: "Invalid email address" });
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(usernameLower))
    return res.status(400).json({ message: "Username must be 3–20 chars: letters, numbers, underscores" });

  try {
    const conflict = await pool.query(
      "SELECT id, email, username FROM users WHERE email=$1 OR username=$2",
      [emailLower, usernameLower]
    );
    if (conflict.rows.length > 0) {
      const taken = conflict.rows[0];
      return res.status(400).json({
        message: taken.email === emailLower ? "Email already in use" : "Username already taken",
      });
    }
    const hash   = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, display_name, email, password_hash, is_verified)
       VALUES ($1,$2,$3,$4,FALSE) RETURNING id, username, display_name, email`,
      [usernameLower, displayName.trim(), emailLower, hash]
    );
    const user = result.rows[0];
    const otp  = await storeOtp(user.id, "register");
    await sendOtpEmail(emailLower, user.display_name, otp, "register");
    res.status(201).json({ pendingUserId: user.id, message: `OTP sent to ${emailLower}` });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── POST /login ───────────────────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  const emailLower = email.trim().toLowerCase();

  if (emailLower === process.env.ADMIN_EMAIL!.toLowerCase() &&
      password === process.env.ADMIN_PASSWORD!) {
    try {
      const adminId = await upsertAdminUser();
      return res.json({
        token: issueToken(adminId, true),
        user: { id: adminId, email: process.env.ADMIN_EMAIL, username: "admin", displayName: "Admin", isAdmin: true },
      });
    } catch (err: any) { return res.status(500).json({ message: err.message }); }
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [emailLower]);
    if (result.rows.length === 0)
      return res.status(400).json({ message: "Invalid email or password" });

    const user  = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ message: "Invalid email or password" });

    const otp = await storeOtp(user.id, "login");
    await sendOtpEmail(user.email, user.display_name, otp, "login");
    res.json({ pendingUserId: user.id, message: `OTP sent to ${user.email}` });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── POST /verify-otp ──────────────────────────────────────────────────────────
router.post("/verify-otp", async (req: Request, res: Response) => {
  const { pendingUserId, otp, purpose } = req.body;
  if (!pendingUserId || !otp || !purpose)
    return res.status(400).json({ message: "pendingUserId, otp, and purpose are required" });
  if (!["register", "login"].includes(purpose))
    return res.status(400).json({ message: "Invalid purpose" });

  try {
    const record = await pool.query(
      `SELECT id FROM otp_verifications
       WHERE user_id=$1 AND otp=$2 AND purpose=$3 AND used=FALSE AND expires_at>NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [pendingUserId, otp, purpose]
    );
    if (record.rows.length === 0)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    await pool.query("UPDATE otp_verifications SET used=TRUE WHERE id=$1", [record.rows[0].id]);
    if (purpose === "register")
      await pool.query("UPDATE users SET is_verified=TRUE WHERE id=$1", [pendingUserId]);

    const userResult = await pool.query(
      "SELECT id, username, display_name, email, bio, avatar_url, cover_url, created_at FROM users WHERE id=$1",
      [pendingUserId]
    );
    const user = userResult.rows[0];
    res.json({ token: issueToken(user.id), user: shapeUser(user) });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── POST /resend-otp ──────────────────────────────────────────────────────────
router.post("/resend-otp", async (req: Request, res: Response) => {
  const { pendingUserId, purpose } = req.body;
  if (!pendingUserId || !purpose)
    return res.status(400).json({ message: "pendingUserId and purpose are required" });
  try {
    const result = await pool.query(
      "SELECT id, display_name, email FROM users WHERE id=$1", [pendingUserId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });
    const user = result.rows[0];
    const otp  = await storeOtp(user.id, purpose);
    await sendOtpEmail(user.email, user.display_name, otp, purpose);
    res.json({ message: `OTP resent to ${user.email}` });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── GET /me ───────────────────────────────────────────────────────────────────
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.email, u.bio, u.avatar_url, u.cover_url, u.created_at,
         COUNT(DISTINCT p.id)  AS post_count,
         COUNT(DISTINCT f1.id) AS follower_count,
         COUNT(DISTINCT f2.id) AS following_count
       FROM users u
       LEFT JOIN posts   p  ON p.user_id      = u.id
       LEFT JOIN follows f1 ON f1.following_id = u.id
       LEFT JOIN follows f2 ON f2.follower_id  = u.id
       WHERE u.id=$1 GROUP BY u.id`,
      [req.userId]
    );
    const u = result.rows[0];
    res.json({
      ...shapeUser(u),
      isAdmin: req.isAdmin,
      _count: {
        posts:     parseInt(u.post_count),
        followers: parseInt(u.follower_count),
        following: parseInt(u.following_count),
      },
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── PATCH /profile ────────────────────────────────────────────────────────────
router.patch("/profile", authenticate, async (req: AuthRequest, res: Response) => {
  const { displayName, bio, username } = req.body;
  if (!displayName?.trim())
    return res.status(400).json({ message: "Display name is required" });

  try {
    const newUsername = username?.trim().toLowerCase();
    if (newUsername) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername))
        return res.status(400).json({ message: "Username must be 3–20 chars: letters, numbers, underscores" });
      const conflict = await pool.query(
        "SELECT id FROM users WHERE username=$1 AND id!=$2", [newUsername, req.userId]
      );
      if (conflict.rows.length > 0)
        return res.status(400).json({ message: "Username already taken" });
      const result = await pool.query(
        `UPDATE users SET display_name=$1, bio=$2, username=$3
         WHERE id=$4 RETURNING id, username, display_name, email, bio, avatar_url, cover_url, created_at`,
        [displayName.trim(), bio ?? "", newUsername, req.userId]
      );
      return res.json(shapeUser(result.rows[0]));
    }
    const result = await pool.query(
      `UPDATE users SET display_name=$1, bio=$2
       WHERE id=$3 RETURNING id, username, display_name, email, bio, avatar_url, cover_url, created_at`,
      [displayName.trim(), bio ?? "", req.userId]
    );
    return res.json(shapeUser(result.rows[0]));
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── POST /profile/avatar ──────────────────────────────────────────────────────
router.post(
  "/profile/avatar",
  authenticate,
  upload.single("avatar"),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) return res.status(400).json({ message: "Image file required" });
    try {
      const url = await uploadImageToCloudinary(
        req.file.buffer,
        "campusconnect/avatars",
        `avatar_${req.userId}`   // deterministic ID → overwrites the previous avatar
      );
      await pool.query("UPDATE users SET avatar_url=$1 WHERE id=$2", [url, req.userId]);
      res.json({ avatarUrl: url });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  }
);

// ── POST /profile/cover ───────────────────────────────────────────────────────
router.post(
  "/profile/cover",
  authenticate,
  upload.single("cover"),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) return res.status(400).json({ message: "Image file required" });
    try {
      const url = await uploadImageToCloudinary(
        req.file.buffer,
        "campusconnect/covers",
        `cover_${req.userId}`
      );
      await pool.query("UPDATE users SET cover_url=$1 WHERE id=$2", [url, req.userId]);
      res.json({ coverUrl: url });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  }
);

// ── GET /user/:username ───────────────────────────────────────────────────────
router.get("/user/:username", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url, u.cover_url, u.created_at,
         COUNT(DISTINCT p.id)  AS post_count,
         COUNT(DISTINCT f1.id) AS follower_count,
         COUNT(DISTINCT f2.id) AS following_count,
         BOOL_OR(f3.follower_id=$2) AS is_following
       FROM users u
       LEFT JOIN posts   p  ON p.user_id      = u.id
       LEFT JOIN follows f1 ON f1.following_id = u.id
       LEFT JOIN follows f2 ON f2.follower_id  = u.id
       LEFT JOIN follows f3 ON f3.follower_id=$2 AND f3.following_id=u.id
       WHERE u.username=$1 GROUP BY u.id`,
      [req.params.username, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });
    const u = result.rows[0];
    res.json({
      id: u.id, username: u.username, displayName: u.display_name,
      bio: u.bio, avatarUrl: u.avatar_url, coverUrl: u.cover_url, createdAt: u.created_at,
      isFollowing: u.is_following,
      _count: {
        posts: parseInt(u.post_count),
        followers: parseInt(u.follower_count),
        following: parseInt(u.following_count),
      },
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── POST /user/:username/follow ───────────────────────────────────────────────
router.post("/user/:username/follow", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const target = await pool.query("SELECT id FROM users WHERE username=$1", [req.params.username]);
    if (target.rows.length === 0) return res.status(404).json({ message: "User not found" });
    const targetId = target.rows[0].id;
    if (targetId === req.userId) return res.status(400).json({ message: "Cannot follow yourself" });

    const existing = await pool.query(
      "SELECT id FROM follows WHERE follower_id=$1 AND following_id=$2", [req.userId, targetId]
    );
    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM follows WHERE follower_id=$1 AND following_id=$2", [req.userId, targetId]);
      return res.json({ following: false });
    }
    await pool.query("INSERT INTO follows (follower_id, following_id) VALUES ($1,$2)", [req.userId, targetId]);
    await pool.query(
      "INSERT INTO notifications (user_id, actor_id, type) VALUES ($1,$2,'FOLLOW')", [targetId, req.userId]
    );
    res.json({ following: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── GET /user/:username/posts ─────────────────────────────────────────────────
router.get("/user/:username/posts", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.content, p.created_at, p.media_url, p.media_type,
         u.id AS user_id, u.username, u.display_name, u.avatar_url,
         COUNT(DISTINCT c.id) AS comment_count,
         COUNT(DISTINCT l.id) AS like_count,
         BOOL_OR(l.user_id=$1) AS liked_by_me
       FROM posts p
       JOIN users u ON u.id=p.user_id
       LEFT JOIN comments c ON c.post_id=p.id
       LEFT JOIN likes    l ON l.post_id=p.id
       WHERE u.username=$2
       GROUP BY p.id, u.id ORDER BY p.created_at DESC`,
      [req.userId, req.params.username]
    );
    res.json(result.rows.map(r => ({
      id: r.id, content: r.content, createdAt: r.created_at,
      mediaUrl: r.media_url, mediaType: r.media_type, likedByMe: r.liked_by_me,
      author: { id: r.user_id, username: r.username, displayName: r.display_name, avatarUrl: r.avatar_url },
      _count: { comments: parseInt(r.comment_count), likes: parseInt(r.like_count) },
    })));
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── POST /forgot-password ─────────────────────────────────────────────────────
router.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  const genericMsg = "If an account exists, you will receive a reset email shortly";
  try {
    const result = await pool.query(
      "SELECT id, username, display_name, email FROM users WHERE email=$1 OR username=$1",
      [email.trim().toLowerCase()]
    );
    if (result.rows.length === 0) return res.json({ message: genericMsg });
    const user      = result.rows[0];
    const token     = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)",
      [user.id, token, expiresAt]
    );
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}?resetToken=${token}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: "Password Reset Request - CampusConnect",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#6366f1;">CampusConnect</h2>
          <p>Hi ${user.display_name},</p>
          <p>Click the button below to reset your password. Link expires in <strong>15 minutes</strong>.</p>
          <p style="margin:24px 0;">
            <a href="${resetUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;
              text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color:#64748b;font-size:13px;">If you didn't request this, ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
          <p style="font-size:11px;color:#94a3b8;">CampusConnect · Your college social space</p>
        </div>`,
    });
    res.json({ message: genericMsg });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── POST /reset-password ──────────────────────────────────────────────────────
router.post("/reset-password", async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ message: "Token and password are required" });
  try {
    const result = await pool.query(
      "SELECT user_id FROM password_reset_tokens WHERE token=$1 AND expires_at>NOW()", [token]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ message: "Invalid or expired reset token" });
    const userId = result.rows[0].user_id;
    const hash   = await bcrypt.hash(password, 10);
    await pool.query("UPDATE users SET password_hash=$1 WHERE id=$2", [hash, userId]);
    await pool.query("DELETE FROM password_reset_tokens WHERE token=$1", [token]);
    res.json({ message: "Password reset successfully. You can now sign in." });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;