// src/pages/ProfilePage.tsx
import { useState, useEffect, useRef } from "react";
import {
  Heart, MessageCircle, Loader2, Pencil, Grid3x3, X,
  AlertCircle, Repeat2, Camera,
} from "lucide-react";
import { formatDate } from "../lib/utils";
import type { User, Post } from "../types";
import client from "../api/client";

interface ProfilePageProps {
  user: User;
  onUserUpdate: (u: Partial<User>) => void;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function UserAvatar({ name, avatarUrl, size = 38 }: { name: string; avatarUrl?: string; size?: number }) {
  const palettes = [
    { bg: "#ede9fe", fg: "#7c3aed" }, { bg: "#fce7f3", fg: "#db2777" },
    { bg: "#d1fae5", fg: "#059669" }, { bg: "#fef3c7", fg: "#d97706" },
    { bg: "#dbeafe", fg: "#2563eb" }, { bg: "#f3e8ff", fg: "#9333ea" },
  ];
  const { bg, fg } = palettes[name.charCodeAt(0) % palettes.length];
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${bg}, ${fg}50)`,
      border: `2px solid ${fg}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: fg,
    }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

// ── Stat box ─────────────────────────────────────────────────────────────────
function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <p style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 2px", letterSpacing: "-0.5px", color: "var(--text-primary)" }}>
        {value}
      </p>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post, showAuthor = false }: { post: Post; showAuthor?: boolean }) {
  const isPureRepost = !post.content && !post.mediaUrl && !!post.repostOf;
  const display = isPureRepost && post.repostOf ? post.repostOf : post;
  return (
    <div style={{
      background: "var(--card-bg)", borderRadius: "14px", border: "1.5px solid var(--border)",
      overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(99,102,241,0.1)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      {isPureRepost && (
        <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
          <Repeat2 size={12} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>{post.author.displayName} reposted</span>
        </div>
      )}
      {(showAuthor || isPureRepost) && display.author && (
        <div style={{ padding: "10px 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <UserAvatar name={display.author.displayName} avatarUrl={display.author.avatarUrl} size={24} />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{display.author.displayName}</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>@{display.author.username}</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>{formatDate(display.createdAt || post.createdAt)}</span>
        </div>
      )}
      {display.mediaUrl && (
        <div style={{ borderTop: (showAuthor || isPureRepost) ? "1px solid var(--border)" : "none", marginTop: (showAuthor || isPureRepost) ? "10px" : 0 }}>
          {display.mediaType === "video"
            ? <video src={display.mediaUrl} controls style={{ width: "100%", maxHeight: "280px", display: "block", background: "#000" }} />
            : <img src={display.mediaUrl} alt="" style={{ width: "100%", maxHeight: "280px", objectFit: "cover", display: "block" }} />
          }
        </div>
      )}
      <div style={{ padding: "12px 14px" }}>
        {!showAuthor && !isPureRepost && (
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 5px" }}>{formatDate(post.createdAt)}</p>
        )}
        {display.content && (
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: "0 0 10px", lineHeight: 1.7, wordBreak: "break-word" }}>
            {display.content}
          </p>
        )}
        {!display.content && !display.mediaUrl && (
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 10px", fontStyle: "italic" }}>(No content)</p>
        )}
        <div style={{ display: "flex", gap: "14px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
            <Heart size={12} style={{ color: "#db2777" }} /> {post._count?.likes ?? 0}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
            <MessageCircle size={12} style={{ color: "var(--brand-500)" }} /> {post._count?.comments ?? 0}
          </span>
          {(post._count?.reposts ?? 0) > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
              <Repeat2 size={12} style={{ color: "#059669" }} /> {post._count?.reposts}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ user, onSave, onClose }: {
  user: User; onSave: (updated: Partial<User>) => void; onClose: () => void;
}) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername]       = useState(user.username);
  const [bio, setBio]                 = useState(user.bio || "");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [usernameError, setUsernameError] = useState("");

  const handleSave = async () => {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { setUsernameError("3–20 chars, letters, numbers, underscores"); return; }
    if (!displayName.trim()) { setError("Display name is required"); return; }
    setSaving(true); setError(""); setUsernameError("");
    try {
      const res = await client.patch("/auth/profile", {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
      });
      onSave(res.data); onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to save";
      if (msg.toLowerCase().includes("username")) setUsernameError(msg);
      else setError(msg);
    } finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px", borderRadius: "11px",
    border: "1.5px solid var(--border)", fontSize: "14px",
    fontFamily: "inherit", outline: "none", color: "var(--text-primary)",
    background: "var(--input-bg)", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="animate-bounce-in" style={{
        background: "var(--card-bg)", borderRadius: "20px", width: "100%", maxWidth: "440px",
        boxShadow: "var(--shadow-modal)", border: "1px solid var(--border)", overflow: "hidden",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>Edit profile</p>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Update your public info</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "10px", border: "none", background: "var(--surface-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Display name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Display Name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. John Doe" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "var(--brand-400)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")} />
          </div>
          {/* Username */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Username</label>
            <input value={username} onChange={e => { setUsernameError(""); setUsername(e.target.value); }}
              placeholder="e.g. john_doe"
              style={{ ...inputStyle, borderColor: usernameError ? "#fca5a5" : "var(--border)" }}
              onFocus={e => (e.target.style.borderColor = usernameError ? "#f87171" : "var(--brand-400)")}
              onBlur={e => (e.target.style.borderColor = usernameError ? "#fca5a5" : "var(--border)")} />
            {usernameError
              ? <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#e11d48" }}><AlertCircle size={12} /> {usernameError}</div>
              : <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>3–20 chars · letters, numbers, underscores</p>
            }
          </div>
          {/* Bio */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Bio</label>
            <textarea rows={3} placeholder="Tell your campus about yourself…" value={bio} onChange={e => setBio(e.target.value)}
              style={{ ...inputStyle, resize: "none" }}
              onFocus={e => (e.target.style.borderColor = "var(--brand-400)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")} />
          </div>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid #fecdd3", fontSize: "13px", color: "#e11d48", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <button onClick={handleSave} disabled={saving} style={{
            padding: "12px", borderRadius: "12px", border: "none",
            background: "linear-gradient(135deg, #6366f1, #818cf8)",
            color: "white", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            boxShadow: "0 4px 16px rgba(99,102,241,0.35)", opacity: saving ? 0.8 : 1,
          }}>
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProfilePage ───────────────────────────────────────────────────────────────
export default function ProfilePage({ user, onUserUpdate }: ProfilePageProps) {
  const [activeTab, setActiveTab]     = useState<"posts" | "liked">("posts");
  const [myPosts, setMyPosts]         = useState<Post[]>([]);
  const [likedPosts, setLikedPosts]   = useState<Post[]>([]);
  const [loading, setLoading]         = useState(true);
  const [editOpen, setEditOpen]       = useState(false);

  // ── Image upload state ────────────────────────────────────────────────────
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading]   = useState(false);
  const [avatarPreview, setAvatarPreview]     = useState<string | null>(null);
  const [coverPreview, setCoverPreview]       = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);

  const totalLikes = myPosts.reduce((sum, p) => sum + (p._count?.likes ?? 0), 0);

  useEffect(() => {
    client.get("/posts").then(res => {
      const all: Post[] = res.data;
      setMyPosts(all.filter(p => p.author.id === user.id));
      setLikedPosts(all.filter(p => p.likedByMe));
    }).finally(() => setLoading(false));
  }, [user.id]);

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show preview immediately
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await client.post("/auth/profile/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUserUpdate({ avatarUrl: res.data.avatarUrl });
    } catch {
      setAvatarPreview(null); // revert preview on error
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  // ── Cover upload ──────────────────────────────────────────────────────────
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    setCoverUploading(true);
    try {
      const form = new FormData();
      form.append("cover", file);
      const res = await client.post("/auth/profile/cover", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUserUpdate({ coverUrl: res.data.coverUrl });
    } catch {
      setCoverPreview(null);
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const displayedPosts = activeTab === "posts" ? myPosts : likedPosts;
  const currentAvatar  = avatarPreview ?? user.avatarUrl;
  const currentCover   = coverPreview  ?? user.coverUrl;

  return (
    <>
      {/* Hidden file inputs */}
      <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }} onChange={handleAvatarChange} />
      <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }} onChange={handleCoverChange} />

      {editOpen && (
        <EditModal user={user} onSave={u => { onUserUpdate(u); setEditOpen(false); }} onClose={() => setEditOpen(false)} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* ── Profile hero card ─────────────────────────────────────────── */}
        <div className="animate-fade-up" style={{
          background: "var(--card-bg)", borderRadius: "20px",
          border: "1.5px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-card)",
        }}>

          {/* Cover photo */}
          <div style={{ position: "relative", height: "140px" }}>
            {currentCover ? (
              <img src={currentCover} alt="Cover"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                background: "linear-gradient(135deg, #c7d2fe 0%, #e0e7ff 40%, #fce7f3 100%)",
              }} />
            )}

            {/* Cover upload overlay */}
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              style={{
                position: "absolute", top: 10, right: 10,
                background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
                border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: "10px",
                color: "white", cursor: coverUploading ? "not-allowed" : "pointer",
                padding: "7px 12px", fontSize: "12px", fontWeight: 600,
                display: "flex", alignItems: "center", gap: "6px",
                fontFamily: "inherit", transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!coverUploading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.65)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.45)"; }}
            >
              {coverUploading
                ? <><Loader2 size={13} className="animate-spin" /> Uploading…</>
                : <><Camera size={13} /> {currentCover ? "Change cover" : "Add cover"}</>
              }
            </button>
          </div>

          <div style={{ padding: "0 24px 22px" }}>
            <div style={{
              marginTop: "-40px", marginBottom: "12px",
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            }}>
              {/* Avatar with upload button */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  border: "4px solid var(--card-bg)",
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.25)",
                }}>
                  {currentAvatar ? (
                    <img src={currentAvatar} alt={user.displayName}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%",
                      background: "linear-gradient(135deg, #6366f1, #818cf8)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "28px", fontWeight: 800, color: "white",
                    }}>
                      {user.displayName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Camera icon overlay on avatar */}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  title="Change profile picture"
                  style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 26, height: 26, borderRadius: "50%",
                    background: avatarUploading ? "rgba(99,102,241,0.7)" : "#6366f1",
                    border: "2.5px solid var(--card-bg)",
                    cursor: avatarUploading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!avatarUploading) (e.currentTarget as HTMLButtonElement).style.background = "#4f46e5"; }}
                  onMouseLeave={e => { if (!avatarUploading) (e.currentTarget as HTMLButtonElement).style.background = "#6366f1"; }}
                >
                  {avatarUploading
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Camera size={11} />
                  }
                </button>
              </div>

              {/* Edit profile button */}
              <button onClick={() => setEditOpen(true)} style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", borderRadius: "10px",
                border: "1.5px solid var(--border)", background: "var(--card-bg)",
                fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                marginBottom: "4px",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-400)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-500)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
              >
                <Pencil size={12} /> Edit profile
              </button>
            </div>

            <p style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 2px", letterSpacing: "-0.4px", color: "var(--text-primary)" }}>
              {user.displayName}
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 10px" }}>@{user.username}</p>
            {user.bio && (
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.65 }}>
                {user.bio}
              </p>
            )}

            {/* Stats */}
            <div style={{ display: "flex", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
              <StatBox value={myPosts.length} label="Posts" />
              <div style={{ width: 1, background: "var(--border)" }} />
              <StatBox value={user._count?.followers ?? 0} label="Followers" />
              <div style={{ width: 1, background: "var(--border)" }} />
              <StatBox value={user._count?.following ?? 0} label="Following" />
              <div style={{ width: 1, background: "var(--border)" }} />
              <StatBox value={totalLikes} label="Likes received" />
            </div>
          </div>
        </div>

        {/* ── Posts / Liked tabs ────────────────────────────────────────── */}
        <div className="animate-fade-up stagger-2" style={{
          background: "var(--card-bg)", borderRadius: "20px",
          border: "1.5px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-card)",
        }}>
          <div style={{ display: "flex", borderBottom: "1.5px solid var(--border)" }}>
            {(["posts", "liked"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: "14px 16px", border: "none", background: "none",
                fontFamily: "inherit", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                color: activeTab === tab ? "var(--brand-500)" : "var(--text-muted)",
                borderBottom: activeTab === tab ? "2.5px solid var(--brand-500)" : "2.5px solid transparent",
                marginBottom: "-1.5px", transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}>
                {tab === "posts"
                  ? <><Grid3x3 size={14} /> Posts ({myPosts.length})</>
                  : <><Heart size={14} /> Liked ({likedPosts.length})</>
                }
              </button>
            ))}
          </div>

          <div style={{ padding: "18px" }}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[1, 2].map(i => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div className="shimmer" style={{ height: 13, width: "40%", borderRadius: 6 }} />
                    <div className="shimmer" style={{ height: 13, width: "100%", borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            ) : displayedPosts.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "16px", background: "var(--surface-2)",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
                }}>
                  {activeTab === "posts" ? <Grid3x3 size={22} style={{ color: "var(--text-muted)" }} /> : <Heart size={22} style={{ color: "var(--text-muted)" }} />}
                </div>
                <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-secondary)", margin: "0 0 6px" }}>
                  {activeTab === "posts" ? "No posts yet" : "No liked posts yet"}
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                  {activeTab === "posts" ? "Share something with your campus!" : "Posts you like will appear here"}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {displayedPosts.map(post => <PostCard key={post.id} post={post} showAuthor={activeTab === "liked"} />)}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}