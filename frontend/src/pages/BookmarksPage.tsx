// src/pages/BookmarksPage.tsx
import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import type { Post } from "../types";
import { getBookmarkedPosts, bookmarkPost } from "../api/posts";
import { formatDate } from "../lib/utils";
import { Heart, MessageCircle } from "lucide-react";

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
      fontSize: size * 0.34, fontWeight: 700, color: fg,
    }}>{name[0]?.toUpperCase()}</div>
  );
}

export default function BookmarksPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookmarkedPosts().then(setPosts).finally(() => setLoading(false));
  }, []);

  const handleUnbookmark = async (postId: string) => {
    await bookmarkPost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="animate-fade-up">
        <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.4px", color: "var(--text-primary)" }}>Bookmarks</h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Posts you've saved for later</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: "var(--card-bg)", borderRadius: "18px", padding: "20px", border: "1.5px solid var(--border)", display: "flex", gap: "12px" }}>
              <div className="shimmer" style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="shimmer" style={{ height: 12, width: "35%", borderRadius: 6 }} />
                <div className="shimmer" style={{ height: 12, width: "100%", borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ background: "var(--card-bg)", borderRadius: "18px", padding: "56px 32px", textAlign: "center", border: "1.5px solid var(--border)" }}>
          <Bookmark size={36} style={{ color: "var(--text-muted)", margin: "0 auto 14px", display: "block" }} />
          <p style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-secondary)", margin: "0 0 6px" }}>No bookmarks yet</p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Tap the bookmark icon on any post to save it here</p>
        </div>
      ) : (
        posts.map((post, idx) => (
          <div key={post.id} className={`animate-fade-up stagger-${Math.min(idx + 1, 4)}`} style={{
            background: "var(--card-bg)", borderRadius: "18px",
            border: "1.5px solid var(--border)", overflow: "hidden",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(99,102,241,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
          >
            <div style={{ padding: "16px 20px 0", display: "flex", gap: "12px" }}>
              <UserAvatar name={post.author.displayName} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>{post.author.displayName}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", background: "var(--surface-2)", padding: "1px 8px", borderRadius: "99px", border: "1px solid var(--border)" }}>@{post.author.username}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>{formatDate(post.createdAt)}</span>
                  <button onClick={() => handleUnbookmark(post.id)} title="Remove bookmark" style={{
                    border: "none", background: "none", cursor: "pointer",
                    color: "var(--brand-500)", padding: "2px", borderRadius: "6px",
                  }}>
                    <Bookmark size={14} fill="currentColor" />
                  </button>
                </div>
                {post.content && (
                  <p style={{ fontSize: "14px", lineHeight: 1.75, color: "var(--text-secondary)", margin: "8px 0 0", wordBreak: "break-word" }}>
                    {post.content}
                  </p>
                )}
              </div>
            </div>
            {post.mediaUrl && (
              <div style={{ marginTop: "12px", borderTop: "1px solid var(--border)" }}>
                {post.mediaType === "video"
                  ? <video src={post.mediaUrl} controls style={{ width: "100%", maxHeight: "360px", display: "block", background: "#000" }} />
                  : <img src={post.mediaUrl} alt="" style={{ width: "100%", maxHeight: "400px", objectFit: "cover", display: "block" }} />
                }
              </div>
            )}
            <div style={{ padding: "12px 20px", display: "flex", gap: "14px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                <Heart size={13} style={{ color: "#db2777" }} /> {post._count?.likes ?? 0}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                <MessageCircle size={13} style={{ color: "#6366f1" }} /> {post._count?.comments ?? 0}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}