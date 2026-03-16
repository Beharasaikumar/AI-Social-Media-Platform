import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Heart, MessageCircle, UserPlus, UserCheck,
  Loader2, AlertCircle, Grid3x3,
} from "lucide-react";
import { formatDate } from "../lib/utils";
import type { Post } from "../types";
import client from "../api/client";

interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  createdAt: string;
  isFollowing: boolean;
  _count: { posts: number; followers: number; following: number };
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
      background: `linear-gradient(135deg, ${bg}, ${fg}40)`,
      border: `3px solid white`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 800, color: fg,
      boxShadow: `0 4px 16px ${fg}30`,
    }}>{name[0]?.toUpperCase()}</div>
  );
}

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

export default function UserProfilePage() {
  const { username }                  = useParams<{ username: string }>();
  const navigate                      = useNavigate();
  const [profile, setProfile]         = useState<PublicUser | null>(null);
  const [posts, setPosts]             = useState<Post[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [following, setFollowing]     = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    if (!username) return;
    Promise.all([
      client.get(`/auth/user/${username}`),
      client.get(`/auth/user/${username}/posts`),
    ]).then(([profileRes, postsRes]) => {
      setProfile(profileRes.data);
      setFollowing(profileRes.data.isFollowing);
      setFollowerCount(profileRes.data._count.followers);
      setPosts(postsRes.data);
    }).catch(() => setError("User not found."))
      .finally(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await client.post(`/auth/user/${profile.username}/follow`);
      setFollowing(res.data.following);
      setFollowerCount(prev => res.data.following ? prev + 1 : prev - 1);
    } finally { setFollowLoading(false); }
  };

  // ── Loading ──
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <button onClick={() => navigate(-1)} style={{
        display: "flex", alignItems: "center", gap: "8px", border: "none",
        background: "none", cursor: "pointer", fontSize: "14px",
        fontWeight: 600, color: "var(--text-secondary)", padding: 0,
      }}><ArrowLeft size={16} /> Back</button>
      <div style={{
        background: "white", borderRadius: "20px",
        border: "1.5px solid var(--border)", overflow: "hidden",
      }}>
        <div className="shimmer" style={{ height: 100 }} />
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: -36, marginBottom: 16 }}>
            <div className="shimmer" style={{ width: 72, height: 72, borderRadius: "50%", border: "4px solid white" }} />
            <div className="shimmer" style={{ width: 100, height: 36, borderRadius: 10 }} />
          </div>
          <div className="shimmer" style={{ height: 16, width: "40%", borderRadius: 6, marginBottom: 8 }} />
          <div className="shimmer" style={{ height: 12, width: "25%", borderRadius: 6, marginBottom: 16 }} />
          <div className="shimmer" style={{ height: 12, width: "70%", borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );

  // ── Error ──
  if (error || !profile) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <button onClick={() => navigate(-1)} style={{
        display: "flex", alignItems: "center", gap: "8px", border: "none",
        background: "none", cursor: "pointer", fontSize: "14px",
        fontWeight: 600, color: "var(--text-secondary)", padding: 0,
      }}><ArrowLeft size={16} /> Back</button>
      <div style={{
        background: "white", borderRadius: "18px", padding: "56px 24px",
        textAlign: "center", border: "1.5px solid #fecdd3",
      }}>
        <AlertCircle size={32} style={{ color: "#f43f5e", margin: "0 auto 14px", display: "block" }} />
        <p style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)", margin: "0 0 6px" }}>
          User not found
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          This profile doesn't exist or was removed.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-up">

      {/* Back */}
      <button onClick={() => navigate(-1)} style={{
        display: "flex", alignItems: "center", gap: "8px", border: "none",
        background: "none", cursor: "pointer", fontSize: "14px",
        fontWeight: 600, color: "var(--text-secondary)", padding: 0,
        width: "fit-content", transition: "color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#6366f1"}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Profile hero */}
      <div style={{
        background: "white", borderRadius: "20px",
        border: "1.5px solid var(--border)", overflow: "hidden",
        boxShadow: "0 2px 16px rgba(99,102,241,0.06)",
      }}>
        {/* Banner */}
        <div style={{
          height: 100,
          background: "linear-gradient(135deg, #c7d2fe 0%, #e0e7ff 40%, #fce7f3 100%)",
        }} />

        <div style={{ padding: "0 24px 24px" }}>
          {/* Avatar row */}
          <div style={{
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: -36, marginBottom: 14,
          }}>
            <UserAvatar name={profile.displayName} size={72} />

            {/* Follow button */}
            <button
              onClick={handleFollow}
              disabled={followLoading}
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                padding: "10px 22px", borderRadius: "12px", border: "none",
                background: following
                  ? "var(--surface-2)"
                  : "linear-gradient(135deg, #6366f1, #818cf8)",
                color: following ? "var(--text-secondary)" : "white",
                fontSize: "13px", fontWeight: 700,
                cursor: followLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: following ? "none" : "0 4px 14px rgba(99,102,241,0.3)",
                // border: following ? "1.5px solid var(--border)" : "none",
                marginBottom: 4,
              }}
              onMouseEnter={e => {
                if (following) {
                  (e.currentTarget as HTMLButtonElement).style.background = "#fff1f2";
                  (e.currentTarget as HTMLButtonElement).style.color = "#e11d48";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#fecdd3";
                }
              }}
              onMouseLeave={e => {
                if (following) {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                }
              }}
            >
              {followLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : following ? (
                <UserCheck size={14} />
              ) : (
                <UserPlus size={14} />
              )}
              {followLoading ? "..." : following ? "Following" : "Follow"}
            </button>
          </div>

          {/* Name + bio */}
          <p style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 2px", letterSpacing: "-0.4px", color: "var(--text-primary)" }}>
            {profile.displayName}
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 10px" }}>
            @{profile.username}
          </p>
          {profile.bio && (
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.65 }}>
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div style={{
            display: "flex", paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}>
            <StatBox value={profile._count.posts} label="Posts" />
            <div style={{ width: 1, background: "var(--border)" }} />
            <StatBox value={followerCount} label="Followers" />
            <div style={{ width: 1, background: "var(--border)" }} />
            <StatBox value={profile._count.following} label="Following" />
          </div>
        </div>
      </div>

      {/* Posts */}
      <div style={{
        background: "white", borderRadius: "20px",
        border: "1.5px solid var(--border)", overflow: "hidden",
        boxShadow: "0 2px 16px rgba(99,102,241,0.06)",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <Grid3x3 size={15} style={{ color: "#6366f1" }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
            Posts
          </p>
          <span style={{
            marginLeft: "auto", fontSize: "12px", fontWeight: 700,
            padding: "2px 10px", borderRadius: "99px",
            background: "var(--brand-50)", color: "var(--brand-600)",
            border: "1px solid var(--brand-200)",
          }}>{posts.length}</span>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {posts.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <Grid3x3 size={28} style={{ color: "#e2e8f0", margin: "0 auto 10px", display: "block" }} />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 4px" }}>
                No posts yet
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                {profile.displayName} hasn't posted anything yet
              </p>
            </div>
          ) : (
            posts.map((post, idx) => (
              <div
                key={post.id}
                className={`animate-fade-up stagger-${Math.min(idx + 1, 4)}`}
                onClick={() => navigate(`/post/${post.id}`)}
                style={{
                  background: "var(--surface-2)", borderRadius: "14px",
                  border: "1.5px solid var(--border)", overflow: "hidden",
                  cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(99,102,241,0.1)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                {/* Media */}
                {post.mediaUrl && (
                  <div style={{ borderBottom: "1px solid var(--border)" }}>
                    {post.mediaType === "video" ? (
                      <video src={post.mediaUrl} style={{
                        width: "100%", maxHeight: "280px", display: "block", background: "#000",
                        pointerEvents: "none",
                      }} />
                    ) : (
                      <img src={post.mediaUrl} alt="" style={{
                        width: "100%", maxHeight: "280px", objectFit: "cover", display: "block",
                      }} />
                    )}
                  </div>
                )}

                <div style={{ padding: "14px 16px" }}>
                  {post.content && (
                    <p style={{
                      fontSize: "14px", color: "#374151", margin: "0 0 10px",
                      lineHeight: 1.7, wordBreak: "break-word",
                    }}>{post.content}</p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                      <Heart size={13} style={{ color: "#db2777" }} /> {post._count?.likes ?? 0}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                      <MessageCircle size={13} style={{ color: "#6366f1" }} /> {post._count?.comments ?? 0}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--text-muted)" }}>
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}