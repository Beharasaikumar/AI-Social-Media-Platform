import { useState, useEffect } from "react";
import { Heart, MessageCircle, Loader2, Pencil, Grid3x3, BookMarked, X } from "lucide-react";
import { formatDate } from "../lib/utils";
import type { User, Post } from "../types";
import client from "../api/client";

interface ProfilePageProps {
  user: User;
  onUserUpdate: (u: User) => void;
}

function UserAvatar({ name, size = 38 }: { name: string; size?: number }) {
  const palettes = [
    { bg: "#ede9fe", fg: "#7c3aed" }, { bg: "#fce7f3", fg: "#db2777" },
    { bg: "#d1fae5", fg: "#059669" }, { bg: "#fef3c7", fg: "#d97706" },
    { bg: "#dbeafe", fg: "#2563eb" }, { bg: "#f3e8ff", fg: "#9333ea" },
  ];
  const { bg, fg } = palettes[name.charCodeAt(0) % palettes.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${bg}, ${fg}30)`,
      border: `2.5px solid ${fg}25`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: fg,
      boxShadow: `0 2px 10px ${fg}20`,
    }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <p style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 2px", letterSpacing: "-0.5px", color: "var(--text-primary)" }}>{value}</p>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

function PostCard({ post, showAuthor = false }: { post: Post; showAuthor?: boolean }) {
  return (
    <div style={{
      background: "white", borderRadius: "16px",
      border: "1.5px solid var(--border)",
      overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(99,102,241,0.1)";
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
    }}
    >
      {/* Author row (only in Liked tab) */}
      {showAuthor && (
        <div style={{
          padding: "12px 16px 0",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <UserAvatar name={post.author.displayName} size={24} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
            {post.author.displayName}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
            {formatDate(post.createdAt)}
          </span>
        </div>
      )}

      {/* Media */}
      {post.mediaUrl && (
        <div style={{
          borderTop: showAuthor ? "1px solid var(--border)" : "none",
          marginTop: showAuthor ? "10px" : 0,
        }}>
          {post.mediaType === "video" ? (
            <video src={post.mediaUrl} controls style={{
              width: "100%", maxHeight: "280px", display: "block", background: "#000",
            }} />
          ) : (
            <img src={post.mediaUrl} alt="" style={{
              width: "100%", maxHeight: "280px", objectFit: "cover", display: "block",
            }} />
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "14px 16px" }}>
        {!showAuthor && (
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 6px" }}>
            {formatDate(post.createdAt)}
          </p>
        )}
        {post.content && (
          <p style={{
            fontSize: "14px", color: "#374151", margin: "0 0 12px",
            lineHeight: 1.7, wordBreak: "break-word",
          }}>{post.content}</p>
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: "16px" }}>
          <span style={{
            display: "flex", alignItems: "center", gap: "5px",
            fontSize: "12px", color: "var(--text-muted)", fontWeight: 500,
          }}>
            <Heart size={13} style={{ color: "#db2777" }} /> {post._count?.likes ?? 0}
          </span>
          <span style={{
            display: "flex", alignItems: "center", gap: "5px",
            fontSize: "12px", color: "var(--text-muted)", fontWeight: 500,
          }}>
            <MessageCircle size={13} style={{ color: "#6366f1" }} /> {post._count?.comments ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}

function EditModal({ user, onSave, onClose }: {
  user: User;
  onSave: (u: User) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ displayName: user.displayName, bio: user.bio || "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.displayName.trim()) return setError("Display name is required");
    setSaving(true);
    try {
      const res = await client.patch("/auth/profile", form);
      onSave({ ...user, ...res.data });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(15,17,23,0.5)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", animation: "fadeIn 0.2s ease",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="animate-bounce-in" style={{
        background: "white", borderRadius: "20px",
        width: "100%", maxWidth: "440px",
        boxShadow: "0 24px 60px rgba(99,102,241,0.18)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>Edit profile</p>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Update your public information</p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "10px", border: "none",
            background: "var(--surface-2)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)",
          }}><X size={16} /></button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.3px" }}>DISPLAY NAME</label>
            <input
              value={form.displayName}
              onChange={e => setForm({ ...form, displayName: e.target.value })}
              style={{
                padding: "11px 14px", borderRadius: "12px",
                border: "1.5px solid var(--border)", fontSize: "14px",
                fontFamily: "inherit", outline: "none", color: "var(--text-primary)",
                background: "var(--surface-2)", transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "#818cf8")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.3px" }}>BIO</label>
            <textarea
              rows={3}
              placeholder="Tell your campus about yourself…"
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              style={{
                padding: "11px 14px", borderRadius: "12px",
                border: "1.5px solid var(--border)", fontSize: "14px",
                fontFamily: "inherit", outline: "none", resize: "none",
                color: "var(--text-primary)", background: "var(--surface-2)",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "#818cf8")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: "10px",
              background: "#fff1f2", border: "1px solid #fecdd3",
              fontSize: "13px", color: "#e11d48",
            }}>{error}</div>
          )}
          <button onClick={handleSave} disabled={saving} style={{
            padding: "12px", borderRadius: "12px", border: "none",
            background: "linear-gradient(135deg, #6366f1, #818cf8)",
            color: "white", fontSize: "14px", fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
            opacity: saving ? 0.8 : 1,
          }}>
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage({ user, onUserUpdate }: ProfilePageProps) {
  const [activeTab, setActiveTab]   = useState<"posts" | "liked">("posts");
  const [myPosts, setMyPosts]       = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loading, setLoading]       = useState(true);
  const [editOpen, setEditOpen]     = useState(false);

  const totalLikes = myPosts.reduce((sum, p) => sum + (p._count?.likes ?? 0), 0);

  useEffect(() => {
    client.get("/posts").then(res => {
      const all: Post[] = res.data;
      setMyPosts(all.filter(p => p.author.id === user.id));
      setLikedPosts(all.filter(p => p.likedByMe));
    }).finally(() => setLoading(false));
  }, [user.id]);

  const displayedPosts = activeTab === "posts" ? myPosts : likedPosts;

  return (
    <>
      {editOpen && (
        <EditModal
          user={user}
          onSave={u => { onUserUpdate(u); setEditOpen(false); }}
          onClose={() => setEditOpen(false)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* ── Profile hero card ── */}
        <div className="animate-fade-up" style={{
          background: "white", borderRadius: "20px",
          border: "1.5px solid var(--border)", overflow: "hidden",
          boxShadow: "0 2px 16px rgba(99,102,241,0.06)",
        }}>
          {/* Banner */}
          <div style={{
            height: "100px",
            background: "linear-gradient(135deg, #c7d2fe 0%, #e0e7ff 40%, #fce7f3 100%)",
            position: "relative",
          }} />

          {/* Avatar + Edit */}
          <div style={{
            padding: "0 24px 24px",
            position: "relative",
          }}>
            {/* Avatar overlapping banner */}
            <div style={{
              marginTop: "-36px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                border: "4px solid white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "26px", fontWeight: 800, color: "white",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                flexShrink: 0,
              }}>
                {user.displayName[0]?.toUpperCase()}
              </div>
              <button onClick={() => setEditOpen(true)} style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", borderRadius: "10px",
                border: "1.5px solid var(--border)", background: "white",
                fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)",
                cursor: "pointer", transition: "all 0.15s",
                marginBottom: "4px",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#6366f1"; (e.currentTarget as HTMLButtonElement).style.color = "#6366f1"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
              >
                <Pencil size={12} /> Edit profile
              </button>
            </div>

            {/* Name + bio */}
            <p style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 2px", letterSpacing: "-0.4px", color: "var(--text-primary)" }}>
              {user.displayName}
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 12px" }}>@{user.username}</p>
            {user.bio && (
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.6 }}>
                {user.bio}
              </p>
            )}

            {/* Stats row */}
            <div style={{
              display: "flex",
              gap: "0",
              paddingTop: "16px",
              borderTop: "1px solid var(--border)",
            }}>
              <StatBox value={myPosts.length} label="Posts" />
              <div style={{ width: "1px", background: "var(--border)" }} />
              <StatBox value={user._count?.followers ?? 0} label="Followers" />
              <div style={{ width: "1px", background: "var(--border)" }} />
              <StatBox value={user._count?.following ?? 0} label="Following" />
              <div style={{ width: "1px", background: "var(--border)" }} />
              <StatBox value={totalLikes} label="Likes received" />
            </div>
          </div>
        </div>

        {/* ── Tabs + Posts ── all in one contained block ── */}
        <div className="animate-fade-up stagger-2" style={{
          background: "white", borderRadius: "20px",
          border: "1.5px solid var(--border)",
          overflow: "hidden",
          boxShadow: "0 2px 16px rgba(99,102,241,0.06)",
        }}>
          {/* Tab headers */}
          <div style={{
            display: "flex",
            borderBottom: "1.5px solid var(--border)",
          }}>
            {(["posts", "liked"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: "14px 16px",
                  border: "none", background: "none",
                  fontSize: "13px", fontWeight: 700,
                  cursor: "pointer",
                  color: activeTab === tab ? "#6366f1" : "var(--text-muted)",
                  borderBottom: activeTab === tab ? "2.5px solid #6366f1" : "2.5px solid transparent",
                  marginBottom: "-1.5px",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                }}
              >
                {tab === "posts"
                  ? <><Grid3x3 size={14} /> Posts ({myPosts.length})</>
                  : <><Heart size={14} /> Liked ({likedPosts.length})</>
                }
              </button>
            ))}
          </div>

          {/* Posts grid/list */}
          <div style={{ padding: "20px" }}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[1, 2].map(i => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div className="shimmer" style={{ height: 14, width: "40%", borderRadius: 6 }} />
                    <div className="shimmer" style={{ height: 12, width: "100%", borderRadius: 6 }} />
                    <div className="shimmer" style={{ height: 12, width: "70%", borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            ) : displayedPosts.length === 0 ? (
              <div style={{
                padding: "40px 20px", textAlign: "center",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "16px",
                  background: "var(--surface-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 14px",
                }}>
                  {activeTab === "posts"
                    ? <Grid3x3 size={22} style={{ color: "var(--text-muted)" }} />
                    : <Heart size={22} style={{ color: "var(--text-muted)" }} />
                  }
                </div>
                <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-secondary)", margin: "0 0 6px" }}>
                  {activeTab === "posts" ? "No posts yet" : "No liked posts yet"}
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                  {activeTab === "posts"
                    ? "Share something with your campus!"
                    : "Posts you like will appear here"}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {displayedPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    showAuthor={activeTab === "liked"}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}